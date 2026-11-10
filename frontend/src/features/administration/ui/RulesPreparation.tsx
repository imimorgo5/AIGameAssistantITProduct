import { useState } from "react";

import { gameApi, useRulesStatus } from "entities/game";
import { errorMessage } from "shared/lib/errors";
import { bindClasses } from "shared/lib/styles";

import table from "./AdminTable.module.scss";
import styles from "./ModelsTable.module.scss";

export default function RulesPreparation({ gameId }: { gameId: number }) {
  const { state, refresh } = useRulesStatus(gameId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const retry = async () => {
    setBusy(true);
    setError("");
    try {
      await gameApi.retryRules(gameId);
      refresh();
    } catch (cause) {
      setError(errorMessage(cause, "Не удалось запустить обработку"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={cx("rules-status")}>
      <span>
        {!state
          ? "Проверка правил..."
          : state.status === "ready"
            ? "Готовы для ИИ"
            : state.status === "pending"
              ? "В очереди"
              : state.status === "processing"
                ? "Обработка PDF / OCR"
                : state.error || "Правила недоступны"}
      </span>
      {state && ["failed", "unavailable"].includes(state.status) && (
        <button
          type="button"
          className={cx("link-btn")}
          disabled={busy}
          onClick={() => {
            if (state.status === "unavailable") refresh();
            else void retry();
          }}
        >
          {busy ? "Запуск..." : "Повторить"}
        </button>
      )}
      {error && (
        <span className={cx("models-error")} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
const cx = bindClasses(table, styles);
