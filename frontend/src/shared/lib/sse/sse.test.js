import { parseSseEvent } from "./sse";
test("preserves spaces and multiline answer chunks", () => {
  expect(parseSseEvent("data:Roll \ndata:one die.")).toEqual({
    event: "message",
    data: "Roll \none die.",
  });
});
test("recognizes error and completion frames with CRLF", () => {
  expect(parseSseEvent("event:error\r\ndata:Проверьте API-ключ")).toEqual({
    event: "error",
    data: "Проверьте API-ключ",
  });
  expect(parseSseEvent("event:done\ndata:ok").event).toBe("done");
});
