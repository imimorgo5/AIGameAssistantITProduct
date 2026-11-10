import { fireEvent, render, screen, within } from "@testing-library/react";

import { modelApi } from "entities/ai";

import ModelsTable from "./ModelsTable";

afterEach(() => jest.restoreAllMocks());

test("paginates models in groups of ten and disables navigation at the boundaries", async () => {
  jest
    .spyOn(modelApi, "getRegistry")
    .mockResolvedValue({
      defaultModel: "model-0",
      models: Array.from({ length: 21 }, (_, index) => ({
        id: `model-${index}`,
        name: `Модель ${index}`,
        remoteId: `test/model-${index}`,
        enabled: true,
        maxOutputTokens: 4096,
      })),
    });
  render(<ModelsTable />);
  const table = await screen.findByRole("table");
  expect(within(table).getAllByRole("row")).toHaveLength(11);
  expect(
    screen.getByRole("button", { name: "Предыдущая страница моделей" }),
  ).toBeDisabled();
  fireEvent.click(
    screen.getByRole("button", { name: "Следующая страница моделей" }),
  );
  expect(screen.getByText("2 / 3")).toBeInTheDocument();
  expect(
    within(table).getByText("Модель 10", { exact: true }),
  ).toBeInTheDocument();
  expect(
    within(table).queryByText("Модель 0", { exact: true }),
  ).not.toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Следующая страница моделей" }),
  );
  expect(screen.getByText("3 / 3")).toBeInTheDocument();
  expect(within(table).getAllByRole("row")).toHaveLength(2);
  expect(
    screen.getByRole("button", { name: "Следующая страница моделей" }),
  ).toBeDisabled();
  fireEvent.click(
    screen.getByRole("button", { name: "Предыдущая страница моделей" }),
  );
  expect(screen.getByText("2 / 3")).toBeInTheDocument();
});
