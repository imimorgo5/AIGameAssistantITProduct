import { useEffect, useRef, useState } from "react";

import { promptApi } from "entities/ai";
import { errorMessage } from "shared/lib/errors";
import { textError, useBlurField } from "shared/lib/forms";
import { bindClasses } from "shared/lib/styles";

import style0 from "./PromptEditor.module.scss";
export default function PromptEditor() {
  const [original, setOriginal] = useState("");
  const [draft, setDraft] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const field = useBlurField(draft, (value) => textError(value, 10000));
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const text = await promptApi.get();
        if (!mounted) return;

        const str = typeof text === "string" ? text : "";
        setOriginal(str);
        setDraft(str);
        setError(null);
      } catch (err) {
        if (!mounted) return;

        setOriginal("");
        setDraft("");
        setError(errorMessage(err, "Ошибка при загрузке промпта"));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      const val = textareaRef.current.value;
      textareaRef.current.setSelectionRange(val.length, val.length);
    }
  }, [isEditing]);
  const handleActivate = () => {
    if (!isEditing) setIsEditing(true);
  };

  const handleCancel = () => {
    setDraft(original);
    field.reset();
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (textError(draft, 10000) || saving) return;

    setSaving(true);
    try {
      const updated = await promptApi.update(draft);
      const newText = typeof updated === "string" ? updated : draft;
      setOriginal(newText);
      setDraft(newText);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError(errorMessage(err, "Ошибка при сохранении"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cx("prompt-editor-root")}>
      {!loading && (
        <textarea
          ref={textareaRef}
          className={cx(
            `prompt-editor-textarea ${isEditing ? "editing" : "view"}`,
          )}
          maxLength={10000}
          onBlur={field.onBlur}
          aria-invalid={isEditing && !!field.error}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onClick={handleActivate}
          readOnly={!isEditing}
          aria-label="Промпт для ассистента"
          placeholder="Введите системный промпт..."
        />
      )}

      {isEditing && field.error && (
        <div className={cx("prompt-editor-error")} role="alert">
          {field.error}
        </div>
      )}
      {isEditing && (
        <div className={cx("prompt-editor-actions")}>
          <button
            className={cx("btn btn-danger")}
            onClick={handleCancel}
            disabled={saving}
          >
            Отменить
          </button>
          <button
            className={cx("btn")}
            onClick={handleSave}
            disabled={saving || !!textError(draft, 10000)}
          >
            Сохранить
          </button>
        </div>
      )}

      {loading && (
        <div className={cx("prompt-editor-loading")}>Загрузка...</div>
      )}
      {error && <div className={cx("prompt-editor-error")}>{error}</div>}
    </div>
  );
}
const cx = bindClasses(style0);
