import { useEffect, useRef, useState } from "react";

import { bindClasses } from "shared/lib/styles";

import style1 from "./ChatMessage.module.scss";

import type { Message } from "../model/types";

interface Props {
  msg: Message;
}

export default function ChatMessage({ msg }: Props) {
  const role = String(msg.role).toLowerCase();
  const isUser = role === "user";
  const isAssistant = role === "assistant";
  const isStreaming = !!msg._streaming;
  const text = String(msg.text || "");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copied = copiedId === msg.id;
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );
  const copyToClipboard = async () => {
    const textToCopy = text;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const ta = document.createElement("textarea");
        ta.value = textToCopy;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }

      setCopiedId(msg.id);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setCopiedId(null);
    }
  };

  if (isUser) {
    return (
      <div className={cx("chat-message user")}>
        <div className={cx("chat-message-bubble")}>
          <div className={cx("chat-message-text")}>{text}</div>
        </div>
      </div>
    );
  }

  if (isAssistant) {
    const hasAnyText = text.trim().length > 0;

    return (
      <div className={cx("chat-message bot")}>
        <div className={cx("chat-message-plain")}>
          {isStreaming && !hasAnyText ? (
            <div
              className={cx("chat-message-text")}
              role="status"
              aria-label="Ожидаем ответ модели"
            >
              <span className={cx("streaming-dots")} aria-hidden>
                <span>•</span>
                <span>•</span>
                <span>•</span>
              </span>
            </div>
          ) : (
            <div className={cx("chat-message-text")}>{text}</div>
          )}

          {!isStreaming && (
            <div className={cx("chat-message-actions")}>
              <button
                className={cx(`copy-icon-btn ${copied ? "copied" : ""}`)}
                onClick={copyToClipboard}
                aria-label="Скопировать ответ"
                title="Скопировать ответ"
              >
                {!copied ? (
                  <svg
                    className={cx("copy-icon")}
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="9"
                      y="9"
                      width="13"
                      height="13"
                      rx="2"
                      ry="2"
                    ></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                ) : (
                  <svg
                    className={cx("copy-icon")}
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cx("chat-message error")}>
      <div className={cx("chat-message-plain")}>
        <div className={cx("chat-message-text")}>{text}</div>
      </div>
    </div>
  );
}
const cx = bindClasses(style1);
