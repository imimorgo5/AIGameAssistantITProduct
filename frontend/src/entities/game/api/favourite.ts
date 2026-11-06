import { ignoreResponse, mutate, read } from "shared/api/http";
import { page } from "shared/lib/validation";

import { parseGame } from "../model/types";

import type { Id } from "../model/types";
export const favouriteApi = {
  getAllPaged: (
    pageNumber: number,
    size: number,
    filter: string | null = null,
    category: string | null = null,
    sortBy = "title",
  ) =>
    read(
      "/api/favourites/paged",
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
      15000,
      ["favourites", "games"],
    ),
  contains: async (id: Id, title: string): Promise<boolean> => {
    let pageNumber = 0;
    while (true) {
      const result = await favouriteApi.getAllPaged(pageNumber, 50, title);
      if (result.content.some((game) => String(game.id) === String(id)))
        return true;

      pageNumber += 1;
      if (pageNumber >= result.totalPages) return false;
    }
  },
  add: (id: Id) =>
    mutate("post", `/api/favourites/${id}`, undefined, ignoreResponse, [
      "favourites",
    ]),
  remove: (id: Id) =>
    mutate("delete", `/api/favourites/${id}`, undefined, ignoreResponse, [
      "favourites",
    ]),
};
