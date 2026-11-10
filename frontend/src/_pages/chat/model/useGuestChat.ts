import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { chatApi, guestLimits, parseGuestHistory } from "entities/chat";
import { errorMessage } from "shared/lib/errors";

import type { GuestStatus, Message } from "entities/chat";

function subscribeHistory(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("ga-guest-history", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("ga-guest-history", listener);
  };
}

export function useGuestChat(gameId: string | undefined, enabled: boolean) {
  const [currentMessages, setMessages] = useState<Message[] | null>(null);
  const [status, setStatus] = useState<GuestStatus | null>(null);
  const [ready, setReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const stream = useRef<{ close: () => void } | null>(null);
  const mounted = useRef(false);
  const sendingRef = useRef(false);
  const storageKey = `ga:guest:chat:${gameId ?? "none"}`;
  const stored = useSyncExternalStore(
    subscribeHistory,
    () => {
      if (!enabled) return "";
      try {
        return localStorage.getItem(storageKey) ?? "";
      } catch {
        return "unavailable";
      }
    },
    () => "",
  );
  const restored = useMemo(() => {
    try {
      if (stored.length > 2000000) throw new Error("История слишком длинная");
      const value: unknown = stored ? JSON.parse(stored) : [];
      return { messages: parseGuestHistory(value), notice: "" };
    } catch {
      return {
        messages: [],
        notice:
          "Историю не удалось восстановить. Новые сообщения будут доступны в этой вкладке.",
      };
    }
  }, [stored]);
  const messages = currentMessages ?? restored.messages;
  const refreshQuota = async () => {
    try {
      const next = await chatApi.guestStatus();
      if (mounted.current) {
        setStatus(next);
        setNotice("");
      }
    } catch (cause) {
      if (mounted.current)
        setNotice(errorMessage(cause, "Не удалось проверить гостевой лимит"));
    }
  };
  useEffect(() => {
    if (!enabled) return;
    mounted.current = true;
    chatApi
      .guestStatus()
      .then((next) => {
        if (mounted.current) setStatus(next);
      })
      .catch((cause: unknown) => {
        if (mounted.current)
          setNotice(errorMessage(cause, "Не удалось проверить гостевой лимит"));
      })
      .finally(() => {
        if (mounted.current) setReady(true);
      });
    return () => {
      mounted.current = false;
      stream.current?.close();
      sendingRef.current = false;
    };
  }, [enabled, storageKey]);
  const persist = (next: Message[]) => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(
          next
            .filter(
              (message) =>
                ["user", "assistant"].includes(message.role) &&
                !message._streaming &&
                message.text,
            )
            .slice(-guestLimits.history),
        ),
      );
      window.dispatchEvent(new Event("ga-guest-history"));
    } catch {
      setNotice(
        "Браузер не сохранил историю. Она останется доступна до закрытия страницы.",
      );
    }
  };
  const send = (prompt: string) => {
    if (
      !enabled ||
      !gameId ||
      !status ||
      status.remaining <= 0 ||
      sendingRef.current ||
      !prompt.trim() ||
      prompt.length > guestLimits.input
    )
      return false;
    sendingRef.current = true;
    setSending(true);
    setNotice("");
    const timestamp = new Date().toISOString();
    const id = crypto.randomUUID();
    const user: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: prompt.trim(),
      createdAt: timestamp,
    };
    const history = messages
      .filter(
        (message) =>
          ["user", "assistant"].includes(message.role) && !message._streaming,
      )
      .slice(-8)
      .map((message): { role: "user" | "assistant"; text: string } => ({
        role: message.role === "user" ? "user" : "assistant",
        text: message.text.slice(0, 15000),
      }));
    let next = [
      ...messages,
      user,
      {
        id,
        role: "assistant",
        text: "",
        createdAt: timestamp,
        _streaming: true,
      },
    ].slice(-guestLimits.history);
    setMessages(next);
    persist(next);
    stream.current = chatApi.streamGuest(
      { gameId: Number(gameId), prompt, history },
      {
        onChunk: (chunk) => {
          if (!mounted.current) return;
          next = next.map((message) =>
            message.id === id
              ? { ...message, text: message.text + chunk }
              : message,
          );
          setMessages(next);
        },
        onComplete: () => {
          if (!mounted.current) return;
          next = next.map((message) =>
            message.id === id ? { ...message, _streaming: false } : message,
          );
          setMessages(next);
          persist(next);
          setSending(false);
          sendingRef.current = false;
          stream.current = null;
          void refreshQuota();
        },
        onError: (cause) => {
          if (!mounted.current) return;
          next = next.map((message) =>
            message.id === id
              ? {
                  ...message,
                  role: "error",
                  text: errorMessage(cause, "Не удалось получить ответ"),
                  _streaming: false,
                }
              : message,
          );
          setMessages(next);
          persist(next);
          setSending(false);
          sendingRef.current = false;
          stream.current = null;
          void refreshQuota();
        },
      },
    );
    return true;
  };
  const clear = () => {
    if (sendingRef.current) return;
    setMessages([]);
    persist([]);
  };
  return {
    messages,
    status,
    ready,
    sending,
    notice: notice || restored.notice,
    send,
    clear,
  };
}
