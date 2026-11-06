import { createRequestCache } from "./index";
test("coalesces concurrent reads, expires settled values and retries failures", async () => {
  jest.useFakeTimers();
  const cache = createRequestCache();
  const load = jest.fn(async () => "value");
  await expect(
    Promise.all([
      cache.read("key", load, 1000, ["games"]),
      cache.read("key", load, 1000, ["games"]),
    ]),
  ).resolves.toEqual(["value", "value"]);
  expect(load).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(1001);
  await cache.read("key", load, 1000, ["games"]);
  expect(load).toHaveBeenCalledTimes(2);
  const failing = jest.fn(async () => {
    throw new Error("offline");
  });

  await expect(cache.read("failed", failing, 1000, [])).rejects.toThrow(
    "offline",
  );
  await expect(cache.read("failed", load, 1000, [])).resolves.toBe("value");
  jest.useRealTimers();
});
test("invalidation during a pending read prevents stale data from returning to the cache", async () => {
  const cache = createRequestCache();
  let resolve: (value: string) => void = () => {
    throw new Error("not started");
  };

  const pending = cache.read(
    "games",
    () =>
      new Promise<string>((done) => {
        resolve = done;
      }),
    1000,
    ["games"],
  );

  cache.invalidate("games");
  await expect(
    cache.read("games", async () => "updated", 1000, ["games"]),
  ).resolves.toBe("updated");
  resolve("old");
  await pending;
  await expect(
    cache.read("games", async () => "unexpected", 1000, ["games"]),
  ).resolves.toBe("updated");
});
test("clearing a session discards every cached response", async () => {
  const cache = createRequestCache(2);
  const load = jest.fn(async () => "private");
  await cache.read("user", load, 1000, ["users"]);
  cache.clear();
  await cache.read("user", load, 1000, ["users"]);
  expect(load).toHaveBeenCalledTimes(2);
});
