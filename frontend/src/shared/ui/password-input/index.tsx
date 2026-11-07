"use client";

import { useId, useState } from "react";

import styles from "./PasswordInput.module.scss";

import type { ComponentPropsWithoutRef } from "react";

type Props = Omit<ComponentPropsWithoutRef<"input">, "type">;

export function PasswordInput({ id, ...props }: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);
  const label = props["aria-label"] ?? props.placeholder ?? "Пароль";

  return (
    <div className={styles.root}>
      <input {...props} id={inputId} type={visible ? "text" : "password"} />
      <button
        type="button"
        className={styles.toggle}
        disabled={props.disabled}
        aria-controls={inputId}
        aria-label={`${visible ? "Скрыть" : "Показать"} пароль: ${label}`}
        aria-pressed={visible}
        onClick={() => setVisible((value) => !value)}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          {visible && <path d="m3 3 18 18" />}
        </svg>
      </button>
    </div>
  );
}
