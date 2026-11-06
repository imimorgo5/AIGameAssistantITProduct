import { apiClient } from "shared/api/http";
import { clearTokens } from "shared/lib/storage";

import { categoryApi } from "./category";
import { gameApi } from "./game";
const game = {
  id: 1,
  title: "Game",
  description: "",
  categories: [],
  imageFileTitle: null,
  rulesFileTitle: null,
};

afterEach(() => {
  jest.restoreAllMocks();
  clearTokens();
});
test("shares game reads and refetches after an update", async () => {
  const get = jest.spyOn(apiClient, "get").mockResolvedValue({ data: game });
  jest
    .spyOn(apiClient, "request")
    .mockResolvedValue({ data: { ...game, title: "Updated" } });
  await Promise.all([gameApi.read(1), gameApi.read(1)]);
  expect(get).toHaveBeenCalledTimes(1);
  get.mockResolvedValue({ data: { ...game, title: "Updated" } });
  await gameApi.update(1, {
    title: "Updated",
    description: "",
    categories: [],
  });
  get.mockResolvedValue({ data: { ...game, title: "Updated" } });
  expect((await gameApi.read(1)).title).toBe("Updated");
  expect(get).toHaveBeenCalledTimes(2);
});
test("rejects malformed responses instead of keeping them in cache", async () => {
  const get = jest
    .spyOn(apiClient, "get")
    .mockResolvedValueOnce({ data: { id: "invalid" } })
    .mockResolvedValue({ data: game });

  await expect(gameApi.read(1)).rejects.toThrow("Некорректный ответ сервера");
  await expect(gameApi.read(1)).resolves.toEqual(game);
  expect(get).toHaveBeenCalledTimes(2);
});
test("category changes invalidate the category list used by selectors", async () => {
  const category = { id: 1, name: "Strategy", gamesCount: 0 };
  const get = jest
    .spyOn(apiClient, "get")
    .mockResolvedValue({ data: [category] });

  jest.spyOn(apiClient, "request").mockResolvedValue({ data: category });
  await categoryApi.getAll();
  await categoryApi.getAll();
  expect(get).toHaveBeenCalledTimes(1);
  await categoryApi.create("Strategy");
  await categoryApi.getAll();
  expect(get).toHaveBeenCalledTimes(2);
});

test("sends and receives the full multiline description", async () => {
  const description = "Полное описание\n".repeat(90);
  const saved = { ...game, description };
  const request = jest.spyOn(apiClient, "request").mockResolvedValue({ data: saved });
  jest.spyOn(apiClient, "get").mockResolvedValue({ data: saved });
  await expect(gameApi.create({ title: game.title, description, categories: [] })).resolves.toEqual(saved);
  const body = request.mock.calls[0]?.[0]?.data;
  expect(body).toBeInstanceOf(FormData);
  if (!(body instanceof FormData)) throw new Error("Expected FormData");

  expect(body.get("description")).toBe(description);
});
