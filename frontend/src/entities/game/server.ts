import "server-only";

import { backendFetch } from "shared/api/backend";
import { page } from "shared/lib/validation";

import { parseGame } from "./model/types";

export async function getInitialCatalog() {
  const response = await backendFetch(
    "/api/games/paged?page=0&size=10&sortBy=title",
  );
  if (!response.ok) throw new Error("Не удалось загрузить каталог игр");
  const data: unknown = await response.json();
  return page(parseGame)(data);
}
