import { requestCache } from "shared/api/cache";
import { apiClient, ignoreResponse, mutate } from "shared/api/http";
import { clearTokens, getRefreshToken, setTokens } from "shared/lib/storage";
import { record, text } from "shared/lib/validation";

import type { Credentials, Registration } from "../model/types";

function tokens(value: unknown) {
  const d = record(value);
  const accessToken = text(d.accessToken);
  const refreshToken =
    d.refreshToken == null ? undefined : text(d.refreshToken);

  setTokens({
    accessToken,
    ...(refreshToken === undefined ? {} : { refreshToken }),
  });

  return {
    accessToken,
    refreshToken,
  };
}

export const authApi = {
  login: async (input: Credentials) => {
    const response = await apiClient.post<unknown>("/api/auth/login", input);
    requestCache.clear();

    return tokens(response.data);
  },
  register: (input: Registration) =>
    mutate("post", "/api/auth/register", input, ignoreResponse, []),
  confirmUserEmail: async (token: string) => {
    const response = await apiClient.post<unknown>(
      "/api/auth/verify-email",
      null,
      {
        params: {
          token,
        },
      },
    );

    requestCache.clear();

    return tokens(response.data);
  },
  logout: async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken)
        await apiClient.post("/api/auth/logout", {
          refreshToken,
        });
    } finally {
      clearTokens();
    }
  },
  requestPasswordReset: (email: string) =>
    mutate("post", "/api/auth/forgot-password", null, ignoreResponse, [], {
      params: {
        email,
      },
    }),
  resetPassword: (token: string, password: string) =>
    mutate(
      "patch",
      "/api/auth/reset-password",
      {
        token,
        password,
      },
      ignoreResponse,
      ["users"],
    ),
};
