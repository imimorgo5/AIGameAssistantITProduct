import axios from "axios";
import { accessRedirect } from "shared/lib/access";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "shared/lib/storage";
import { record, text } from "shared/lib/validation";

import type { InternalAxiosRequestConfig } from "axios";
export const API_BASE_URL = "";
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 100000,
});
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

let refreshing: Promise<string> | null = null;

function expired(token: string | null): boolean {
  if (!token) return false;

  try {
    const payload = token.split(".")[1];
    if (!payload) return true;

    const claims = record(
      JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))),
    );

    return typeof claims.exp !== "number" || claims.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);

  return config;
});

async function refreshAccess(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("Сессия завершена");

  const response = await refreshClient.post<unknown>("/api/auth/token", {
    refreshToken,
  });

  const data = record(response.data);
  const accessToken = text(data.accessToken);
  if (getRefreshToken() !== refreshToken) throw new Error("Сессия изменилась");

  setTokens({ accessToken });

  return accessToken;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isAxiosError<unknown>(error) && error.response?.data instanceof Blob) {
      const body = await error.response.data.text();
      try {
        error.response.data = JSON.parse(body);
      } catch {
        error.response.data = body;
      }
    }

    if (axios.isAxiosError(error) && error.response?.status === 403 && !expired(getAccessToken()) && !(error.config?.url?.startsWith("/api/auth/") && error.config.url !== "/api/auth/me")) {
      const target = accessRedirect(403, Boolean(getAccessToken()), window.location.pathname);
      if (target) window.location.replace(target);
    }

    if (
      !axios.isAxiosError(error) ||
      !error.config ||
      !(
        error.response?.status === 401 ||
        (error.response?.status === 403 && expired(getAccessToken()))
      ) ||
      (error.config.url?.startsWith("/api/auth/") &&
        error.config.url !== "/api/auth/me")
    )
      throw error;

    const original: InternalAxiosRequestConfig & { authRetry?: boolean } =
      error.config;

    if (original.authRetry) {
      clearTokens();
      const target = accessRedirect(401, false, window.location.pathname);
      if (target) window.location.replace(target);

      throw error;
    }

    original.authRetry = true;
    const session = getRefreshToken();
    try {
      if (!refreshing)
        refreshing = refreshAccess().finally(() => {
          refreshing = null;
        });

      const token = await refreshing;
      if (getRefreshToken() !== session) throw new Error("Сессия изменилась");

      original.headers.set("Authorization", `Bearer ${token}`);

      return apiClient(original);
    } catch (refreshError) {
      if (getRefreshToken() === session) {
        clearTokens();
        window.location.assign("/login");
      }

      throw refreshError;
    }
  },
);
