/** @jest-environment node */
import { NextRequest } from "next/server";

import { forwardApi } from "_app/server";
import { backendFetch } from "shared/api/backend";

jest.mock("shared/api/backend", () => ({ backendFetch: jest.fn() }));
const backend = jest.mocked(backendFetch);
const origin = "http://localhost";

function request(
  path: string,
  options: NonNullable<ConstructorParameters<typeof NextRequest>[1]> = {},
) {
  return new NextRequest(origin + path, {
    ...options,
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      Origin: origin,
      ...options.headers,
    },
  });
}

beforeEach(() => {
  delete process.env.APP_PUBLIC_URL;
  backend.mockReset();
});

test("keeps login tokens in HttpOnly cookies and removes them from the response", async () => {
  backend.mockResolvedValue(
    Response.json({
      accessToken: "access-secret",
      refreshToken: "refresh-secret",
    }),
  );
  const response = await forwardApi(
    request("/api/auth/login", { method: "POST", body: "{}" }),
    ["auth", "login"],
  );
  expect(await response.json()).toEqual({ success: true });
  expect(response.cookies.get("ga_access")?.value).toBe("access-secret");
  expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  expect(response.headers.get("set-cookie")).toContain("SameSite=lax");
  expect(response.headers.get("cache-control")).toBe("no-store");
});

test("uses Secure cookies on an HTTPS deployment", async () => {
  process.env.APP_PUBLIC_URL = "https://game.example";
  backend.mockResolvedValue(
    Response.json({ accessToken: "access", refreshToken: "refresh" }),
  );
  const req = new NextRequest("https://game.example/api/auth/login", {
    method: "POST",
    headers: {
      Origin: "https://game.example",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: "{}",
  });
  const response = await forwardApi(req, ["auth", "login"]);
  expect(response.cookies.get("ga_access")?.secure).toBe(true);
});

test.each([
  { Origin: "https://attacker.example" },
  { "Sec-Fetch-Site": "cross-site" },
  { "X-Requested-With": "" },
])(
  "rejects cross-site or non-XHR mutations before contacting the backend: %j",
  async (headers) => {
    const response = await forwardApi(
      request("/api/games", { method: "POST", headers }),
      ["games"],
    );
    expect(response.status).toBe(403);
    expect(backend).not.toHaveBeenCalled();
  },
);

test.each(["token", "refresh"])(
  "does not expose raw JWT endpoint %s",
  async (action) => {
    expect(
      (await forwardApi(request(`/api/auth/${action}`), ["auth", action]))
        .status,
    ).toBe(404);
    expect(backend).not.toHaveBeenCalled();
  },
);

test("renews an expired access token on the server and retries with the new credential", async () => {
  backend
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(
      Response.json({ accessToken: "renewed", refreshToken: null }),
    )
    .mockResolvedValueOnce(Response.json({ id: 1 }));
  const response = await forwardApi(
    request("/api/auth/me", {
      headers: { Cookie: "ga_access=expired; ga_refresh=valid" },
    }),
    ["auth", "me"],
  );
  expect(await response.json()).toEqual({ id: 1 });
  expect(backend).toHaveBeenCalledTimes(3);
  const headers = backend.mock.calls[2]?.[1]?.headers;
  expect(new Headers(headers).get("authorization")).toBe("Bearer renewed");
  expect(response.cookies.get("ga_access")?.value).toBe("renewed");
});

test("ignores caller-supplied Authorization and forwards only the server cookie", async () => {
  backend.mockResolvedValue(Response.json({ id: 1 }));
  await forwardApi(
    request("/api/auth/me", {
      headers: { Authorization: "Bearer forged", Cookie: "ga_access=trusted" },
    }),
    ["auth", "me"],
  );
  expect(
    new Headers(backend.mock.calls[0]?.[1]?.headers).get("authorization"),
  ).toBe("Bearer trusted");
});

test("streams SSE bodies without buffering and forwards file response metadata", async () => {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        new TextEncoder().encode("data:hello\n\nevent:done\ndata:ok\n\n"),
      );
      controller.close();
    },
  });
  backend.mockResolvedValue(
    new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Content-Disposition": "inline",
      },
    }),
  );
  const response = await forwardApi(
    request("/api/chat/1/answer", { method: "POST" }),
    ["chat", "1", "answer"],
  );
  expect(response.body).toBe(stream);
  expect(response.headers.get("x-accel-buffering")).toBe("no");
  expect(response.headers.get("content-disposition")).toBe("inline");
  expect(await response.text()).toContain("event:done");
});

test("redacts upstream failures and removes cookies even when logout fails", async () => {
  backend.mockRejectedValue(new Error("private backend error and token"));
  const response = await forwardApi(
    request("/api/auth/logout", {
      method: "POST",
      headers: { Cookie: "ga_refresh=secret" },
    }),
    ["auth", "logout"],
  );
  expect(response.status).toBe(502);
  expect(await response.text()).not.toContain("private backend");
  expect(response.cookies.get("ga_refresh")?.value).toBe("");
});

test("rejects oversized uploads and traversal segments", async () => {
  const response = await forwardApi(
    request("/api/games", {
      method: "POST",
      headers: { "Content-Length": "11000000" },
    }),
    ["games"],
  );
  expect(response.status).toBe(413);
  expect(
    (await forwardApi(request("/api/files"), ["files", "../secret"])).status,
  ).toBe(400);
  expect(backend).not.toHaveBeenCalled();
});

test("enforces the upload limit even without Content-Length", async () => {
  const response = await forwardApi(
    request("/api/games", {
      method: "POST",
      body: "x".repeat(10 * 1024 * 1024 + 1),
    }),
    ["games"],
  );
  expect(response.status).toBe(413);
  expect(backend).not.toHaveBeenCalled();
});

test("accepts browser same-origin login when the public URL differs from the local dev address", async () => {
  process.env.APP_PUBLIC_URL = "http://localhost";
  backend.mockResolvedValue(
    Response.json({ accessToken: "access", refreshToken: "refresh" }),
  );
  const req = new NextRequest("http://127.0.0.1:3000/api/auth/login", {
    method: "POST",
    headers: {
      Origin: "http://localhost:3000",
      "Sec-Fetch-Site": "same-origin",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: "{}",
  });
  const response = await forwardApi(req, ["auth", "login"]);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ success: true });
});
