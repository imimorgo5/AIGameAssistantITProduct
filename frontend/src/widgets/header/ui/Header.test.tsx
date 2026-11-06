import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Header from "./Header";

jest.mock("entities/session", () => ({ useAuth: () => ({ isAuthenticated: true, logout: jest.fn() }) }));
jest.mock("shared/lib/theme", () => ({ useTheme: () => ({ mode: "dark", setMode: jest.fn(), currentTheme: "dark" }) }));
jest.mock("shared/lib/useBlobUrl", () => ({ useBlobUrl: () => ({ url: null }) }));

test("puts the admin link in the avatar menu", () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Header currentUser={{ id: 1, login: "admin", email: "admin@example.com", isAdmin: true, isEnabled: true, imageFileTitle: null, model: null }} />
    </MemoryRouter>,
  );
  expect(screen.queryByRole("link", { name: "Админка" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Меню пользователя" }));
  const menu = screen.getByRole("dialog", { name: "Меню пользователя" });
  expect(within(menu).getByRole("link", { name: "Админ-панель" })).toHaveAttribute("href", "/admin");
});
