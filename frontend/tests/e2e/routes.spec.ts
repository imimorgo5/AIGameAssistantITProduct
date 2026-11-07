import { expect, test } from "@playwright/test";

test("renders catalog HTML on the server and hydrates without errors", async ({
  page,
  request,
}, testInfo) => {
  const html = await (await request.get("/")).text();
  expect(html).toContain("Тестовая игра");
  expect(html).toContain("AIGameAssistant - Каталог игр");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Вход", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Тестовая игра").first()).toBeVisible();
  await expect(page.locator("body")).toHaveJSProperty(
    "scrollWidth",
    await page.locator("body").evaluate((body) => body.clientWidth),
  );
  await page.screenshot({
    path: testInfo.outputPath("catalog.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("navigates auth forms, preserves reset query, and returns a real 404", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(page).toHaveTitle("AIGameAssistant - Вход");
  await page.getByRole("link", { name: "Зарегистрироваться" }).click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page).toHaveTitle("AIGameAssistant - Регистрация");
  await page.goto("/reset-password?token=example");
  await expect(page.getByPlaceholder("Введите новый пароль")).toBeVisible();
  const missing = await page.goto("/no-such-page");
  expect(missing?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Кажется, вы вышли за поле" }),
  ).toBeVisible();
});

test("protects routes on the server and hides tokens from browser JavaScript", async ({
  page,
  context,
}) => {
  for (const path of ["/profile", "/admin", "/games/ai/7"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  }
  const login = await context.request.post("/api/auth/login", {
    data: { email: "player@example.com", password: "password" },
    headers: { "X-Requested-With": "XMLHttpRequest" },
  });
  expect(await login.json()).toEqual({ success: true });
  expect(
    (await context.cookies())
      .filter((cookie) => cookie.name.startsWith("ga_"))
      .every((cookie) => cookie.httpOnly),
  ).toBe(true);
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/profile$/);
  expect(await page.evaluate(() => document.cookie)).not.toContain("ga_access");
  expect(
    await page.evaluate(() => localStorage.getItem("access_token")),
  ).toBeNull();
  await page.goto("/admin");
  await expect(page).toHaveURL("/");
});

test("serves PDF runtime assets and rejects cross-origin mutations", async ({
  request,
}) => {
  expect((await request.get("/pdf.worker.min.mjs")).status()).toBe(200);
  expect((await request.get("/pdfjs/wasm/openjpeg.wasm")).status()).toBe(200);
  const response = await request.post("/api/auth/login", {
    data: {},
    headers: {
      Origin: "https://attacker.example",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  expect(response.status()).toBe(403);
});

test("keeps the first streamed answer and fits the chat in the viewport", async ({
  page,
  context,
}) => {
  await context.request.post("/api/auth/login", {
    data: { email: "player@example.com", password: "password" },
    headers: { "X-Requested-With": "XMLHttpRequest" },
  });
  await page.goto("/games/ai/7");
  await page
    .getByRole("textbox", { name: "Текст сообщения" })
    .fill("Первый вопрос");
  await page.getByRole("button", { name: "Отправить", exact: true }).click();
  await expect(page.getByText("Первый ответ", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/games\/ai\/7\/12$/);
  await expect(page.getByText("Первый вопрос", { exact: true })).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    height: window.innerHeight,
    page: document.documentElement.scrollHeight,
    chat: document.querySelector("[data-chat-page]")?.getBoundingClientRect()
      .height,
  }));
  expect(dimensions.page).toBe(dimensions.height);
  expect(dimensions.chat).toBe(dimensions.height);
  await expect(
    page.getByRole("button", { name: "Скопировать ответ" }),
  ).toBeVisible();
  if (
    await page.getByRole("button", { name: "Открыть список чатов" }).isVisible()
  ) {
    await page.getByRole("button", { name: "Открыть список чатов" }).click();
  }
  await page.getByRole("button", { name: "Новый чат", exact: true }).click();
  await expect(page).toHaveURL(/\/games\/ai\/7$/);
  await expect(
    page.getByText("Чем я могу помочь?", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Первый ответ", { exact: true })).toHaveCount(0);
});

test("limits regular pages to 1920 pixels", async ({ page }) => {
  await page.setViewportSize({ width: 2560, height: 1080 });
  await page.goto("/login");
  await expect(page.locator("[class*=auth-container]")).toHaveCSS(
    "max-width",
    "1920px",
  );
  expect(
    await page
      .locator("[class*=auth-container]")
      .evaluate((element) => element.getBoundingClientRect().width),
  ).toBe(1920);
  await page.goto("/");
  await expect(page.getByRole("banner")).toBeVisible();
  const geometry = await page.evaluate(() => {
    const rect = (selector: string) =>
      Array.from(document.querySelectorAll(selector))
        .map((element) => element.getBoundingClientRect().width)
        .find((width) => width > 0) ?? 0;
    return {
      viewport: document.documentElement.clientWidth,
      header: rect("header"),
      hero: rect("[class*=hero-root]"),
      headerContent: rect("[class*=header-inner]"),
      heroContent: rect("[class*=hero-inner]"),
    };
  });
  expect(geometry.header).toBe(geometry.viewport);
  expect(geometry.hero).toBe(geometry.viewport);
  expect(geometry.headerContent).toBeLessThanOrEqual(1920);
  expect(geometry.heroContent).toBeLessThanOrEqual(1920);
  await page.goto("/login");
  await page.getByPlaceholder("Введите e-mail").blur();
  await page.getByPlaceholder("Введите пароль").fill("a");
  await page.getByPlaceholder("Введите пароль").blur();
  await expect(
    page.getByText("Обязательное поле", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Слишком короткий пароль", { exact: true }),
  ).toHaveCount(0);
});

test("keeps carousel images mounted across forward and backward scrolling", async ({
  page,
}) => {
  const games = Array.from({ length: 10 }, (_, index) => ({
    id: index + 7,
    title: `Игра ${index + 1}`,
    description: "Описание",
    categories: [],
    imageFileTitle: "cover.svg",
    rulesFileTitle: null,
  }));
  await page.route("**/api/games/paged?**", (route) =>
    route.fulfill({
      json: {
        content: games,
        totalElements: 10,
        totalPages: 1,
        page: 0,
        size: 10,
      },
    }),
  );
  await page.route("**/api/files/image/cover.svg", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="orange"/></svg>',
    }),
  );
  await page.goto("/");
  const carousel = page.getByRole("region", { name: "Популярные игры" });
  await expect(carousel.locator("[class*=carousel-item]")).toHaveCount(10);
  const first = carousel.locator("[class*=carousel-item]").first();
  await expect(first.locator("img")).toHaveAttribute("src", /^blob:/);
  const source = await first.locator("img").getAttribute("src");
  await first.evaluate((element) => {
    element.setAttribute("data-retained", "yes");
  });
  await carousel.getByRole("button", { name: "Следующие игры" }).click();
  const viewport = carousel.getByLabel("Список популярных игр");
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0);
  await carousel
    .getByRole("button", { name: "Страница игр 1", exact: true })
    .click();
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollLeft))
    .toBe(0);
  await expect(first).toHaveAttribute("data-retained", "yes");
  await expect(first.locator("img")).toHaveAttribute("src", source ?? "");
});

test("toggles password visibility independently on authentication forms", async ({
  page,
}) => {
  for (const [path, count] of [
    ["/login", 1],
    ["/register", 2],
    ["/reset-password?token=test", 2],
  ] as const) {
    await page.goto(path);
    const fields = page.locator(
      'input[autocomplete="current-password"], input[autocomplete="new-password"]',
    );
    await expect(fields).toHaveCount(count);
    for (let index = 0; index < count; index += 1) {
      const field = fields.nth(index);
      await field.fill("secret-password");
      await expect(field).toHaveAttribute("type", "password");
      const id = await field.getAttribute("id");
      const toggle = page.locator(`button[aria-controls="${id}"]`);
      await toggle.click();
      await expect(field).toHaveAttribute("type", "text");
      await expect(field).toHaveValue("secret-password");
      await toggle.click();
      await expect(field).toHaveAttribute("type", "password");
      await expect(field).toHaveValue("secret-password");
    }
  }
  await page.goto("/");
  await expect(
    page.getByRole("region", { name: "Популярные игры" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /автопрокрутку/ })).toHaveCount(
    0,
  );
});
