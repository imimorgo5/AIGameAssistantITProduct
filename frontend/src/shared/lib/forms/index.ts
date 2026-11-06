import { useState } from "react";

export function useBlurField(value: string, validate: (value: string) => string) {
  const [touched, setTouched] = useState(false);

  return {
    error: touched ? validate(value) : "",
    onBlur: () => setTouched(true),
    reset: () => setTouched(false),
  };
}

export function textError(value: string, maximum: number, required = true): string {
  if (required && !value.trim()) return "Обязательное поле";

  return value.length > maximum ? `Максимум ${maximum} символов` : "";
}

export function fileError(file: File | null, kind: "image" | "pdf", existing = false): string {
  if (!file) return existing ? "" : "Выберите файл";

  const maximum = kind === "image" ? 5 : 10;
  if (file.size > maximum * 1024 * 1024) return `Максимальный размер — ${maximum} МБ`;

  if (kind === "image" && !file.type.startsWith("image/")) return "Выберите изображение";

  if (kind === "pdf" && !/\.pdf$/i.test(file.name)) return "Выберите PDF-файл";

  return "";
}
