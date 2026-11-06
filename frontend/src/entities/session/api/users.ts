import { ignoreResponse, mutate, read } from "shared/api/http";
import { page } from "shared/lib/validation";

import { parseUser } from "../model/types";

import type { UserImageInput } from "../model/types";

type Id = string | number;

export const userApi = {
  getAuthenticated: () => read("/api/auth/me", parseUser, {}, 15000, ["users"]),
  getAllPaged: (
    pageNumber: number,
    size: number,
    filter: string | null = null,
  ) =>
    read(
      "/api/users/paged",
      page(parseUser),
      {
        params: {
          page: pageNumber,
          size,
          filter,
        },
      },
      15000,
      ["users"],
    ),
  updatePassword: (
    id: Id,
    body: {
      newPassword: string;
    },
  ) =>
    mutate(
      "patch",
      `/api/users/${encodeURIComponent(id)}/password`,
      body,
      ignoreResponse,
      ["users"],
    ),
  delete: (id: Id) =>
    mutate(
      "delete",
      `/api/users/${encodeURIComponent(id)}`,
      undefined,
      ignoreResponse,
      ["users"],
    ),
  makeAdmin: (id: Id) =>
    mutate(
      "patch",
      `/api/users/${encodeURIComponent(id)}/make-admin`,
      undefined,
      ignoreResponse,
      ["users"],
    ),
  makeNotAdmin: (id: Id) =>
    mutate(
      "patch",
      `/api/users/${encodeURIComponent(id)}/make-not-admin`,
      undefined,
      ignoreResponse,
      ["users"],
    ),
  forciblyConfirmUserEmail: (id: Id) =>
    mutate(
      "patch",
      `/api/users/${encodeURIComponent(id)}/enable`,
      undefined,
      ignoreResponse,
      ["users"],
    ),
  updateImage: (id: Id, input: UserImageInput) => {
    const data = new FormData();
    data.append("email", input.email);
    data.append("login", input.login);
    data.append("password", input.password);
    data.append("isAdmin", String(input.isAdmin));
    if (input.imageFile) data.append("imageFile", input.imageFile);

    return mutate(
      "patch",
      `/api/users/${encodeURIComponent(id)}/image`,
      data,
      parseUser,
      ["users", "files"],
    );
  },
};
