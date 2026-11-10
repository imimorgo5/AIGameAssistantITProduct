import { ignoreResponse, mutate, read } from "shared/api/http";
import { list, record, text } from "shared/lib/validation";

import {
  parseCatalogModel,
  parseModel,
  parseModelRegistry,
} from "../model/types";

import type { ModelInput } from "../model/types";
export const modelApi = {
  getAll: () => read("/api/models", list(parseModel), {}, 30000, ["models"]),
  getRegistry: () =>
    read("/api/models/registry", parseModelRegistry, {}, 10000, ["models"]),
  getCatalog: () =>
    read("/api/models/catalog", list(parseCatalogModel), {}, 3600000, [
      "model-catalog",
    ]),
  add: (input: ModelInput) =>
    mutate("post", "/api/models", input, ignoreResponse, ["models"]),
  remove: (id: string) =>
    mutate(
      "delete",
      `/api/models/${encodeURIComponent(id)}`,
      undefined,
      ignoreResponse,
      ["models"],
    ),
  setEnabled: (id: string, enabled: boolean) =>
    mutate(
      "patch",
      `/api/models/${encodeURIComponent(id)}`,
      { enabled },
      ignoreResponse,
      ["models"],
    ),
  getMain: () =>
    read("/api/system/model", (value) => text(record(value).model), {}, 10000, [
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
      ["users", "models"],
      { params: { model } },
    ),
};
