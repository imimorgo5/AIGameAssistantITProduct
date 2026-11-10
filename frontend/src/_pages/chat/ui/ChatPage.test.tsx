import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

import { modelApi } from "entities/ai";
import { chatApi } from "entities/chat";
import { gameApi } from "entities/game";
import { userApi } from "entities/session";

import ChatPage from "./ChatPage";
import { setNavigation } from "../../../../tests/navigation";

jest.mock("widgets/header", () => ({ Header: () => <header /> }));
jest.mock("features/model-select", () => ({ ModelSelect: () => <div /> }));
beforeEach(() => {
  jest
    .spyOn(gameApi, "rulesStatus")
    .mockResolvedValue({ status: "ready", error: "" });
});
afterEach(() => jest.restoreAllMocks());

test("starts a blank chat from the sidebar while preserving previous sessions", async () => {
  jest
    .spyOn(modelApi, "getAll")
    .mockResolvedValue([{ id: "fast", name: "Fast" }]);
  jest.spyOn(modelApi, "getMain").mockResolvedValue("fast");
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value: jest.fn(),
  });
  jest.spyOn(userApi, "getAuthenticated").mockResolvedValue({
    id: 1,
    login: "player",
    email: "player@example.com",
    isAdmin: false,
    isEnabled: true,
    imageFileTitle: null,
    model: "fast",
  });
  jest.spyOn(gameApi, "read").mockResolvedValue({
    id: 7,
    title: "Игра",
    description: "Правила",
    categories: [],
    imageFileTitle: null,
    rulesFileTitle: null,
  });
  jest.spyOn(chatApi, "getAllChatPaged").mockResolvedValue({
    content: [
      {
        id: 3,
        gameId: 7,
        title: "Прошлый чат",
        lastUseTime: "2026-11-07T00:00:00Z",
      },
    ],
    totalElements: 1,
    totalPages: 1,
    page: 0,
    size: 10,
  });
  jest.spyOn(chatApi, "getChat").mockResolvedValue({
    id: 3,
    title: "Прошлый чат",
    lastUseTime: "2026-11-07T00:00:00Z",
    messageDTOs: [
      {
        role: "assistant",
        text: "Предыдущий ответ",
        timestamp: "2026-11-07T00:00:00Z",
      },
    ],
  });
  setNavigation("/games/ai/7/3");
  render(
    <>
      <ChatPage />
    </>,
  );
  expect(await screen.findByText("Предыдущий ответ")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Новый чат" }));
  expect(await screen.findByText("Чем я могу помочь?")).toBeInTheDocument();
  expect(screen.queryByText("Предыдущий ответ")).not.toBeInTheDocument();
  expect(screen.getByText("Прошлый чат")).toBeInTheDocument();
});

test("opens the guest view, restores local history and clears it without resetting quota", async () => {
  const mainModelRequest = jest
    .spyOn(modelApi, "getMain")
    .mockRejectedValue(new Error("Authentication required"));
  jest
    .spyOn(userApi, "getAuthenticated")
    .mockRejectedValue(new Error("Should not request a user"));
  jest.spyOn(chatApi, "guestStatus").mockResolvedValue({
    remaining: 2,
    limit: 5,
    resetsAt: "2026-11-12T00:00:00Z",
  });
  jest.spyOn(gameApi, "read").mockResolvedValue({
    id: 7,
    title: "Игра",
    description: "Правила",
    categories: [],
    imageFileTitle: null,
    rulesFileTitle: "rules.pdf",
  });
  localStorage.setItem(
    "ga:guest:chat:7",
    JSON.stringify([
      {
        id: "saved",
        role: "assistant",
        text: "TL;DR: Сохранённый ответ",
        createdAt: "2026-11-11T00:00:00Z",
      },
    ]),
  );
  setNavigation("/games/ai/7");
  render(<ChatPage guest />);
  expect(
    await screen.findByText("TL;DR: Сохранённый ответ"),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Осталось вопросов на сегодня: 2 из 5"),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("textbox", { name: "Текст сообщения" }),
  ).toHaveAttribute("maxlength", "1000");
  expect(userApi.getAuthenticated).not.toHaveBeenCalled();
  expect(mainModelRequest).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Очистить историю" }));
  fireEvent.click(screen.getByRole("button", { name: "Очистить" }));
  expect(
    screen.queryByText("TL;DR: Сохранённый ответ"),
  ).not.toBeInTheDocument();
  expect(
    screen.getByText("Осталось вопросов на сегодня: 2 из 5"),
  ).toBeInTheDocument();
  expect(localStorage.getItem("ga:guest:chat:7")).toBe("[]");
  localStorage.clear();
});
