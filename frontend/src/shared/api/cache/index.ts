interface Entry {
  value: Promise<unknown>;
  expires: number;
  tags: readonly string[];
}

export function createRequestCache(limit = 100) {
  const entries = new Map<string, Entry>();

  return {
    async read<T>(
      key: string,
      load: () => Promise<T>,
      ttl: number,
      tags: readonly string[],
    ): Promise<T> {
      const cached = entries.get(key);
      if (cached && cached.expires > Date.now())
        return cached.value.then((value) => value as T);

      entries.delete(key);
      const pending = load();
      const entry: Entry = {
        value: pending,
        expires: Infinity,
        tags,
      };

      entries.set(key, entry);
      while (entries.size > limit) {
        const oldest = entries.keys().next().value;
        if (oldest === undefined) break;

        entries.delete(oldest);
      }

      try {
        const value = await pending;
        if (entries.get(key) === entry) entry.expires = Date.now() + ttl;

        return value;
      } catch (error) {
        if (entries.get(key) === entry) entries.delete(key);

        throw error;
      }
    },
    invalidate(...tags: string[]) {
      for (const [key, entry] of entries)
        if (entry.tags.some((tag) => tags.includes(tag))) entries.delete(key);
    },
    clear() {
      entries.clear();
    },
  };
}
export const requestCache = createRequestCache();
