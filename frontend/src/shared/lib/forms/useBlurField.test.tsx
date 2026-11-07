import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { useBlurField } from "./index";

function Form() {
  const [value, setValue] = useState("");
  const field = useBlurField(value, (value) =>
    value.length < 4 ? "Слишком коротко" : "",
  );

  return (
    <div>
      <input
        aria-label="Поле"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={field.onBlur}
      />
      {field.error && <p role="alert">{field.error}</p>}
    </div>
  );
}

test("starts validation at the first blur and continues while editing", () => {
  render(<Form />);
  const input = screen.getByRole("textbox", { name: "Поле" });
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: "a" } });
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  fireEvent.blur(input);
  expect(screen.getByRole("alert")).toHaveTextContent("Слишком коротко");
  fireEvent.focus(input);
  expect(screen.getByRole("alert")).toBeInTheDocument();
  fireEvent.change(input, { target: { value: "ab" } });
  expect(screen.getByRole("alert")).toBeInTheDocument();
  fireEvent.blur(input);
  expect(screen.getByRole("alert")).toBeInTheDocument();
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: "valid" } });
  fireEvent.blur(input);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
