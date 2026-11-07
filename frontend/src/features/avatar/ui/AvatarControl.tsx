import Image from "next/image";
import { useRef, useState } from "react";

import { fileError } from "shared/lib/forms";
import { bindClasses } from "shared/lib/styles";

import style0 from "./AvatarControl.module.scss";

import type { ReactNode } from "react";

interface Props {
  url: string | null;
  loading: boolean;
  loadingText?: ReactNode;
  onSelectFile: (file: File) => void;
  onDelete: () => void;
  showDelete?: boolean;
  errorGet?: string;
  errorSet?: string;
}

export default function AvatarControl({
  url,
  loading,
  loadingText,
  onSelectFile,
  onDelete,
  showDelete = true,
  errorGet = "",
  errorSet = "",
}: Props) {
  const [selectionError, setSelectionError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = url;
  const trigger = () => inputRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;

    const message = fileError(f, "image");
    setSelectionError(message);
    if (message) {
      e.target.value = "";

      return;
    }

    onSelectFile(f);
    e.target.value = "";
  };

  return (
    <div className={cx("avatar-control")}>
      <div className={cx(`avatar-wrap ${preview ? "has-img" : ""}`)}>
        {loading ? (
          <div className={cx("avatar-loading")}>
            {loadingText || "Загрузка..."}
          </div>
        ) : errorGet ? (
          <div className={cx("avatar-error")}>{errorGet}</div>
        ) : errorSet ? (
          <div className={cx("avatar-error")}>{errorSet}</div>
        ) : preview ? (
          <Image
            unoptimized
            width={512}
            height={512}
            src={preview}
            alt="Аватар"
            className={cx("avatar-img")}
          />
        ) : (
          <div className={cx("avatar-placeholder")}>Нет фото</div>
        )}

        <div className={cx("avatar-overlay")}>
          {showDelete && (
            <button
              type="button"
              className={cx("avatar-btn avatar-btn-delete")}
              title="Удалить фото"
              onClick={onDelete}
              aria-label="Удалить фото"
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
          )}

          <button
            type="button"
            className={cx("avatar-btn avatar-btn-edit")}
            title="Изменить фото"
            onClick={trigger}
            aria-label="Изменить фото"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="#f5c542"
              viewBox="0 0 16 16"
            >
              <path
                d="
                M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805
                2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z
              "
              />
              <path
                d="
                M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5
                1.5 0 0 0 1 2.5v11z
              "
              />
            </svg>
          </button>
        </div>
      </div>

      {selectionError && (
        <p className={cx("avatar-input-error")} role="alert">
          {selectionError}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        aria-label="Изображение аватара, максимум 5 МБ"
        aria-invalid={!!selectionError}
        accept="image/*"
        className={cx("visually-hidden")}
        onChange={onFileChange}
      />
    </div>
  );
}
const cx = bindClasses(style0);
