import { ignoreResponse, mutate, read } from "shared/api/http";
import { page, record, text } from "shared/lib/validation";

import { parseGame } from "../model/types";

import type { GameInput, Id } from "../model/types";

function form(input: GameInput): FormData {
  const data = new FormData();
  data.append("title", input.title);
  data.append("description", input.description);
  data.append("categories", input.categories.join(","));
  data.append("imageFile", input.imageFile ?? new Blob());
  data.append("rulesFile", input.rulesFile ?? new Blob());

  return data;
}

export const gameApi = {
  rulesStatus: (id: number) =>
    read(
      `/api/games/${id}/rules/status`,
      (value) => {
        const data = record(value);
        return { status: text(data.status), error: text(data.error) };
      },
      {},
      0,
    ),
  retryRules: (id: number) =>
    mutate("post", `/api/games/${id}/rules/retry`, undefined, ignoreResponse, [
      "rules",
    ]),
  create: (input: GameInput) =>
    mutate("post", "/api/games", form(input), parseGame, [
      "games",
      "favourites",
      "files",
    ]),
  read: (id: Id) =>
    read(`/api/games/${encodeURIComponent(id)}`, parseGame, {}, 60000, [
      "games",
    ]),
  update: (id: Id, input: GameInput) =>
    mutate(
      "patch",
      `/api/games/${encodeURIComponent(id)}`,
      form(input),
      parseGame,
      ["games", "favourites", "files"],
    ),
  delete: (id: Id) =>
    mutate(
      "delete",
      `/api/games/${encodeURIComponent(id)}`,
      undefined,
      ignoreResponse,
      ["games", "favourites", "chats", "files"],
    ),
  getAllPaged: (
    pageNumber: number,
    size: number,
    filter: string | null = null,
    category: string | null = null,
    sortBy = "title",
  ) =>
    read(
      "/api/games/paged",
      page(parseGame),
      {
        params: {
          page: pageNumber,
          size,
          filter,
          category,
          sortBy,
        },
      },
      30000,
      ["games"],
    ),
};
