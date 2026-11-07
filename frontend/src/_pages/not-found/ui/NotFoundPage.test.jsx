import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { useAuth } from "entities/session";

import { NotFoundPage } from "./NotFoundPage";

jest.mock("entities/session", () => ({ useAuth: jest.fn() }));

test.each([
  [false, "Перейти ко входу", "/login"],
  [true, "Перейти к играм", "/"],
])(
  "links the primary action according to authentication: %s",
  (authenticated, label, target) => {
    useAuth.mockReturnValue({ isAuthenticated: authenticated });
    render(
      <>
        <NotFoundPage />
      </>,
    );
    expect(screen.getByRole("link", { name: label })).toHaveAttribute(
      "href",
      target,
    );
    expect(screen.queryByText("Ошибка 404")).not.toBeInTheDocument();
  },
);
