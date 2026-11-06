export type Parser<T> = (value: unknown) => T;
export function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new Error("Некорректный ответ сервера");

  return Object.fromEntries(Object.entries(value));
}
export function text(value: unknown): string {
  if (typeof value !== "string") throw new Error("Некорректный ответ сервера");

  return value;
}
export function number(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new Error("Некорректный ответ сервера");

  return value;
}
export function boolean(value: unknown): boolean {
  if (typeof value !== "boolean") throw new Error("Некорректный ответ сервера");

  return value;
}
export function nullableText(value: unknown): string | null {
  return value == null ? null : text(value);
}
export function list<T>(parse: Parser<T>): Parser<T[]> {
  return (value) => {
    if (!Array.isArray(value)) throw new Error("Некорректный список");

    return value.map(parse);
  };
}
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
export function page<T>(parse: Parser<T>): Parser<Page<T>> {
  return (value) => {
    const data = record(value);

    return {
      content: list(parse)(data.content),
      totalElements: number(data.totalElements),
      totalPages: number(data.totalPages),
      page: number(data.page),
      size: number(data.size),
    };
  };
}
