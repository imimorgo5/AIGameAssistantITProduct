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
export function formatDate(
  value: string | number | Date | null | undefined,
): string {
  if (!value) return "-";

  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

  const pad = (n: number) => String(n).padStart(2, "0");

  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear() % 100} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function originalFileName(name: string): string {
  return name.replace(
    /^(?:\d{13}|[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12})[_-]/i,
    "",
  );
}
