import { TextDecoder, TextEncoder } from "util";

import { chatApi } from "./chat";
beforeEach(() => {
  global.TextDecoder = TextDecoder;
  global.fetch = jest.fn();
});

function stream(parts) {
  const encoder = new TextEncoder();
  const values = parts.map((part) => encoder.encode(part));
  const reader = {
    read: jest.fn(async () =>
      values.length
        ? {
            value: values.shift(),
            done: false,
          }
        : {
            done: true,
          },
    ),
    cancel: jest.fn(async () => {}),
    releaseLock: jest.fn(),
  };

  global.fetch.mockResolvedValue({
    ok: true,
    body: {
      getReader: () => reader,
    },
  });

  return reader;
}

test("handles fragmented events and completes only after the done frame", async () => {
  stream([
    "data:Roll ",
    "\r\n\r",
    "\ndata:one die.\n\nevent:done\ndata:ok\n\n",
  ]);
  const chunks = [];
  const complete = jest.fn();
  await new Promise((resolve, reject) =>
    chatApi.streamAnswer(1, {
      onChunk: (chunk) => chunks.push(chunk),
      onComplete: () => {
        complete();
        resolve();
      },
      onError: reject,
    }),
  );
  expect(chunks).toEqual(["Roll ", "one die."]);
  expect(complete).toHaveBeenCalledTimes(1);
});
test.each([
  [
    "data:Partial\n\nevent:error\ndata:Проверьте API-ключ\n\n",
    "Проверьте API-ключ",
  ],
  ["data:Partial\n\n", "Соединение прервано"],
])(
  "does not treat a failed or interrupted response as complete",
  async (body, expected) => {
    stream([body]);
    const complete = jest.fn();
    const error = await new Promise((resolve) =>
      chatApi.streamAnswer(1, {
        onComplete: complete,
        onError: resolve,
      }),
    );

    expect(error.message).toContain(expected);
    expect(complete).not.toHaveBeenCalled();
  },
);

test.each([
  ['{"message":"Модель временно недоступна"}', "Модель временно недоступна"],
  ["Слишком много запросов", "Слишком много запросов"],
  ["", "Не удалось получить ответ модели. Попробуйте ещё раз."],
])(
  "preserves server error text before the stream starts",
  async (body, message) => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => body,
    });
    const error = await new Promise((resolve) =>
      chatApi.streamAnswer(1, { onError: resolve }),
    );
    expect(error.message).toBe(message);
  },
);
