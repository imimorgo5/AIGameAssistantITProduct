import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { useBlobUrl } from "shared/lib/useBlobUrl";

import FileViewer from "./FileViewer";

jest.mock("shared/lib/useBlobUrl", () => ({ useBlobUrl: jest.fn() }));
jest.mock("./PdfViewer", () => ({
  __esModule: true,
  default: ({ fileUrl, onError }: { fileUrl: string; onError: () => void }) => (
    <div data-testid="viewer" data-url={fileUrl}>
      <button onClick={onError}>Fail PDF</button>
    </div>
  ),
}));
const mockBlobUrl = jest.mocked(useBlobUrl);
const refresh = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockBlobUrl.mockReturnValue({ url: "blob:first", loading: false, error: null, refresh, revoke: jest.fn() });
});

test("keeps local open and download actions available after a PDF failure and allows retry", async () => {
  render(<FileViewer fileType="pdf" fileTitle="rules.pdf" />);
  fireEvent.click(await screen.findByText("Fail PDF"));
  expect(screen.getByRole("alert")).toHaveTextContent("Не удалось показать PDF");
  expect(screen.getByRole("link", { name: "Открыть PDF" })).toHaveAttribute("href", "blob:first");
  expect(screen.getByRole("button", { name: "Скачать" })).toBeEnabled();
  expect(screen.queryByTitle("PDF viewer")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Повторить просмотр" }));
  expect(await screen.findByText("Fail PDF")).toBeInTheDocument();
});

test("resets failed viewer when another document is selected", async () => {
  const { rerender } = render(<FileViewer fileType="pdf" fileTitle="first.pdf" />);
  fireEvent.click(await screen.findByText("Fail PDF"));
  mockBlobUrl.mockReturnValue({ url: "blob:second", loading: false, error: null, refresh, revoke: jest.fn() });
  rerender(<FileViewer fileType="pdf" fileTitle="second.pdf" />);
  expect(await screen.findByTestId("viewer")).toHaveAttribute("data-url", "blob:second");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("offers a fetch retry and explains when a file is missing", () => {
  mockBlobUrl.mockReturnValue({ url: null, loading: false, error: "Сеть недоступна", refresh, revoke: jest.fn() });
  const { rerender } = render(<FileViewer fileType="pdf" fileTitle="rules.pdf" />);
  fireEvent.click(screen.getByRole("button", { name: "Повторить загрузку" }));
  expect(refresh).toHaveBeenCalledTimes(1);
  mockBlobUrl.mockReturnValue({ url: null, loading: false, error: null, refresh, revoke: jest.fn() });
  rerender(<FileViewer fileType="pdf" fileTitle="" />);
  expect(screen.getByText("Файл пока не добавлен.")).toBeInTheDocument();
});
