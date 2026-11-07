import axios from "axios";

import { accessRedirect } from "shared/lib/access";

export const API_BASE_URL = "";
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 100000,
  headers: { "X-Requested-With": "XMLHttpRequest" },
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (
      axios.isAxiosError<unknown>(error) &&
      error.response?.data instanceof Blob
    ) {
      const body = await error.response.data.text();
      try {
        error.response.data = JSON.parse(body);
      } catch {
        error.response.data = body;
      }
    }
    if (
      axios.isAxiosError(error) &&
      typeof window !== "undefined" &&
      !error.config?.url?.startsWith("/api/auth/")
    ) {
      const target = accessRedirect(
        error.response?.status,
        true,
        window.location.pathname,
      );
      if (target) window.location.replace(target);
    }
    throw error;
  },
);
