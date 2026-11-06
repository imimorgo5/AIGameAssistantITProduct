import { ignoreResponse, mutate, read } from "shared/api/http";
import { text } from "shared/lib/validation";
export const promptApi = {
  get: () => read("/api/system/prompt", text, {}, 30000, ["prompt"]),
  update: (prompt: string) =>
    mutate(
      "patch",
      "/api/system/prompt",
      {
        prompt,
      },
      ignoreResponse,
      ["prompt"],
    ),
};
