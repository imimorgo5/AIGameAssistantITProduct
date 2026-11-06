import { requestCache } from "shared/api/cache";
import { API_BASE_URL, ignoreResponse, mutate, read } from "shared/api/http";
import { accessRedirect } from "shared/lib/access";
import { responseMessage } from "shared/lib/errors";
import { parseSseEvent } from "shared/lib/sse";
import { getAccessToken } from "shared/lib/storage";
import { page } from "shared/lib/validation";

import { parseChat, parseChatPreview } from "../model/types";

interface StreamCallbacks {
  onChunk?: (chunk: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export const chatApi = {
  getChat: (id: string | number) =>
    read(`/api/chat/${encodeURIComponent(id)}`, parseChat, {}, 10000, [
      "chats",
    ]),
  startChat: ({
    gameId,
    request,
  }: {
    gameId: string | number | null;
    request: string;
  }) =>
    mutate(
      "post",
      "/api/chat/start",
      {
        gameId: gameId == null ? null : Number(gameId),
        request,
      },
      parseChat,
      ["chats"],
    ),
  continueChat: (id: string | number, prompt: string, model: string | null) =>
    mutate(
      "put",
      `/api/chat/${encodeURIComponent(id)}`,
      {
        prompt,
        model,
      },
      parseChat,
      ["chats"],
    ),
  deleteChat: (id: string | number) =>
    mutate(
      "delete",
      `/api/chat/${encodeURIComponent(id)}`,
      undefined,
      ignoreResponse,
      ["chats"],
    ),
  getAllChatPaged: (
    pageNumber: number,
    size: number,
    gameId: string | number | null = null,
  ) =>
    read(
      "/api/chat/paged",
      page(parseChatPreview),
      {
        params: {
          page: pageNumber,
          size,
          gameId,
        },
      },
      10000,
      ["chats"],
    ),
  streamAnswer: (
    chatId: string | number,
    { onChunk, onComplete, onError }: StreamCallbacks = {},
  ) => {
    const controller = new AbortController();
    const token = getAccessToken();
    const url = `${API_BASE_URL}/api/chat/${encodeURIComponent(chatId)}/answer`;
    (async () => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "text/event-stream",
          ...(token
            ? {
              Authorization: `Bearer ${token}`,
            }
            : {}),
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const target = accessRedirect(response.status, Boolean(getAccessToken()), window.location.pathname);
        if (target) window.location.replace(target);

        const text = await response.text();
        let body: unknown = text;
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }

        throw new Error(responseMessage(body, "Не удалось получить ответ модели. Попробуйте ещё раз."));
      }

      if (!response.body) throw new Error("Поток ответа недоступен");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let completed = false;
      const processEvent = (raw: string) => {
        const { event, data } = parseSseEvent(raw);
        if (event === "error")
          throw new Error(data || "Не удалось получить ответ модели");

        if (event === "done") completed = true;
        else if (data) onChunk?.(data);
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          buffer += decoder.decode(value, {
            stream: !done,
          });
          const events = buffer.split(/\r?\n\r?\n/);
          buffer = events.pop() ?? "";
          events.forEach(processEvent);
          if (done) break;
        }

        if (buffer.trim()) processEvent(buffer);

        if (!completed)
          throw new Error(
            "Соединение прервано до завершения ответа. Повторите запрос",
          );

        requestCache.invalidate("chats");
        onComplete?.();
      } finally {
        controller.abort();
        reader.releaseLock();
      }
    })().catch((error) => {
      if (!(error instanceof Error && error.name === "AbortError"))
        onError?.(error instanceof Error ? error : new Error("Ошибка ответа"));
    });

    return {
      close: () => controller.abort(),
    };
  },
};
