import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

import PdfViewer from "./PdfViewer";

jest.mock("react-pdf", () => ({
  pdfjs: { GlobalWorkerOptions: {} },
  Document: ({ children, onLoadSuccess, onLoadError, onItemClick, onPassword }) => (
    <div>
      <button onClick={() => onLoadSuccess({ numPages: 120 })}>Load document</button>
      <button onClick={onLoadError}>Fail document</button>
      <button onClick={onPassword}>Protected document</button>
      <button onClick={() => onItemClick({ pageNumber: 80 })}>Follow internal link</button>
      {children}
    </div>
  ),
  Page: ({ pageNumber, width, scale, onRenderError }) => (
    <div data-testid="pdf-page" data-page={pageNumber} data-width={width} data-scale={scale}>
      <button onClick={onRenderError}>Fail page</button>
    </div>
  ),
}));

function setup() {
  const onError = jest.fn();
  render(<PdfViewer fileUrl="blob:rules" width={600} onError={onError} />);
  fireEvent.click(screen.getByText("Load document"));

  return { onError };
}

test("keeps every page in the scrollable document while rendering nearby pages", () => {
  setup();
  expect(screen.getAllByRole("group", { name: /^Страница \d+$/ })).toHaveLength(120);
  expect(screen.getAllByTestId("pdf-page").length).toBeLessThan(10);
  expect(screen.getAllByTestId("pdf-page").find((page) => page.dataset.page === screen.getByRole("spinbutton", { name: "Номер страницы" }).getAttribute("aria-valuenow"))).toHaveAttribute("data-page", "1");
  expect(screen.getByRole("button", { name: "Предыдущая страница" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Следующая страница" }));
  expect(screen.getAllByTestId("pdf-page").find((page) => page.dataset.page === screen.getByRole("spinbutton", { name: "Номер страницы" }).getAttribute("aria-valuenow"))).toHaveAttribute("data-page", "2");
  fireEvent.click(screen.getByText("Follow internal link"));
  expect(screen.getAllByTestId("pdf-page").find((page) => page.dataset.page === screen.getByRole("spinbutton", { name: "Номер страницы" }).getAttribute("aria-valuenow"))).toHaveAttribute("data-page", "80");
  expect(screen.getByRole("spinbutton", { name: "Номер страницы" })).toHaveValue("80");
});

test("validates page entry after blur and limits zoom", () => {
  setup();
  const input = screen.getByRole("spinbutton", { name: "Номер страницы" });
  fireEvent.change(input, { target: { value: "999" } });
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  fireEvent.blur(input);
  expect(screen.getByRole("alert")).toHaveTextContent("Укажите страницу от 1 до 120");
  expect(screen.getAllByTestId("pdf-page").find((page) => page.dataset.page === screen.getByRole("spinbutton", { name: "Номер страницы" }).getAttribute("aria-valuenow"))).toHaveAttribute("data-page", "1");
  fireEvent.change(input, { target: { value: "120" } });
  fireEvent.blur(input);
  expect(input).toHaveValue("120");
  expect(screen.getByRole("button", { name: "Следующая страница" })).toBeDisabled();
  fireEvent.change(input, { target: { value: "" } });
  fireEvent.blur(input);
  expect(screen.getByRole("alert")).toBeInTheDocument();
  for (let index = 0; index < 8; index += 1) fireEvent.click(screen.getByRole("button", { name: "Увеличить масштаб" }));

  expect(screen.getAllByTestId("pdf-page").find((page) => page.dataset.page === screen.getByRole("spinbutton", { name: "Номер страницы" }).getAttribute("aria-valuenow"))).toHaveAttribute("data-scale", "2");
  expect(screen.getByRole("button", { name: "Увеличить масштаб" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "По ширине" }));
  expect(screen.getAllByTestId("pdf-page").find((page) => page.dataset.page === screen.getByRole("spinbutton", { name: "Номер страницы" }).getAttribute("aria-valuenow"))).toHaveAttribute("data-scale", "1");
});

test("reports document, page rendering and password failures", () => {
  const { onError } = setup();
  fireEvent.click(screen.getByText("Fail document"));
  fireEvent.click(screen.getAllByText("Fail page")[0]);
  fireEvent.click(screen.getByText("Protected document"));
  expect(onError).toHaveBeenCalledTimes(3);
});
