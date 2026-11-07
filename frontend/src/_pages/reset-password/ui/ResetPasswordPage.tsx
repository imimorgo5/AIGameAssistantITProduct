"use client";

import Image from "next/image";
import Link from "next/link";

import { authStyles as style0 } from "features/auth";
import { bindClasses } from "shared/lib/styles";

import { usePasswordReset } from "../model/usePasswordReset";

const logo = "/images/LOGO.svg";
export default function ResetPasswordPage() {
  const {
    success,
    error,
    token,
    handleSubmit,
    email,
    handleEmailChange,
    emailField,
    emailError,
    password,
    handlePasswordChange,
    passwordField,
    passwordError,
    passwordAgain,
    handlePasswordAgainChange,
    repeatField,
    passwordAgainError,
    submitting,
    isEmailFormValid,
    isPasswordFormValid,
  } = usePasswordReset();

  return (
    <div className={cx("auth-root reset-password-page")}>
      <div className={cx("auth-bg")} role="presentation" aria-hidden="true" />
      <div className={cx("auth-top")}>
        <Link href="/" className={cx("auth-logo-link")} aria-label="На главную">
          <div className={cx("auth-logo")}>
            <Image
              unoptimized
              width={112}
              height={42}
              src={logo}
              alt="AIGameAssistant"
            />
          </div>
        </Link>
      </div>

      <div className={cx("auth-container")}>
        <div className={cx("auth-left-container")} />
        <div className={cx("auth-right-container")}>
          <h1 className={cx("auth-hello")}>Сброс пароля</h1>
          <div className={cx("auth-card")} role="region">
            <div className={cx("auth-form-wrap")}>
              {!success && !(error && token) ? (
                <form
                  className={cx("auth-form")}
                  onSubmit={handleSubmit}
                  noValidate
                >
                  <div className={cx("auth-inputs")}>
                    {!token ? (
                      <>
                        <label className={cx("auth-form-label")}>
                          Введите e-mail, указанный при регистрации, на него
                          будет отправлена ссылка для сброса пароля
                        </label>
                        <div className={cx("auth-form-row")}>
                          <input
                            type="text"
                            className={cx("auth-form-input")}
                            value={email}
                            onChange={handleEmailChange}
                            onBlur={emailField.onBlur}
                            maxLength={50}
                            placeholder="Введите e-mail"
                            autoComplete="email"
                            aria-invalid={!!emailError}
                            aria-label="Введите e-mail"
                          />
                          {emailError && (
                            <div className={cx("field-error")}>
                              {emailError}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={cx("auth-form-row")}>
                          <input
                            type="password"
                            className={cx("auth-form-input")}
                            value={password}
                            onChange={handlePasswordChange}
                            onBlur={passwordField.onBlur}
                            maxLength={30}
                            placeholder="Введите новый пароль"
                            autoComplete="new-password"
                            aria-invalid={!!passwordError}
                            aria-label="Введите новый пароль"
                          />
                          {passwordError && (
                            <div className={cx("field-error")}>
                              {passwordError}
                            </div>
                          )}
                        </div>
                        <div className={cx("auth-form-row")}>
                          <input
                            type="password"
                            className={cx("auth-form-input")}
                            value={passwordAgain}
                            onChange={handlePasswordAgainChange}
                            onBlur={repeatField.onBlur}
                            maxLength={30}
                            placeholder="Повторите пароль"
                            autoComplete="new-password"
                            aria-invalid={!!passwordAgainError}
                            aria-label="Повторите пароль"
                          />
                          {passwordAgainError && (
                            <div className={cx("field-error")}>
                              {passwordAgainError}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {error && !token && (
                    <div className={cx("auth-form-error")}>
                      {error.slice(0, 100)}
                    </div>
                  )}

                  <div className={cx("auth-form-actions")}>
                    <button
                      type="submit"
                      className={cx("btn")}
                      disabled={
                        submitting ||
                        (!token && !isEmailFormValid) ||
                        (Boolean(token) && !isPasswordFormValid)
                      }
                    >
                      {submitting ? "Обработка..." : "Отправить"}
                    </button>

                    {!token && (
                      <div className={cx("auth-footer")}>
                        <div className={cx("auth-switch-link")}>
                          <span>Нет аккаунта?</span>
                          <Link href="/register" className={cx("link")}>
                            Зарегистрироваться
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              ) : success ? (
                <div className={cx("auth-success-message")}>{success}</div>
              ) : (
                <div className={cx("auth-error-message")}>{error}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
const cx = bindClasses(style0);
