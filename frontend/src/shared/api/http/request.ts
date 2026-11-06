import { requestCache } from "shared/api/cache";
import { getAccessToken, getRefreshToken } from "shared/lib/storage";

import { apiClient } from "./axios";

import type { AxiosRequestConfig } from "axios";
import type { Parser } from "shared/lib/validation";
export async function read<T>(
  url: string,
  parse: Parser<T>,
  config: AxiosRequestConfig<unknown> = {},
  ttl = 30000,
  tags: readonly string[] = [],
): Promise<T> {
  const load = async () =>
    parse((await apiClient.get<unknown>(url, config)).data);

  const key = JSON.stringify([
    getRefreshToken() ?? getAccessToken(),
    url,
    config.params,
    config.responseType,
  ]);

  return requestCache.read(key, load, ttl, tags);
}
export async function mutate<T>(
  method: "post" | "patch" | "put" | "delete",
  url: string,
  body: unknown,
  parse: Parser<T>,
  tags: readonly string[],
  config: AxiosRequestConfig<unknown> = {},
): Promise<T> {
  const response = await apiClient.request<unknown>({
    ...config,
    method,
    url,
    data: body,
  });

  requestCache.invalidate(...tags);

  return parse(response.data);
}
export function ignoreResponse(_value: unknown): void {}
