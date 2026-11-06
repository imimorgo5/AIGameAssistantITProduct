export const validateEmail = (email: string) =>
  email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? {
      isValid: false,
      message: "Некорректный email",
    }
    : {
      isValid: true,
      message: "",
    };
export function escapeText(text: string): string {
  const escapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
    "\\": "&#x5C;",
    "`": "&#x60;",
  };

  return text.replace(/[&<>"'/\\`]/g, (char) => escapes[char] ?? char);
}
export function formatDate(
  value: string | number | Date | null | undefined,
): string {
  if (!value) return "-";

  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

  const pad = (n: number) => String(n).padStart(2, "0");

  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear() % 100} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
