import React, { useState } from "react";

import { categoryApi } from "entities/game";
import { errorMessage } from "shared/lib/errors";
import { fileError, textError, useBlurField } from "shared/lib/forms";
import { bindClasses } from "shared/lib/styles";
import { originalFileName } from "shared/lib/utils";
import { ModalActions } from "shared/ui/modal";
import { SelectDropdown } from "shared/ui/select-dropdown";

import style0 from "./AdminLayout.module.scss";
import style1 from "./GameForm.module.scss";

import type { Game, GameInput } from "entities/game";

interface Props {
  mode?: "create" | "edit";
  initial?: Game | null;
  onCancel: () => void;
  onSave: (
    input: GameInput,
    mode: "create" | "edit",
    id?: number,
  ) => Promise<void>;
}

export default function GameForm({
  mode = "create",
  initial = null,
  onCancel,
  onSave,
}: Props) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [rulesFile, setRulesFile] = useState<File | null>(null);
  const [categories, setCategories] = useState(initial?.categories ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState("");
  const validateTitle = (value: string) => textError(value, 30);
  const validateDescription = (value: string) => textError(value, 1500, false);
  const titleField = useBlurField(title, validateTitle);
  const descriptionField = useBlurField(description, validateDescription);
  const imageField = useBlurField(imageFile?.name || "", () =>
    fileError(imageFile, "image", Boolean(initial?.imageFileTitle)),
  );
  const rulesField = useBlurField(rulesFile?.name || "", () =>
    fileError(rulesFile, "pdf", Boolean(initial?.rulesFileTitle)),
  );
  const categoryField = useBlurField(categories.join(","), (value) =>
    textError(value, 500),
  );
  const canSubmit =
    !validateTitle(title) &&
    !validateDescription(description) &&
    categories.length > 0 &&
    categories.length <= 5 &&
    !fileError(imageFile, "image", Boolean(initial?.imageFileTitle)) &&
    !fileError(rulesFile, "pdf", Boolean(initial?.rulesFileTitle));
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSaveError("");
    setSubmitting(true);
    try {
      const payload: GameInput = {
        title,
        description,
        categories,
      };

      if (imageFile) payload.imageFile = imageFile;

      if (rulesFile) payload.rulesFile = rulesFile;

      await onSave(payload, mode, initial?.id);
    } catch (cause) {
      setSaveError(
        errorMessage(cause, "Не удалось сохранить игру. Попробуйте ещё раз."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={cx("game-form")} onSubmit={handleSubmit} noValidate>
      <h3 className={cx("form-title")}>
        {mode === "create" ? "Создать игру" : "Редактировать игру"}
      </h3>

      <label className={cx("form-row")}>
        <span className={cx("form-label")}>Название</span>
        <input
          type="text"
          className={cx("form-input")}
          onBlur={titleField.onBlur}
          aria-invalid={!!titleField.error}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={30}
          required
        />
        {titleField.error && (
          <span className={cx("form-field-error")} role="alert">
            {titleField.error}
          </span>
        )}
      </label>

      <label className={cx("form-row")}>
        <span className={cx("form-label")}>Категории</span>
        <div
          className={cx("form-input")}
          role="group"
          aria-label="Категории игры"
          data-invalid={!!categoryField.error}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              categoryField.onBlur();
          }}
        >
          <SelectDropdown
            appearance="field"
            fetchItems={() =>
              categoryApi
                .getAll()
                .then((list) =>
                  Array.isArray(list) ? list.map((c) => c.name) : [],
                )
            }
            multiple={true}
            maxSelections={5}
            value={categories}
            onChange={(v) => setCategories(v)}
            placeholder="Категории"
          />
        </div>
        {categoryField.error && (
          <span className={cx("form-field-error")} role="alert">
            {categoryField.error}
          </span>
        )}
      </label>

      <label className={cx("form-row")}>
        <span className={cx("form-label")}>Описание</span>
        <textarea
          className={cx("form-input")}
          rows={4}
          onBlur={descriptionField.onBlur}
          aria-invalid={!!descriptionField.error}
          aria-describedby="game-description-help"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1500}
        />
        <span id="game-description-help" className={cx("file-note")}>
          {description.length} / 1500 символов
        </span>
        {descriptionField.error && (
          <span className={cx("form-field-error")} role="alert">
            {descriptionField.error}
          </span>
        )}
      </label>

      <label className={cx("form-row")}>
        <span className={cx("form-label")}>Изображение</span>
        <input
          className={cx("form-input")}
          type="file"
          accept="image/*"
          onBlur={imageField.onBlur}
          aria-invalid={!!imageField.error}
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          required={initial == null}
        />
        {imageField.error && (
          <span className={cx("form-field-error")} role="alert">
            {imageField.error}
          </span>
        )}
        {initial?.imageFileTitle && !imageFile && (
          <div className={cx("file-note")}>
            Текущее:{" "}
            {originalFileName(initial.imageFileTitle).length > 30
              ? originalFileName(initial.imageFileTitle).slice(0, 30) + "…"
              : originalFileName(initial.imageFileTitle)}
          </div>
        )}
      </label>

      <label className={cx("form-row")}>
        <span className={cx("form-label")}>Правила</span>
        <input
          className={cx("form-input")}
          type="file"
          accept=".pdf"
          onBlur={rulesField.onBlur}
          aria-invalid={!!rulesField.error}
          onChange={(e) => setRulesFile(e.target.files?.[0] ?? null)}
          required={initial == null}
        />
        {rulesField.error && (
          <span className={cx("form-field-error")} role="alert">
            {rulesField.error}
          </span>
        )}
        {initial?.rulesFileTitle && !rulesFile && (
          <div className={cx("file-note")}>
            Текущее:{" "}
            {originalFileName(initial.rulesFileTitle).length > 30
              ? originalFileName(initial.rulesFileTitle).slice(0, 30) + "…"
              : originalFileName(initial.rulesFileTitle)}
          </div>
        )}
      </label>

      {saveError && (
        <p className={cx("form-field-error")} role="alert">
          {saveError}
        </p>
      )}
      <ModalActions>
        <button
          type="button"
          className={cx("btn btn-danger")}
          onClick={onCancel}
          disabled={submitting}
        >
          Отмена
        </button>
        <button
          type="submit"
          className={cx("btn")}
          disabled={submitting || !canSubmit}
        >
          {submitting
            ? "Сохранение..."
            : mode === "create"
              ? "Создать"
              : "Сохранить"}
        </button>
      </ModalActions>
    </form>
  );
}
const cx = bindClasses(style0, style1);
