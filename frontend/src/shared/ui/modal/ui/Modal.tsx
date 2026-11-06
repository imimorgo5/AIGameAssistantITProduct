import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { bindClasses } from "shared/lib/styles";

import styles from "./Modal.module.scss";

import type { ReactNode } from "react";
const cx = bindClasses(styles);
export default function Modal({
  children,
  onClose,
  variant = "dialog",
}: {
  children: ReactNode;
  onClose: () => void;
  variant?: "dialog" | "viewer";
}) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    panel.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
      }

      if (event.key !== "Tab") return;

      const elements = Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]',
        ) ?? [],
      ).filter((element) => element.getClientRects().length > 0);

      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first) {
        event.preventDefault();
        panel.current?.focus();
      } else if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === panel.current)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", keydown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
      document.removeEventListener("keydown", keydown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  return createPortal(
    <div
      className={cx("modal-backdrop")}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Диалог"
        className={cx(`modal ${variant === "viewer" ? "viewer-modal" : ""}`)}
      >
        <div className={cx("modal-body")}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
