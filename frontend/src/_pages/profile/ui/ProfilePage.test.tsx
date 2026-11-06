import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { chatApi } from "entities/chat";
import { gameApi } from "entities/game";
import { userApi } from "entities/session";
import { MemoryRouter } from "react-router-dom";

import ProfilePage from "./ProfilePage";
jest.mock("widgets/header", () => ({ Header: () => <header /> }));
afterEach(() => jest.restoreAllMocks());
test("profile password errors appear only after the corresponding blur", async () => {
  jest.spyOn(userApi, "getAuthenticated").mockResolvedValue({
    id: 1,
    login: "player",
    email: "player@example.com",
    isAdmin: false,
    isEnabled: true,
    imageFileTitle: null,
    model: null,
  });
  jest.spyOn(gameApi, "getAllPaged").mockResolvedValue({
    content: [],
    totalElements: 0,
    totalPages: 0,
    page: 0,
    size: 1000,
  });
  jest.spyOn(chatApi, "getAllChatPaged").mockResolvedValue({
    content: [],
    totalElements: 0,
    totalPages: 0,
    page: 0,
    size: 8,
  });
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ProfilePage />
    </MemoryRouter>,
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Сменить пароль" }),
  );
  const password = screen.getByPlaceholderText("Введите новый пароль");
  const repeat = screen.getByPlaceholderText("Повторите новый пароль");
  fireEvent.change(password, { target: { value: "a" } });
  fireEvent.change(repeat, { target: { value: "b" } });
  expect(screen.queryByText("Слишком короткий пароль")).not.toBeInTheDocument();
  expect(screen.queryByText("Пароли не совпадают")).not.toBeInTheDocument();
  fireEvent.blur(password);
  expect(screen.getByText("Слишком короткий пароль")).toBeInTheDocument();
  expect(screen.queryByText("Пароли не совпадают")).not.toBeInTheDocument();
  fireEvent.blur(repeat);
  expect(screen.getByText("Пароли не совпадают")).toBeInTheDocument();
  fireEvent.focus(password);
  fireEvent.change(password, { target: { value: "valid" } });
  fireEvent.focus(repeat);
  fireEvent.change(repeat, { target: { value: "valid" } });
  expect(screen.queryByText("Слишком короткий пароль")).not.toBeInTheDocument();
  expect(screen.queryByText("Пароли не совпадают")).not.toBeInTheDocument();
});
