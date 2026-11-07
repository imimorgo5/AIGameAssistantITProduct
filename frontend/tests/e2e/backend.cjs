const http = require("node:http");
const game = {
  id: 7,
  title: "Тестовая игра",
  description: "Описание настольной игры",
  categories: [],
  imageFileTitle: null,
  rulesFileTitle: null,
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
const page = (content) => ({
  content,
  totalElements: content.length,
  totalPages: 1,
  page: 0,
  size: 10,
});
http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1:8100");
    res.setHeader("Content-Type", "application/json");
    const send = (value) => res.end(JSON.stringify(value));
    if (url.pathname === "/api/games/paged") return send(page([game]));
    if (url.pathname === "/api/categories") return send([]);
    if (url.pathname === "/api/games/7") return send(game);
    if (url.pathname === "/api/auth/login")
      return send({ accessToken: "test-access", refreshToken: "test-refresh" });
    if (url.pathname === "/api/auth/token")
      return send({ accessToken: "test-access", refreshToken: null });
    if (url.pathname === "/api/auth/logout") return send({ success: true });
    if (req.headers.authorization !== "Bearer test-access") {
      res.statusCode = 401;
      return send({ message: "Войдите в аккаунт" });
    }
    if (url.pathname === "/api/auth/me") return send(user);
    if (url.pathname === "/api/chat/paged") return send(page([]));
    if (url.pathname === "/api/models")
      return send([{ id: "test", name: "Test" }]);
    if (url.pathname === "/api/system/model") return send({ model: "test" });
    if (url.pathname === "/api/favourites/paged") return send(page([]));
    res.statusCode = 404;
    send({ message: "Не найдено" });
  })
  .listen(8100, "127.0.0.1");
