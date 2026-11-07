import "server-only";

import { cookies } from "next/headers";

import { backendFetch } from "shared/api/backend";
import { record, text } from "shared/lib/validation";

import { parseUser } from "./model/types";

import type { User } from "./model/types";

export const ACCESS_COOKIE = "ga_access";
export const REFRESH_COOKIE = "ga_refresh";

export interface SessionTokens {
  accessToken: string;
  refreshToken?: string;
}

export function parseTokens(value: unknown): SessionTokens {
  const data = record(value);
  const accessToken = text(data.accessToken);
  if (!accessToken) throw new Error("Invalid session");
  return {
    accessToken,
    ...(typeof data.refreshToken === "string" && data.refreshToken
      ? { refreshToken: data.refreshToken }
      : {}),
  };
}

export async function refreshSession(
  refreshToken: string,
): Promise<SessionTokens | null> {
  const response = await backendFetch("/api/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) return null;
  const data: unknown = await response.json();
  const candidate = record(data);
  if (typeof candidate.accessToken !== "string" || !candidate.accessToken)
    return null;
  return parseTokens(data);
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  let accessToken = store.get(ACCESS_COOKIE)?.value;
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  if (!accessToken && !refreshToken) return null;
  const load = (token: string) =>
    backendFetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
  let response = accessToken ? await load(accessToken) : null;
  if (
    (!response || response.status === 401 || response.status === 403) &&
    refreshToken
  ) {
    accessToken = (await refreshSession(refreshToken))?.accessToken;
    if (!accessToken) return null;
    response = await load(accessToken);
  }
  if (!response || response.status === 401 || response.status === 403)
    return null;
  if (!response.ok) throw new Error("Не удалось проверить сессию");
  const data: unknown = await response.json();
  return parseUser(data);
}
