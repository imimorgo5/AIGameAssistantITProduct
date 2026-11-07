import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "entities/session";
import { fileApi } from "shared/api/file";
import { bindClasses } from "shared/lib/styles";
import { useTheme } from "shared/lib/theme";
import { useBlobUrl } from "shared/lib/useBlobUrl";

import style1 from "./UserMenu.module.scss";

import type { User } from "entities/session";

interface Props {
  currentUser?: User | null;
}

export default function UserMenu({ currentUser }: Props) {
  const { isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { url: avatarBlobUrl } = useBlobUrl(
    fileApi.getImageBlob,
    currentUser?.imageFileTitle,
  );

  useEffect(() => {
    function onDoc(e: MouseEvent | TouchEvent) {
      if (
        ref.current &&
        e.target instanceof Node &&
        !ref.current.contains(e.target)
      )
        setOpen(false);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  const firstLetter = (currentUser?.login?.[0] ?? "U").toUpperCase();
  const { mode, setMode, currentTheme } = useTheme();

  return (
    <div className={cx("user-menu-root")} ref={ref}>
      {isAuthenticated ? (
        <button
          className={cx("user-icon")}
          onClick={() => setOpen((v) => !v)}
          aria-label="Меню пользователя"
          aria-expanded={open}
          type="button"
        >
          <span className={cx("user-avatar")}>
            {avatarBlobUrl ? (
              <Image
                unoptimized
                width={512}
                height={512}
                src={avatarBlobUrl}
                alt={currentUser?.login || "avatar"}
                className={cx("user-avatar-img")}
              />
            ) : (
              firstLetter
            )}
          </span>
        </button>
      ) : (
        <div className={cx("auth-links")}>
          <Link href="/login" className={cx("link")}>
            Вход
          </Link>
          <Link href="/register" className={cx("link")}>
            Регистрация
          </Link>
        </div>
      )}

      {isAuthenticated && (
        <div
          className={cx(`user-popup ${open ? "is-open" : "is-closing"}`)}
          role="dialog"
          aria-label="Меню пользователя"
          aria-hidden={!open}
          inert={!open}
        >
          <div className={cx("user-popup-header")}>
            <div className={cx("user-popup-name")}>{currentUser?.login}</div>
            <div className={cx("user-popup-email")}>{currentUser?.email}</div>
          </div>

          <div className={cx("user-popup-section")}>
            <div className={cx("theme-label")}>Тема</div>
            <div
              className={cx("theme-switch")}
              role="radiogroup"
              aria-label="Выбор темы"
            >
              <button
                className={cx(`theme-btn ${mode === "auto" ? "active" : ""}`)}
                onClick={() => setMode("auto")}
                role="radio"
                aria-checked={mode === "auto"}
                title={`Авто (система: ${currentTheme})`}
                type="button"
              >
                Авто
              </button>
              <button
                className={cx(`theme-btn ${mode === "dark" ? "active" : ""}`)}
                onClick={() => setMode("dark")}
                role="radio"
                aria-checked={mode === "dark"}
                title="Тёмная"
                type="button"
              >
                Тёмная
              </button>
              <button
                className={cx(`theme-btn ${mode === "light" ? "active" : ""}`)}
                onClick={() => setMode("light")}
                role="radio"
                aria-checked={mode === "light"}
                title="Светлая"
                type="button"
              >
                Светлая
              </button>
            </div>
          </div>

          <div className={cx("user-popup-actions")}>
            {currentUser?.isAdmin && (
              <Link
                href="/admin"
                className={cx("user-popup-btn")}
                onClick={() => setOpen(false)}
              >
                Админ-панель
              </Link>
            )}
            <Link href="/profile" className={cx("user-popup-btn")}>
              Личный кабинет
            </Link>
            <button className={cx("user-popup-btn")} onClick={logout}>
              Выйти
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
const cx = bindClasses(style1);
