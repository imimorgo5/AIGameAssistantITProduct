import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  authApi,
  emailError as validateEmailField,
  passwordError as validatePasswordField,
  repeatedPasswordError,
  validPassword,
} from "entities/session";
import { errorMessage } from "shared/lib/errors";
import { useBlurField } from "shared/lib/forms";

import type React from "react";
export function usePasswordReset() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const emailField = useBlurField(email, validateEmailField);
  const passwordField = useBlurField(password, validatePasswordField);
  const repeatField = useBlurField(passwordAgain, (value) =>
    repeatedPasswordError(value, password),
  );

  const emailError = emailField.error;
  const passwordError = passwordField.error;
  const passwordAgainError = repeatField.error;
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (!success && !(error && token)) return;

    const timeout = setTimeout(
      () => router.push("/login"),
      token ? 2000 : 3000,
    );

    return () => clearTimeout(timeout);
  }, [success, error, token, router]);
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setEmail(e.target.value);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setPassword(e.target.value);

  const handlePasswordAgainChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setPasswordAgain(e.target.value);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);
    if (!token) {
      try {
        if (!email || validateEmailField(email)) return;

        await authApi.requestPasswordReset(email);
        setSuccess("Ссылка для сброса пароля отправлена на указанный email.");
      } catch (err) {
        setError(errorMessage(err, "Произошла ошибка. Попробуйте еще раз."));
      } finally {
        setSubmitting(false);
      }
    } else {
      try {
        if (!validPassword(password) || password !== passwordAgain) return;

        await authApi.resetPassword(token, password);
        setSuccess("Пароль успешно изменён.");
      } catch (err) {
        setError(errorMessage(err, "Произошла ошибка. Попробуйте позже."));
      } finally {
        setSubmitting(false);
      }
    }
  };

  const isEmailFormValid = Boolean(email && !validateEmailField(email));
  const isPasswordFormValid =
    validPassword(password) && password === passwordAgain;

  return {
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
  };
}
