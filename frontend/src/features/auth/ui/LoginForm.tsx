import Link from "next/link";
import { useState } from "react";

import { useAuth } from "entities/session";
import { errorMessage } from "shared/lib/errors";
import { useBlurField } from "shared/lib/forms";
import { bindClasses } from "shared/lib/styles";
import { validateEmail } from "shared/lib/utils";
import { PasswordInput } from "shared/ui/password-input";

import styles from "./AuthPages.module.scss";

import type { FormEvent } from "react";
const cx = bindClasses(styles);
export default function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const emailField = useBlurField(
    email,
    (value) => validateEmail(value).message,
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isFormValid = Boolean(!validateEmail(email).message);
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid || submitting) return;

    setError(null);
    setSubmitting(true);
    try {
      await login({
        email,
        password,
      });
      onSuccess?.();
    } catch (err) {
      setError(
        errorMessage(
          err,
          "Ошибка входа. Проверьте корректность введённых данных.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={cx("auth-form")} onSubmit={handleSubmit} noValidate>
      <div className={cx("auth-inputs")}>
        <div className={cx("auth-form-row")}>
          <input
            id="login-email"
            name="email"
            type="text"
            className={cx("auth-form-input")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Введите e-mail"
            placeholder="Введите e-mail"
            autoComplete="email"
            onBlur={emailField.onBlur}
            aria-invalid={!!emailField.error || !!error}
          />
          {emailField.error && (
            <div className={cx("field-error")} role="alert">
              {emailField.error}
            </div>
          )}
        </div>

        <div className={cx("auth-form-row")}>
          <PasswordInput
            id="login-password"
            name="password"
            className={cx("auth-form-input")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-label="Введите пароль"
            placeholder="Введите пароль"
            autoComplete="current-password"
            aria-invalid={!!error}
          />
        </div>
      </div>

      {error && (
        <div className={cx("auth-form-error")} role="alert">
          {error}
        </div>
      )}

      <div className={cx("auth-form-actions")}>
        <button
          type="submit"
          className={cx("btn")}
          disabled={!isFormValid || submitting}
          aria-disabled={!isFormValid || submitting}
        >
          {submitting ? "Вход..." : "Войти"}
        </button>
        <div className={cx("auth-footer")}>
          <div>
            <Link href="/reset-password" className={cx("link")}>
              Забыли пароль?
            </Link>
          </div>
          <div className={cx("auth-switch-link")}>
            <span>Нет аккаунта?</span>
            <Link href="/register" className={cx("link")}>
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
