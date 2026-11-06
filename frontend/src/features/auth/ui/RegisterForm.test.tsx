import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import RegisterForm from "./RegisterForm";
jest.mock("entities/session", () => ({
  ...jest.requireActual("entities/session"),
  useAuth: () => ({ register: jest.fn() }),
}));

function setup() {
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <RegisterForm onSuccess={jest.fn()} />
    </MemoryRouter>,
  );
}

test("keeps email errors hidden until the first blur and validates corrections afterwards", () => {
  setup();
  const email = screen.getByPlaceholderText("Введите e-mail");
  fireEvent.change(email, { target: { value: "wrong" } });
  expect(screen.queryByText("Некорректный email")).not.toBeInTheDocument();
  expect(email).toHaveAttribute("aria-invalid", "false");
  fireEvent.blur(email);
  expect(screen.getByText("Некорректный email")).toHaveAttribute(
    "id",
    "reg-email-error",
  );
  expect(email).toHaveAttribute("aria-invalid", "true");
  fireEvent.focus(email);
  fireEvent.change(email, { target: { value: "player@example.com" } });
  expect(screen.queryByText("Некорректный email")).not.toBeInTheDocument();
  expect(email).toHaveAttribute("aria-invalid", "false");
});
test("does not show a confirmation error until that field loses focus, then follows both passwords", () => {
  setup();
  const password = screen.getByPlaceholderText("Введите пароль");
  const repeat = screen.getByPlaceholderText("Повторите пароль");
  fireEvent.change(password, { target: { value: "abcd" } });
  fireEvent.change(repeat, { target: { value: "different" } });
  fireEvent.blur(password);
  expect(screen.queryByText("Пароли не совпадают")).not.toBeInTheDocument();
  fireEvent.blur(repeat);
  expect(screen.getByText("Пароли не совпадают")).toBeInTheDocument();
  fireEvent.focus(repeat);
  fireEvent.change(password, { target: { value: "different" } });
  fireEvent.blur(repeat);
  expect(screen.queryByText("Пароли не совпадают")).not.toBeInTheDocument();
  fireEvent.focus(password);
  fireEvent.change(password, { target: { value: "a" } });
  expect(screen.getByText("Слишком короткий пароль")).toBeInTheDocument();
  fireEvent.blur(password);
  expect(screen.getByText("Слишком короткий пароль")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Зарегистрироваться" }),
  ).toBeDisabled();
});
