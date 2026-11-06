import { ignoreResponse, mutate, read } from "shared/api/http";
import { list, record, text } from "shared/lib/validation";

import { parseModel } from "../model/types";
export const modelApi = {
  getAll: () => read("/api/models", list(parseModel), {}, 300000, ["models"]),
  getMain: () =>
    read("/api/system/model", (value) => text(record(value).model), {}, 60000, [
      "models",
    ]),
  updateMain: (model: string) =>
    mutate(
      "patch",
      "/api/system/model",
      {
        model,
      },
      ignoreResponse,
      ["models"],
    ),
  updateUser: (id: string | number, model: string) =>
    mutate(
      "patch",
      `/api/users/${encodeURIComponent(id)}/model`,
      null,
      ignoreResponse,
      ["users"],
      {
        params: {
          model,
        },
      },
    ),
};
