import "server-only";

import { NextResponse } from "next/server";

import {
  ACCESS_COOKIE,
  parseTokens,
  REFRESH_COOKIE,
  refreshSession,
} from "entities/session/server";
import { backendFetch } from "shared/api/backend";

import type { SessionTokens } from "entities/session/server";
import type { NextRequest } from "next/server";

const limit = 10 * 1024 * 1024;
const publicAuth = new Set([
  "login",
  "register",
  "verify-email",
  "forgot-password",
  "reset-password",
  "logout",
]);

function failure(message: string, status: number): NextResponse {
  return NextResponse.json(
    { message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

class PayloadTooLarge extends Error {}

async function readBody(request: NextRequest): Promise<ArrayBuffer> {
  if (!request.body) return new ArrayBuffer(0);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new PayloadTooLarge();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body.buffer;
}

function setSession(
  response: NextResponse,
  tokens: SessionTokens,
  request: NextRequest,
) {
  const secure = (process.env.APP_PUBLIC_URL ?? request.url).startsWith(
    "https:",
  );
  const options = {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
  } as const;
  // Cookie lifetime is bounded by the backend refresh-token lifetime; backend still verifies every token.
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    ...options,
    maxAge: 30 * 86400,
  });
  if (tokens.refreshToken)
    response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
      ...options,
      maxAge: 30 * 86400,
    });
}

function clearSession(response: NextResponse) {
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
}

export async function forwardApi(
  request: NextRequest,
  segments: string[],
): Promise<NextResponse> {
  if (
    !segments.length ||
    segments.some(
      (part) =>
        !part || part === "." || part === ".." || /[\\/\x00-\x1f]/.test(part),
    )
  )
    return failure("Некорректный адрес", 400);
  const path = `/api/${segments.map(encodeURIComponent).join("/")}`;
  const authAction = segments[0] === "auth" ? segments[1] : undefined;
  if (authAction && !publicAuth.has(authAction) && authAction !== "me")
    return failure("Страница не найдена", 404);
  const mutation = !["GET", "HEAD"].includes(request.method);
  if (mutation) {
    const origin = request.headers.get("origin");
    const fetchSite = request.headers.get("sec-fetch-site");
    const expectedOrigin = new URL(process.env.APP_PUBLIC_URL ?? request.url)
      .origin;
    if (
      (origin && origin !== expectedOrigin && fetchSite !== "same-origin") ||
      fetchSite === "cross-site" ||
      request.headers.get("x-requested-with") !== "XMLHttpRequest"
    )
      return failure("Запрос отклонён", 403);
  }
  const establishesSession =
    request.method === "POST" &&
    ["login", "verify-email"].includes(authAction ?? "");
  const logout = request.method === "POST" && authAction === "logout";
  try {
    if (Number(request.headers.get("content-length")) > limit)
      return failure("Файл слишком большой", 413);
    const body = mutation ? await readBody(request) : undefined;
    if (body && body.byteLength > limit)
      return failure("Файл слишком большой", 413);
    const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
    let accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
    let renewed: SessionTokens | null = null;
    const headers = new Headers();
    for (const name of ["accept", "content-type", "range", "if-range"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    const send = () => {
      if (accessToken && !establishesSession)
        headers.set("Authorization", `Bearer ${accessToken}`);
      const payload = logout ? JSON.stringify({ refreshToken }) : body;
      if (logout) headers.set("Content-Type", "application/json");
      return backendFetch(path + request.nextUrl.search, {
        method: request.method,
        headers,
        ...(payload === undefined ? {} : { body: payload }),
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(300000)]),
      });
    };
    if (logout && !refreshToken) {
      const response = NextResponse.json({ success: true });
      clearSession(response);
      return response;
    }
    let upstream = await send();
    if (
      !establishesSession &&
      !logout &&
      [401, 403].includes(upstream.status) &&
      refreshToken
    ) {
      renewed = await refreshSession(refreshToken);
      if (renewed) {
        await upstream.body?.cancel();
        accessToken = renewed.accessToken;
        upstream = await send();
      }
    }
    if (establishesSession && upstream.ok) {
      const data: unknown = await upstream.json();
      const response = NextResponse.json(
        { success: true },
        { headers: { "Cache-Control": "no-store" } },
      );
      setSession(response, parseTokens(data), request);
      return response;
    }
    const responseHeaders = new Headers({
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    for (const name of [
      "content-type",
      "content-disposition",
      "content-range",
      "accept-ranges",
      "retry-after",
    ]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    if (upstream.headers.get("content-type")?.includes("text/event-stream"))
      responseHeaders.set("X-Accel-Buffering", "no");
    const response = new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
    if (renewed) setSession(response, renewed, request);
    if (logout || upstream.status === 401) clearSession(response);
    return response;
  } catch (error) {
    if (error instanceof PayloadTooLarge)
      return failure("Файл слишком большой", 413);
    const response = failure(
      "Сервис временно недоступен. Попробуйте ещё раз.",
      502,
    );
    if (logout) clearSession(response);
    return response;
  }
}
