import "server-only";

export function backendUrl(path: string): URL {
  const origin = new URL(process.env.BACKEND_URL ?? "http://127.0.0.1:8080");
  if (
    !["http:", "https:"].includes(origin.protocol) ||
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash
  ) {
    throw new Error("BACKEND_URL must be an HTTP(S) origin");
  }
  if (!path.startsWith("/api/") || path.startsWith("//"))
    throw new Error("Invalid backend path");
  return new URL(path, origin);
}

export function backendFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(backendUrl(path), {
    ...init,
    cache: "no-store",
    redirect: "manual",
    signal: init.signal ?? AbortSignal.timeout(15000),
  });
}
