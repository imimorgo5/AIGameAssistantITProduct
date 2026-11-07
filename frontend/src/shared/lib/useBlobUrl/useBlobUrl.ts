import { useCallback, useEffect, useState } from "react";

import { createObjectUrl, revokeObjectUrl } from "shared/lib/blobUtils";
import { errorMessage } from "shared/lib/errors";

type Fetcher = (title: string) => Promise<Blob>;
interface Result {
  title: string;
  revision: number;
  fetcher: Fetcher;
  url: string | null;
  error: string | null;
}

export default function useBlobUrl(
  fetcher: Fetcher,
  fileTitle: string | null | undefined,
) {
  const [result, setResult] = useState<Result | null>(null);
  const [revision, setRevision] = useState(0);
  const current =
    result?.title === fileTitle &&
    result?.revision === revision &&
    result?.fetcher === fetcher
      ? result
      : null;
  useEffect(() => {
    if (!fileTitle) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    void fetcher(fileTitle)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = createObjectUrl(blob);
        setResult({
          title: fileTitle,
          revision,
          fetcher,
          url: objectUrl,
          error: null,
        });
      })
      .catch((cause: unknown) => {
        if (!cancelled)
          setResult({
            title: fileTitle,
            revision,
            fetcher,
            url: null,
            error: errorMessage(cause, "Ошибка при получении файла"),
          });
      });
    return () => {
      cancelled = true;
      revokeObjectUrl(objectUrl);
    };
  }, [fetcher, fileTitle, revision]);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  return {
    url: current?.url ?? null,
    error: current?.error ?? null,
    loading: Boolean(fileTitle && !current),
    refresh,
  };
}
