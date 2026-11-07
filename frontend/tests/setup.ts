import "@testing-library/jest-dom";

import { setNavigation } from "./navigation";

jest.mock("next/navigation", () => jest.requireActual("./navigation"));

beforeEach(() => {
  setNavigation("/");
  jest.clearAllMocks();
  if (typeof window !== "undefined")
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: jest.fn(() => ({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    });
});
