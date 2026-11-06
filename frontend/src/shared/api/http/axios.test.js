import { apiClient, API_BASE_URL } from "./axios";
test("API requests use one /api prefix on the current origin", () => {
  expect(
    apiClient.getUri({
      url: "/api/categories",
    }),
  ).toBe("/api/categories");
  expect(
    apiClient.getUri({
      url: "/api/auth/refresh",
    }),
  ).toBe("/api/auth/refresh");
  expect(`${API_BASE_URL}/api/chat/42/answer`).toBe("/api/chat/42/answer");
});
