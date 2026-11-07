import axios from "axios";

import { record } from "shared/lib/validation";

export function errorMessage(
  error: unknown,
  fallback = "Произошла ошибка. Попробуйте ещё раз.",
): string {
  if (axios.isAxiosError<unknown>(error) && error.response) {
    return responseMessage(error.response.data, fallback);
  }

  return error instanceof Error &&
    !axios.isAxiosError(error) &&
    error.message.trim()
    ? error.message
    : fallback;
}

export function responseMessage(
  body: unknown,
  fallback = "Произошла ошибка. Попробуйте ещё раз.",
): string {
  if (typeof body === "string" && body.trim()) return body.trim();

  try {
    const data = record(body);
    for (const key of ["message", "detail", "error"]) {
      const message = data[key];
      if (typeof message === "string" && message.trim()) return message.trim();
    }
  } catch {
    return fallback;
  }

  return fallback;
}
