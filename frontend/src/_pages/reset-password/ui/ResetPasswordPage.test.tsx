import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import ResetPasswordPage from "./ResetPasswordPage";
test("reset form only displays email validation after blur", () => {
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ResetPasswordPage />
    </MemoryRouter>,
  );
  const input = screen.getByPlaceholderText("Введите e-mail");
  fireEvent.change(input, { target: { value: "wrong" } });
  expect(screen.queryByText("Некорректный email")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Отправить" })).toBeDisabled();
  fireEvent.blur(input);
  expect(screen.getByText("Некорректный email")).toBeInTheDocument();
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: "player@example.com" } });
  expect(screen.queryByText("Некорректный email")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Отправить" })).toBeEnabled();
  expect(document.title).toBe("AIGameAssistant - Восстановление пароля");
});
test("new-password form defers both password errors until each field blurs", () => {
  render(
    <MemoryRouter
      initialEntries={["/reset-password?token=test"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ResetPasswordPage />
    </MemoryRouter>,
  );
  const password = screen.getByPlaceholderText("Введите новый пароль");
  const repeat = screen.getByPlaceholderText("Повторите пароль");
  fireEvent.change(password, { target: { value: "a" } });
  fireEvent.change(repeat, { target: { value: "b" } });
  expect(screen.queryByText("Слишком короткий пароль")).not.toBeInTheDocument();
  expect(screen.queryByText("Пароли не совпадают")).not.toBeInTheDocument();
  fireEvent.blur(password);
  fireEvent.blur(repeat);
  expect(screen.getByText("Слишком короткий пароль")).toBeInTheDocument();
  expect(screen.getByText("Пароли не совпадают")).toBeInTheDocument();
  expect(document.title).toBe("AIGameAssistant - Новый пароль");
});
