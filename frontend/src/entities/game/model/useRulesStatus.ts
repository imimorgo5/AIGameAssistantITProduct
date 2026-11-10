import { useEffect, useState } from "react";

import { errorMessage } from "shared/lib/errors";

import { gameApi } from "../api/game";

export function useRulesStatus(gameId: number | undefined) {
  const [state, setState] = useState<{ status: string; error: string } | null>(
    null,
  );
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!gameId) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const result = await gameApi.rulesStatus(gameId);
        if (!active) return;
        setState(result);
        if (["pending", "processing"].includes(result.status))
          timer = setTimeout(() => {
            void load();
          }, 3000);
      } catch (cause) {
        if (active)
          setState({
            status: "unavailable",
            error: errorMessage(
              cause,
              "Не удалось проверить готовность правил",
            ),
          });
      }
    };
    void load();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [gameId, revision]);
  return { state, refresh: () => setRevision((value) => value + 1) };
}
