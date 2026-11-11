import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import MarkdownAnswer from "./MarkdownAnswer";

test("renders headings, lists and tables", () => {
  render(
    <MarkdownAnswer
      text={
        "## Ответ\n\n**Кратко**\n\n- Первый шаг\n- Второй шаг\n\n| Действие | Цена |\n| --- | --- |\n| Ход | 2 |"
      }
    />,
  );
  expect(
    screen.getByRole("heading", { name: "Ответ", level: 2 }),
  ).toBeVisible();
  expect(screen.getByText("Кратко").tagName).toBe("STRONG");
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(screen.getByRole("table")).toBeVisible();
  expect(screen.getByRole("cell", { name: "Ход" })).toBeVisible();
});

test("blocks raw HTML, images and unsafe links while preserving safe links", () => {
  const { container } = render(
    <MarkdownAnswer
      text={
        '<script>alert(1)</script>\n\n<img src="x" onerror="alert(1)">\n\n![image](https://example.com/image.png)\n\n[Опасная](javascript:alert%281%29)\n\n[Правила](https://example.com)'
      }
    />,
  );
  expect(container.querySelector("script, img")).toBeNull();
  expect(screen.getByText("Опасная").closest("a")).toBeNull();
  expect(screen.getByRole("link", { name: "Правила" })).toHaveAttribute(
    "rel",
    "noopener noreferrer",
  );
});

test("updates incomplete Markdown as streamed text arrives", () => {
  const { rerender } = render(<MarkdownAnswer text="**Крат" />);
  expect(screen.getByText("**Крат")).toBeVisible();
  rerender(<MarkdownAnswer text="**Кратко:** завершённый ответ" />);
  expect(screen.getByText("Кратко:").tagName).toBe("STRONG");
  expect(screen.getByText(/завершённый ответ/)).toBeVisible();
});
