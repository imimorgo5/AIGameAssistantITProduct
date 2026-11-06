import { requestCache } from "shared/api/cache";
export const ACCESS_TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";

interface Tokens {
  accessToken?: string | null;
  refreshToken?: string | null;
}

export function setTokens({ accessToken, refreshToken }: Tokens) {
  if (accessToken !== undefined) {
    if (accessToken === null) localStorage.removeItem(ACCESS_TOKEN_KEY);
    else localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  if (refreshToken !== undefined) {
    if (refreshToken === null) localStorage.removeItem(REFRESH_TOKEN_KEY);
    else localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}
export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}
export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}
export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  requestCache.clear();
}
