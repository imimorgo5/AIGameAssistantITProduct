import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { ThemeProvider, useTheme } from "./ThemeContext";

function Controls() {
  const { setMode } = useTheme();

  return <button onClick={() => setMode("light")}>Светлая</button>;
}

test("applies theme transitions for 500 milliseconds", () => {
  jest.useFakeTimers();
  localStorage.clear();
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: jest.fn(() => ({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
  const { unmount } = render(
    <ThemeProvider>
      <Controls />
    </ThemeProvider>,
  );

  const root = document.documentElement;
  expect(root).toHaveAttribute("data-theme", "dark");
  fireEvent.click(screen.getByRole("button", { name: "Светлая" }));
  expect(root).toHaveAttribute("data-theme", "light");
  expect(root).toHaveClass("theme-transition");
  act(() => jest.advanceTimersByTime(499));
  expect(root).toHaveClass("theme-transition");
  act(() => jest.advanceTimersByTime(1));
  expect(root).not.toHaveClass("theme-transition");
  unmount();
  localStorage.clear();
  jest.useRealTimers();
});
