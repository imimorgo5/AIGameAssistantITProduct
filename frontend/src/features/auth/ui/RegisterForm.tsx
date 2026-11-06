import {
  emailError as validateEmailField,
  loginError as validateLoginField,
  passwordError as validatePasswordField,
  repeatedPasswordError,
  useAuth,
  validPassword,
} from "entities/session";
import { useState } from "react";
import { Link } from "react-router-dom";
import { errorMessage } from "shared/lib/errors";
import { useBlurField } from "shared/lib/forms";
import { bindClasses } from "shared/lib/styles";

import styles from "./AuthPages.module.scss";

import type { ChangeEvent, FormEvent } from "react";
const cx = bindClasses(styles);
export default function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [userLogin, setUserLogin] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const emailField = useBlurField(email, validateEmailField);
  const loginField = useBlurField(userLogin, validateLoginField);
  const passwordField = useBlurField(password, validatePasswordField);
  const repeatField = useBlurField(passwordAgain, (value) =>
    repeatedPasswordError(value, password),
  );

  const emailError = emailField.error;
  const userLoginError = loginField.error;
  const passwordError = passwordField.error;
  const passwordAgainError = repeatField.error;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) =>
    setEmail(e.target.value);

  const handleUserLoginChange = (e: ChangeEvent<HTMLInputElement>) =>
    setUserLogin(e.target.value);

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) =>
    setPassword(e.target.value);

  const handlePasswordAgainChange = (e: ChangeEvent<HTMLInputElement>) =>
    setPasswordAgain(e.target.value);

  const isFormValid = Boolean(
    email &&
      userLogin &&
      !validateLoginField(userLogin) &&
      validPassword(password) &&
      passwordAgain === password &&
      !validateEmailField(email),
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid || loading) return;

    setError(null);
    setLoading(true);
    try {
      await register({
        email,
        login: userLogin,
        password,
      });
      onSuccess && onSuccess();
    } catch (regErr) {
      setError(
        errorMessage(
          regErr,
          "Ошибка регистрации. Возможно, пользователь с таким email уже существует.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={cx("auth-form")} onSubmit={handleSubmit} noValidate>
      <div className={cx("auth-inputs")}>
        <div className={cx("auth-form-row")}>
          <input
            id="reg-login"
            name="login"
            type="text"
            className={cx("auth-form-input")}
            value={userLogin}
            onChange={handleUserLoginChange}
            onBlur={loginField.onBlur}
            maxLength={30}
            required
            aria-label="Введите имя пользователя"
            placeholder="Введите имя пользователя"
            autoComplete="name"
            aria-invalid={!!userLoginError || !!error}
            aria-describedby={userLoginError ? "reg-login-error" : undefined}
          />
          {userLoginError && (
            <div
              id="reg-login-error"
              className={cx("field-error")}
              role="alert"
            >
              {userLoginError}
            </div>
          )}
        </div>

        <div className={cx("auth-form-row")}>
          <input
            id="reg-email"
            name="email"
            type="email"
            className={cx("auth-form-input")}
            value={email}
            onChange={handleEmailChange}
            onBlur={emailField.onBlur}
            maxLength={50}
            required
            aria-label="Введите e-mail"
            placeholder="Введите e-mail"
            autoComplete="email"
            aria-invalid={!!emailError || !!error}
            aria-describedby={emailError ? "reg-email-error" : undefined}
          />
          {emailError && (
            <div
              id="reg-email-error"
              className={cx("field-error")}
              role="alert"
            >
              {emailError}
            </div>
          )}
        </div>

        <div className={cx("auth-form-row")}>
          <input
            id="reg-password"
            name="password"
            type="password"
            className={cx("auth-form-input")}
            value={password}
            onChange={handlePasswordChange}
            onBlur={passwordField.onBlur}
            maxLength={30}
            required
            aria-label="Введите пароль"
            placeholder="Введите пароль"
            autoComplete="new-password"
            aria-invalid={!!passwordError || !!error}
            aria-describedby={passwordError ? "reg-password-error" : undefined}
          />
          {passwordError && (
            <div
              id="reg-password-error"
              className={cx("field-error")}
              role="alert"
            >
              {passwordError}
            </div>
          )}
        </div>

        <div className={cx("auth-form-row")}>
          <input
            id="reg-password-again"
            name="passwordAgain"
            type="password"
            className={cx("auth-form-input")}
            value={passwordAgain}
            onChange={handlePasswordAgainChange}
            onBlur={repeatField.onBlur}
            maxLength={30}
            required
            aria-label="Повторите пароль"
            placeholder="Повторите пароль"
            autoComplete="new-password"
            aria-invalid={!!passwordAgainError || !!error}
            aria-describedby={
              passwordAgainError ? "reg-password-again-error" : undefined
            }
          />
          {passwordAgainError && (
            <div
              id="reg-password-again-error"
              className={cx("field-error")}
              role="alert"
            >
              {passwordAgainError}
            </div>
          )}
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
          disabled={!isFormValid || loading}
          aria-disabled={!isFormValid || loading}
        >
          {loading ? "Обработка..." : "Зарегистрироваться"}
        </button>
        <div className={cx("auth-footer")}>
          <div className={cx("auth-switch-link")}>
            <span>Есть аккаунт?</span>
            <Link to="/login" className={cx("link")}>
              Войти
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
