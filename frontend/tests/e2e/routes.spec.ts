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
