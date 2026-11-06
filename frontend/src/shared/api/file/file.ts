import { read } from "shared/api/http";

function blob(value: unknown): Blob {
  if (!(value instanceof Blob)) throw new Error("Некорректный файл");

  return value;
}

export const fileApi = {
  getImageBlob: (title: string) =>
    read(
      `/api/files/image/${encodeURIComponent(title)}`,
      blob,
      {
        responseType: "blob",
      },
      300000,
      ["files"],
    ),
  getRulesBlob: (title: string) =>
    read(
      `/api/files/rules/${encodeURIComponent(title)}`,
      blob,
      {
        responseType: "blob",
      },
      60000,
      ["files"],
    ),
};
