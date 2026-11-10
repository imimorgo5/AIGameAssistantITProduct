import { useEffect, useState } from "react";

import { modelApi } from "entities/ai";
import { errorMessage } from "shared/lib/errors";
import { bindClasses } from "shared/lib/styles";
import { Modal, ModalActions } from "shared/ui/modal";

import layout from "./AdminLayout.module.scss";
import table from "./AdminTable.module.scss";
import ModelForm from "./ModelForm";
import styles from "./ModelsTable.module.scss";

import type { ManagedModel, ModelRegistry } from "entities/ai";

export default function ModelsTable() {
  const [registry, setRegistry] = useState<ModelRegistry>({
    models: [],
    defaultModel: null,
  });
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(registry.models.length / 10));
  const currentPage = Math.min(page, pageCount);
  const visibleModels = registry.models.slice(
    (currentPage - 1) * 10,
    currentPage * 10,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<ManagedModel | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    modelApi
      .getRegistry()
      .then((state) => {
        if (active) {
          setRegistry(state);
          setError("");
        }
      })
      .catch((cause: unknown) => {
        if (active)
          setError(errorMessage(cause, "Не удалось загрузить модели"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [revision]);
  const mutateModel = async (operation: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await operation();
      setRegistry(await modelApi.getRegistry());
      setDeleting(null);
    } catch (cause) {
      setError(errorMessage(cause, "Не удалось изменить модель"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <div className={cx("admin-table-header")}>
        <h2 className={cx("admin-table-title")}>Модели</h2>
        <div className={cx("admin-table-controls")}>
          <button
            type="button"
            className={cx("btn admin-btn-add")}
            onClick={() => setAdding(true)}
            disabled={busy}
            title="Добавить модель"
            aria-label="Добавить модель"
          >
            ＋
          </button>
        </div>
      </div>

      {error && (
        <div className={cx("models-error")} role="alert">
          {error}{" "}
          <button
            type="button"
            className={cx("link-btn")}
            onClick={() => {
              setLoading(true);
              setRevision((value) => value + 1);
            }}
            disabled={busy}
          >
            Обновить
          </button>
        </div>
      )}
      {loading ? (
        <div className={cx("admin-loading")} role="status">
          <div className={cx("spinner")} />
          <span>Загрузка моделей...</span>
        </div>
      ) : (
        <div className={cx("table-wrap")}>
          <table className={cx("admin-table")}>
            <thead>
              <tr>
                <th scope="col">Название</th>
                <th scope="col">OpenRouter ID</th>
                <th scope="col">Лимит ответа</th>
                <th scope="col">Включена</th>
                <th scope="col">По умолчанию</th>
                <th scope="col">Действия</th>
              </tr>
            </thead>
            <tbody>
              {visibleModels.map((model) => (
                <tr key={model.id}>
                  <td>{model.name}</td>
                  <td className={cx("model-identifier")}>{model.remoteId}</td>
                  <td>{model.maxOutputTokens}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={model.enabled}
                      disabled={busy}
                      aria-label={`Включить ${model.name}`}
                      onChange={(event) => {
                        void mutateModel(() =>
                          modelApi.setEnabled(model.id, event.target.checked),
                        );
                      }}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className={cx("link-btn")}
                      aria-pressed={registry.defaultModel === model.id}
                      disabled={
                        busy ||
                        !model.enabled ||
                        registry.defaultModel === model.id
                      }
                      onClick={() => {
                        void mutateModel(() => modelApi.updateMain(model.id));
                      }}
                    >
                      {registry.defaultModel === model.id
                        ? "Основная"
                        : "Выбрать"}
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={cx("icon-btn danger")}
                      disabled={busy}
                      title="Удалить модель"
                      aria-label={`Удалить ${model.name}`}
                      onClick={() => setDeleting(model)}
                    >
                      X
                    </button>
                  </td>
                </tr>
              ))}
              {registry.models.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    Модели ещё не добавлены. Нажмите ＋, чтобы подключить
                    первую.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {!loading && (
        <div className={cx("table-pagination")}>
          <button
            type="button"
            className={cx("btn pagination-btn")}
            aria-label="Предыдущая страница моделей"
            disabled={busy || currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
          >
            ←
          </button>
          <div className={cx("pagination-indicator")} aria-live="polite">
            {currentPage} / {pageCount}
          </div>
          <button
            type="button"
            className={cx("btn pagination-btn")}
            aria-label="Следующая страница моделей"
            disabled={busy || currentPage >= pageCount}
            onClick={() => setPage(currentPage + 1)}
          >
            →
          </button>
        </div>
      )}
      {adding && (
        <Modal onClose={() => setAdding(false)}>
          <ModelForm
            onCancel={() => setAdding(false)}
            onSave={async (input) => {
              await modelApi.add(input);
              setRegistry(await modelApi.getRegistry());
              setAdding(false);
            }}
          />
        </Modal>
      )}
      {deleting && (
        <Modal
          onClose={() => {
            if (!busy) setDeleting(null);
          }}
        >
          <p>
            Удалить модель «{deleting.name}»? Если она основная, будет выбрана
            другая включённая модель.
          </p>
          {error && (
            <p className={cx("models-error")} role="alert">
              {error}
            </p>
          )}
          <ModalActions>
            <button
              type="button"
              className={cx("btn btn-ghost")}
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              Отмена
            </button>
            <button
              type="button"
              className={cx("btn btn-danger")}
              disabled={busy}
              onClick={() => {
                void mutateModel(() => modelApi.remove(deleting.id));
              }}
            >
              {busy ? "Удаление..." : "Удалить"}
            </button>
          </ModalActions>
        </Modal>
      )}
    </>
  );
}

const cx = bindClasses(layout, table, styles);
