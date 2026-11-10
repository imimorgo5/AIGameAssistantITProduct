import { useEffect, useState } from "react";

import {
  modelApi,
  modelNameError,
  remoteIdError,
  tokenLimitError,
} from "entities/ai";
import { errorMessage } from "shared/lib/errors";
import { useBlurField } from "shared/lib/forms";
import { bindClasses } from "shared/lib/styles";
import { ModalActions } from "shared/ui/modal";

import layout from "./AdminLayout.module.scss";
import form from "./GameForm.module.scss";
import ModelCombobox from "./ModelCombobox";

import type { CatalogModel, ModelInput } from "entities/ai";

interface Props {
  onSave: (input: ModelInput) => Promise<void>;
  onCancel: () => void;
}

export default function ModelForm({ onSave, onCancel }: Props) {
  const [catalog, setCatalog] = useState<CatalogModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [remoteId, setRemoteId] = useState("");
  const [name, setName] = useState("");
  const [tokens, setTokens] = useState("4096");
  const [saving, setSaving] = useState(false);
  const modelField = useBlurField(remoteId, remoteIdError);
  const nameField = useBlurField(name, modelNameError);
  const tokenMaximum = Math.min(
    32768,
    catalog.find((model) => model.id === remoteId)?.maxOutputTokens ?? 32768,
  );
  const validateTokens = (value: string) =>
    tokenLimitError(value) ||
    (Number(value) > tokenMaximum
      ? `Максимум ${tokenMaximum} токенов для этой модели`
      : "");
  const tokenField = useBlurField(tokens, validateTokens);
  const invalid = !!(
    remoteIdError(remoteId) ||
    modelNameError(name) ||
    validateTokens(tokens)
  );
  useEffect(() => {
    let active = true;
    modelApi
      .getCatalog()
      .then((models) => {
        if (active) {
          setCatalog(models);
          setError("");
        }
      })
      .catch((cause: unknown) => {
        if (active)
          setError(errorMessage(cause, "Не удалось загрузить каталог моделей"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  return (
    <form
      className={cx("game-form")}
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        if (invalid || saving || loading) return;
        setSaving(true);
        setError("");
        try {
          await onSave({
            remoteId,
            name: name.trim(),
            maxOutputTokens: Number(tokens),
          });
        } catch (cause) {
          setError(errorMessage(cause, "Не удалось добавить модель"));
        } finally {
          setSaving(false);
        }
      }}
    >
      <h3 className={cx("form-title")}>Добавить модель</h3>
      <div className={cx("form-row")}>
        <span className={cx("form-label")}>OpenRouter</span>
        <ModelCombobox
          items={catalog}
          value={catalog.find((model) => model.id === remoteId) ?? null}
          disabled={loading || saving}
          loading={loading}
          error={modelField.error}
          onBlur={modelField.onBlur}
          onChange={(model) => {
            setRemoteId(model?.id ?? "");
            if (model) {
              setName(model.name.slice(0, 100));
              setTokens(String(Math.min(4096, model.maxOutputTokens)));
            }
          }}
        />
        {modelField.error && (
          <span
            id="model-catalog-error"
            className={cx("form-field-error")}
            role="alert"
          >
            {modelField.error}
          </span>
        )}
      </div>
      {remoteId && <p className={cx("file-note")}>{remoteId}</p>}
      <label className={cx("form-row")}>
        <span className={cx("form-label")}>Название</span>
        <input
          className={cx("form-input")}
          value={name}
          maxLength={100}
          required
          aria-label="Название"
          disabled={saving}
          onChange={(event) => setName(event.target.value)}
          onBlur={nameField.onBlur}
          aria-invalid={!!nameField.error}
          aria-describedby="model-name-error model-name-help"
        />
        <span id="model-name-help" className={cx("file-note")}>
          {name.length} / 100 символов
        </span>
        {nameField.error && (
          <span
            id="model-name-error"
            className={cx("form-field-error")}
            role="alert"
          >
            {nameField.error}
          </span>
        )}
      </label>
      <label className={cx("form-row")}>
        <span className={cx("form-label")}>Лимит ответа</span>
        <input
          className={cx("form-input")}
          inputMode="numeric"
          value={tokens}
          maxLength={5}
          required
          aria-label="Лимит ответа"
          disabled={saving}
          onChange={(event) => setTokens(event.target.value)}
          onBlur={tokenField.onBlur}
          aria-invalid={!!tokenField.error}
          aria-describedby="model-tokens-error model-tokens-help"
        />
        <span id="model-tokens-help" className={cx("file-note")}>
          256–{tokenMaximum} токенов, до 5 цифр
        </span>
        {tokenField.error && (
          <span
            id="model-tokens-error"
            className={cx("form-field-error")}
            role="alert"
          >
            {tokenField.error}
          </span>
        )}
      </label>
      {error && (
        <p className={cx("form-field-error")} role="alert">
          {error}
        </p>
      )}
      {!loading && catalog.length === 0 && (
        <button
          type="button"
          className={cx("btn btn-ghost")}
          onClick={() => {
            setLoading(true);
            setRetry((value) => value + 1);
          }}
        >
          Повторить загрузку
        </button>
      )}
      <ModalActions>
        <button
          type="button"
          className={cx("btn btn-danger")}
          disabled={saving}
          onClick={onCancel}
        >
          Отмена
        </button>
        <button
          type="submit"
          className={cx("btn")}
          disabled={saving || loading || invalid}
        >
          {saving ? "Добавление..." : "Добавить"}
        </button>
      </ModalActions>
    </form>
  );
}

const cx = bindClasses(layout, form);
