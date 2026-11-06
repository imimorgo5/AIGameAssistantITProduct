export function createObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}
export function revokeObjectUrl(url: string | null | undefined) {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}
export async function downloadBlob(
  data: Blob | string | null,
  isBlobUrl = false,
  filename = "",
) {
  if (!data) return;

  const url = typeof data === "string" ? data : createObjectUrl(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  if (!isBlobUrl && typeof data !== "string")
    setTimeout(() => revokeObjectUrl(url), 1000);
}
