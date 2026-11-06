import { render, screen, fireEvent } from "@testing-library/react";
import { modelApi } from "entities/ai";
import React from "react";

import ModelSelect from "./ModelSelect";

jest.mock("entities/ai", () => ({
  modelApi: {
    getAll: jest.fn(),
  },
}));
test("shows configured names and sends only the internal model ID", async () => {
  modelApi.getAll.mockResolvedValue([
    {
      id: "fast",
      name: "Fast configured model",
    },
    {
      id: "balanced",
      name: "Balanced configured model",
    },
  ]);
  const changed = jest.fn();
  render(<ModelSelect value="fast" onChange={changed} />);
  const button = await screen.findByRole("button", {
    name: "Модель нейросети",
  });

  await screen.findByText("Fast configured model");
  fireEvent.click(button);
  fireEvent.click(
    screen.getByRole("option", {
      name: "Balanced configured model",
    }),
  );
  expect(changed).toHaveBeenCalledWith("balanced");
});
