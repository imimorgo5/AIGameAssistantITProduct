import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { chatApi } from "entities/chat";
import { gameApi } from "entities/game";
import { userApi } from "entities/session";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import ChatPage from "./ChatPage";

jest.mock("widgets/header", () => ({ Header: () => <header /> }));
jest.mock("features/model-select", () => ({ ModelSelect: () => <div /> }));
afterEach(() => jest.restoreAllMocks());

test("starts a blank chat from the sidebar while preserving previous sessions", async () => {
  Object.defineProperty(HTMLElement.prototype, "scrollTo", { configurable: true, value: jest.fn() });
  jest.spyOn(userApi, "getAuthenticated").mockResolvedValue({ id: 1, login: "player", email: "player@example.com", isAdmin: false, isEnabled: true, imageFileTitle: null, model: "fast" });
  jest.spyOn(gameApi, "read").mockResolvedValue({ id: 7, title: "Игра", description: "Правила", categories: [], imageFileTitle: null, rulesFileTitle: null });
  jest.spyOn(chatApi, "getAllChatPaged").mockResolvedValue({ content: [{ id: 3, gameId: 7, title: "Прошлый чат", lastUseTime: "2026-11-07T00:00:00Z" }], totalElements: 1, totalPages: 1, page: 0, size: 10 });
  jest.spyOn(chatApi, "getChat").mockResolvedValue({ id: 3, title: "Прошлый чат", lastUseTime: "2026-11-07T00:00:00Z", messageDTOs: [{ role: "assistant", text: "Предыдущий ответ", timestamp: "2026-11-07T00:00:00Z" }] });
  render(
    <MemoryRouter initialEntries={["/games/ai/7/3"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/games/ai/:gameId/:chatId?" element={<ChatPage />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(await screen.findByText("Предыдущий ответ")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Новый чат" }));
  expect(await screen.findByText("Чем я могу помочь?")).toBeInTheDocument();
  expect(screen.queryByText("Предыдущий ответ")).not.toBeInTheDocument();
  expect(screen.getByText("Прошлый чат")).toBeInTheDocument();
});
