import { useCallback, useEffect, useState } from "react";
import { createObjectUrl, revokeObjectUrl } from "shared/lib/blobUtils";
import { errorMessage } from "shared/lib/errors";
export default function useBlobUrl(
  fetcher: (title: string) => Promise<Blob>,
  fileTitle: string | null | undefined,
) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(fileTitle));
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setUrl(null);
    setError(null);
    setLoading(Boolean(fileTitle));
    if (fileTitle)
      fetcher(fileTitle)
        .then((blob) => {
          if (cancelled) return;

          objectUrl = createObjectUrl(blob);
          setUrl(objectUrl);
        })
        .catch((cause: unknown) => {
          if (!cancelled)
            setError(errorMessage(cause, "Ошибка при получении файла"));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

    return () => {
      cancelled = true;
      revokeObjectUrl(objectUrl);
    };
  }, [fetcher, fileTitle, revision]);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  const revoke = useCallback(() => setUrl(null), []);

  return {
    url,
    loading,
    error,
    refresh,
    revoke,
  };
}
