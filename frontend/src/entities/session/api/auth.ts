import { requestCache } from "shared/api/cache";
import { apiClient, ignoreResponse, mutate } from "shared/api/http";

import type { Credentials, Registration } from "../model/types";

export const authApi = {
  login: async (input: Credentials) => {
    await apiClient.post("/api/auth/login", input);
    requestCache.clear();
  },
  register: (input: Registration) =>
    mutate("post", "/api/auth/register", input, ignoreResponse, []),
  confirmUserEmail: async (token: string) => {
    await apiClient.post("/api/auth/verify-email", null, { params: { token } });
    requestCache.clear();
  },
  logout: async () => {
    try {
      await apiClient.post("/api/auth/logout");
    } finally {
      requestCache.clear();
    }
  },
  requestPasswordReset: (email: string) =>
    mutate("post", "/api/auth/forgot-password", null, ignoreResponse, [], {
      params: { email },
    }),
  resetPassword: (token: string, password: string) =>
    mutate(
      "patch",
      "/api/auth/reset-password",
      { token, password },
      ignoreResponse,
      ["users"],
    ),
};
