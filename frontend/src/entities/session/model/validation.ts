import { validateEmail } from "shared/lib/utils";
export function emailError(value: string): string {
  if (!value.trim()) return "Обязательное поле";

  if (value.length > 50) return "Максимум 50 символов";

  const result = validateEmail(value);

  return result.isValid ? "" : result.message;
}
export function loginError(value: string): string {
  if (!value.trim()) return "Обязательное поле";

  return value.length > 30 ? "Максимум 30 символов" : "";
}
export function passwordError(value: string): string {
  if (!value) return "Обязательное поле";

  if (value.length < 4) return "Слишком короткий пароль";

  return value.length > 30 ? "Максимум 30 символов" : "";
}
export function repeatedPasswordError(value: string, password: string): string {
  if (!value) return "Обязательное поле";

  if (value.length > 30) return "Максимум 30 символов";

  return value !== password ? "Пароли не совпадают" : "";
}
export function validPassword(value: string): boolean {
  return value.length >= 4 && value.length <= 30;
}
