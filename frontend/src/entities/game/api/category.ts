import { ignoreResponse, mutate, read } from "shared/api/http";
import { list } from "shared/lib/validation";

import { parseCategory } from "../model/types";

import type { Id } from "../model/types";
export const categoryApi = {
  getAll: () =>
    read("/api/categories", list(parseCategory), {}, 300000, ["categories"]),
  create: (name: string) =>
    mutate(
      "post",
      "/api/categories",
      {
        name,
      },
      parseCategory,
      ["categories"],
    ),
  delete: (id: Id) =>
    mutate(
      "delete",
      `/api/categories/${encodeURIComponent(id)}`,
      undefined,
      ignoreResponse,
      ["categories", "games"],
    ),
};
