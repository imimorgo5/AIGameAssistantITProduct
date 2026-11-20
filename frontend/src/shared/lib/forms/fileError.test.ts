import { fileError } from "./index";

test.each([10645907, 20 * 1024 * 1024])(
  "accepts a PDF of %i bytes within the 20 MiB limit",
  (size) => {
    const file = new File([new Uint8Array(size)], "rules.pdf", {
      type: "application/pdf",
    });
    expect(fileError(file, "pdf")).toBe("");
  },
);

test("rejects a PDF exceeding 20 MiB", () => {
  const file = new File([new Uint8Array(20 * 1024 * 1024 + 1)], "rules.pdf", {
    type: "application/pdf",
  });
  expect(fileError(file, "pdf")).toBe("Максимальный размер — 20 МБ");
});

test("keeps the image limit at 5 MiB", () => {
  const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "cover.png", {
    type: "image/png",
  });
  expect(fileError(file, "image")).toBe("Максимальный размер — 5 МБ");
});
