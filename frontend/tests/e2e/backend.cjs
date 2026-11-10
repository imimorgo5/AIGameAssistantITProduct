const http = require("node:http");
const { deflateSync } = require("node:zlib");
let prompt = "Отвечай по официальным правилам игры.";
function pdf(scanned = false) {
  const content = scanned
    ? "q 100 0 0 100 50 50 cm /Im0 Do Q"
    : "BT /F1 12 Tf 40 740 Td (Players roll one die and move their piece forward. The player with the highest score wins the game. A turn consists of rolling, moving and scoring.) Tj ET";
  const image = deflateSync(Buffer.from([220, 220, 220]));
  const objects = [
    Buffer.from("<< /Type /Catalog /Pages 2 0 R >>"),
    Buffer.from("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    Buffer.from(
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> /XObject << /Im0 6 0 R >> >> /Contents 4 0 R >>",
    ),
    Buffer.from(
      `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
    ),
    Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"),
    Buffer.concat([
      Buffer.from(
        `<< /Type /XObject /Subtype /Image /Width 1 /Height 1 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${image.length} >>\nstream\n`,
      ),
      image,
      Buffer.from("\nendstream"),
    ]),
  ];
  const buffers = [Buffer.from("%PDF-1.4\n")];
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.concat(buffers).length);
    buffers.push(
      Buffer.from(`${index + 1} 0 obj\n`),
      object,
      Buffer.from("\nendobj\n"),
    );
  }
  const start = Buffer.concat(buffers).length;
  buffers.push(
    Buffer.from(
      `xref\n0 ${offsets.length}\n0000000000 65535 f \n${offsets
        .slice(1)
        .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
        .join(
          "",
        )}trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`,
    ),
  );
  return Buffer.concat(buffers);
}
async function body(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString() || "{}");
}
const game = {
  id: 7,
  title: "Тестовая игра",
  description: "Описание настольной игры",
  categories: [],
  imageFileTitle: null,
  rulesFileTitle: "rules.pdf",
};
const user = {
  id: 1,
  email: "player@example.com",
  login: "player",
  isAdmin: false,
  isEnabled: true,
  imageFileTitle: null,
  model: "test",
};
let models = [
  {
    id: "test",
    name: "Test One",
    remoteId: "test/one",
    enabled: true,
    maxOutputTokens: 4096,
  },
];
let defaultModel = "test";
const chats = new Map();
const guests = new Map();
let nextChat = 12;
const answerText = "TL;DR: Первый ответ\n\nПодробно\nПравило из документа.";
const page = (content) => ({
  content,
  totalElements: content.length,
  totalPages: 1,
  page: 0,
  size: 10,
});
http
  .createServer(async (req, res) => {
    const url = new URL(req.url, "http://127.0.0.1:8100");
    res.setHeader("Content-Type", "application/json");
    const send = (value) => res.end(JSON.stringify(value));
    const fail = (message, status = 400) => {
      res.statusCode = status;
      send({ message });
    };
    const admin = req.headers.authorization === "Bearer test-admin";
    const authenticated =
      admin || req.headers.authorization === "Bearer test-access";
    const stream = (complete) => {
      res.setHeader("Content-Type", "text/event-stream");
      res.write(`data:${answerText.split("\n").join("\ndata:")}\n\n`);
      setTimeout(() => {
        complete?.();
        res.end("event:done\ndata:ok\n\n");
      }, 100);
    };
    if (url.pathname === "/api/games/paged")
      return send(
        page(
          Array.from({ length: 10 }, (_, index) => ({
            ...game,
            id: index + 7,
            title: index === 0 ? game.title : `Игра ${index + 1}`,
            imageFileTitle: "cover.svg",
          })),
        ),
      );
    if (url.pathname === "/api/categories") return send([]);
    if (/^\/api\/games\/\d+\/rules\/status$/.test(url.pathname))
      return send({ status: "ready", error: "" });
    if (url.pathname === "/api/games/7") return send(game);
    if (url.pathname === "/api/games/8")
      return send({
        ...game,
        id: 8,
        title: "Сканированная игра",
        rulesFileTitle: "scan.pdf",
      });
    if (url.pathname.startsWith("/api/files/rules/")) {
      res.setHeader("Content-Type", "application/pdf");
      return res.end(pdf(url.pathname.endsWith("scan.pdf")));
    }
    if (url.pathname === "/api/auth/login") {
      const input = await body(req);
      return send({
        accessToken:
          input.email === "admin@example.com" ? "test-admin" : "test-access",
        refreshToken: "test-refresh",
      });
    }
    if (url.pathname === "/api/auth/token")
      return send({ accessToken: "test-access", refreshToken: null });
    if (url.pathname === "/api/auth/logout") return send({ success: true });
    if (url.pathname.startsWith("/api/guest/")) {
      const cookie =
        req.headers.cookie?.match(/ga_guest=([^;]+)/)?.[1] ??
        require("node:crypto").randomUUID();
      res.setHeader(
        "Set-Cookie",
        `ga_guest=${cookie}; HttpOnly; Path=/; SameSite=Lax`,
      );
      const state = guests.get(cookie) ?? { used: 0, last: 0 };
      if (url.pathname.endsWith("/status"))
        return send({
          remaining: 5 - state.used,
          limit: 5,
          resetsAt: new Date(Date.now() + 86400000).toISOString(),
          modelId: defaultModel,
        });
      if (state.used >= 5 || Date.now() - state.last < 10000)
        return fail("Подождите 10 секунд перед следующим вопросом", 429);
      state.used++;
      state.last = Date.now();
      guests.set(cookie, state);
      return stream();
    }
    if (url.pathname === "/api/models" && req.method === "GET")
      return send(models.filter((m) => m.enabled));
    if (!authenticated) return fail("Войдите в аккаунт", 401);
    if (url.pathname === "/api/auth/me")
      return send({ ...user, isAdmin: admin });
    if (url.pathname.startsWith("/api/models")) {
      if (!admin) return fail("Недостаточно прав", 403);
      if (url.pathname.endsWith("/registry"))
        return send({ models, defaultModel });
      if (url.pathname.endsWith("/catalog"))
        return send([
          { id: "test/one", name: "Test One", maxOutputTokens: 8192 },
          { id: "test/two", name: "Test Two", maxOutputTokens: 4096 },
        ]);
      if (req.method === "POST") {
        const input = await body(req);
        if (models.some((m) => m.remoteId === input.remoteId))
          return fail("Эта модель уже добавлена", 409);
        models.push({
          ...input,
          id: require("node:crypto").randomUUID(),
          enabled: true,
        });
        return send({ success: true });
      }
      const id = url.pathname.split("/").at(-1);
      const item = models.find((m) => m.id === id);
      if (!item) return fail("Модель не найдена", 404);
      if (req.method === "DELETE") models = models.filter((m) => m.id !== id);
      if (req.method === "PATCH") {
        const input = await body(req);
        item.enabled = input.enabled;
      }
      if (defaultModel === id && !item.enabled)
        defaultModel = models.find((m) => m.enabled)?.id;
      return send({ success: true });
    }
    if (url.pathname === "/api/system/model") {
      if (req.method === "PATCH") defaultModel = (await body(req)).model;
      return send({ model: defaultModel });
    }
    if (url.pathname === "/api/system/prompt") {
      if (req.method === "PATCH") prompt = (await body(req)).prompt;
      res.setHeader("Content-Type", "text/plain");
      return res.end(prompt);
    }
    if (/\/api\/users\/\d+\/model$/.test(url.pathname)) {
      user.model = url.searchParams.get("model");
      return send({ success: true });
    }
    if (url.pathname === "/api/chat/paged")
      return send(
        page(
          [...chats.values()].filter(
            (c) =>
              !url.searchParams.get("gameId") ||
              c.gameId === Number(url.searchParams.get("gameId")),
          ),
        ),
      );
    if (url.pathname === "/api/chat/start") {
      const input = await body(req);
      const timestamp = new Date().toISOString();
      const chat = {
        id: nextChat++,
        gameId: input.gameId,
        title: input.request,
        lastUseTime: timestamp,
        messageDTOs: [{ role: "user", text: input.request, timestamp }],
      };
      chats.set(chat.id, chat);
      return send(chat);
    }
    if (url.pathname.startsWith("/api/chat/")) {
      const id = Number(url.pathname.split("/")[3]);
      const chat = chats.get(id);
      if (!chat) return fail("Чат не найден", 404);
      if (url.pathname.endsWith("/answer"))
        return stream(() =>
          chat.messageDTOs.push({
            role: "assistant",
            text: answerText,
            timestamp: new Date().toISOString(),
          }),
        );
      if (req.method === "PUT")
        chat.messageDTOs.push({
          role: "user",
          text: (await body(req)).prompt,
          timestamp: new Date().toISOString(),
        });
      if (req.method === "DELETE") chats.delete(id);
      return send(chat);
    }
    if (url.pathname === "/api/favourites/paged") return send(page([]));
    return fail("Не найдено", 404);
  })
  .listen(8100, "127.0.0.1");
