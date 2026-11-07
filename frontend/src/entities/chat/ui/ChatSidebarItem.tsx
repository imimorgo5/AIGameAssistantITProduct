import { bindClasses } from "shared/lib/styles";
import { formatDate } from "shared/lib/utils";

import style1 from "./ChatSidebarItem.module.scss";

import type { Session } from "../model/types";

interface Props {
  session: Session;
  active?: boolean;
  onSelect: (session: Session) => void;
  onDelete: (id: string) => void;
}

export default function ChatSidebarItem({
  session,
  active,
  onSelect,
  onDelete,
}: Props) {
  const time =
    session.lastUseTime || session.createdAt || new Date().toISOString();

  return (
    <div className={cx(`chat-session-item ${active ? "active" : ""}`)}>
      <button
        type="button"
        className={cx("session-info")}
        onClick={() => onSelect(session)}
        aria-pressed={Boolean(active)}
      >
        <div className={cx("session-title")}>
          {session._loading ? "Загрузка…" : session.title}
        </div>
        <div className={cx("session-meta")}>{formatDate(time)}</div>
      </button>
      <button
        type="button"
        className={cx("chat-sidebar-icon-btn danger")}
        onClick={(ev) => {
          ev.stopPropagation();
          onDelete(session.id);
        }}
        aria-label="Удалить сессию"
        title="Удалить"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 6h18"
            stroke="#ff4d4f"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
            stroke="#ff4d4f"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
            stroke="#ff4d4f"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 11v6"
            stroke="#ff4d4f"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 11v6"
            stroke="#ff4d4f"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
const cx = bindClasses(style1);
