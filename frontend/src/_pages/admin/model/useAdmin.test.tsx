import { act, renderHook, waitFor } from "@testing-library/react";
import { modelApi } from "entities/ai";
import { categoryApi, gameApi } from "entities/game";
import { userApi } from "entities/session";
import { MemoryRouter, useLocation } from "react-router-dom";

import { useAdmin } from "./useAdmin";

jest.mock("entities/session", () => ({
  useAuth: () => ({ logout: jest.fn() }),
  userApi: { getAuthenticated: jest.fn() },
}));

afterEach(() => jest.restoreAllMocks());

test("restores the settings tab from the URL and keeps other parameters on switching", async () => {
  jest.mocked(userApi.getAuthenticated).mockResolvedValue({ id: 1, login: "admin", email: "admin@example.com", isAdmin: true, isEnabled: true, imageFileTitle: null, model: null });
  jest.spyOn(modelApi, "getMain").mockResolvedValue("fast");
  jest.spyOn(gameApi, "getAllPaged").mockResolvedValue({ content: [], totalElements: 0, totalPages: 1, page: 0, size: 10 });
  jest.spyOn(categoryApi, "getAll").mockResolvedValue([]);
  const { result } = renderHook(() => ({ admin: useAdmin(), location: useLocation() }), {
    wrapper: ({ children }) => <MemoryRouter initialEntries={["/admin?tab=settings&keep=1"]}>{children}</MemoryRouter>,
  });

  expect(result.current.admin.activeTab).toBe("settings");
  await waitFor(() => expect(result.current.admin.selectedModel).toBe("fast"));
  act(() => result.current.admin.switchTab("games"));
  expect(result.current.location.search).toBe("?tab=games&keep=1");
  await waitFor(() => expect(result.current.admin.itemsLoading).toBe(false));
});
