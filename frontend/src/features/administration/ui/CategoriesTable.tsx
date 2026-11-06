import { useEffect, useMemo, useState } from "react";
import { errorMessage } from "shared/lib/errors";
import { textError, useBlurField } from "shared/lib/forms";
import { bindClasses } from "shared/lib/styles";

import style0 from "./AdminLayout.module.scss";
import style1 from "./AdminTable.module.scss";
import staticStyles from "./CategoriesTable.module.scss";

import type { Category } from "entities/game";

interface Props {
  categories?: Category[];
  onAdd: (name: string) => Promise<void>;
  onDelete: (category: Category) => void;
}

const PAGE_SIZE = 10;
export default function CategoriesTable({
  categories = [],
  onAdd,
  onDelete,
}: Props) {
  const [page, setPage] = useState(1);
  const [newName, setNewName] = useState("");
  const nameField = useBlurField(newName, (value) => textError(value, 100, false));
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingIds, setDeletingIds] = useState(new Set<number>());
  const totalPages = Math.max(
    1,
    Math.ceil((categories.length || 0) / PAGE_SIZE),
  );

  useEffect(() => {
    setPage(1);
  }, [categories]);
  const start = (page - 1) * PAGE_SIZE;
  const pageSlice = useMemo(() => {
    return (categories || []).slice(start, start + PAGE_SIZE);
  }, [categories, start]);

  const handleAdd = async () => {
    const name = (newName || "").trim();
    if (textError(name, 100) || adding) return;

    if (!onAdd) return;

    setAddError("");
    setAdding(true);
    try {
      await onAdd(name);
      setNewName("");
      nameField.reset();
    } catch (cause) {
      setAddError(errorMessage(cause, "Не удалось добавить категорию."));
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!onDelete) return;

    const id = cat && (cat.id ?? cat);
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await onDelete(cat);
    } finally {
      setDeletingIds((prev) => {
        const copy = new Set(prev);
        copy.delete(id);

        return copy;
      });
    }
  };

  return (
    <div>
      <div className={cx("static-1")}>
        <div className={cx("category-field")}>
          <input
            className={cx("admin-table-search static-2")}
            type="text"
            onBlur={nameField.onBlur}
            aria-invalid={!!nameField.error}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Новая категория"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            maxLength={100}
            aria-label="Новая категория"
          />
          {nameField.error && <div className={cx("category-error")} role="alert">{nameField.error}</div>}
          {addError && <div className={cx("category-error")} role="alert">{addError}</div>}
        </div>
        <button
          className={cx("btn admin-btn-add")}
          onClick={handleAdd}
          disabled={adding || !!textError(newName, 100)}
          title="Добавить категорию"
          aria-label="Добавить категорию"
        >
          ＋
        </button>
      </div>

      <div className={cx("table-wrap")}>
        <table className={cx("admin-table")}>
          <thead>
            <tr>
              <th>Id</th>
              <th>Название</th>
              <th>Количество игр</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {pageSlice.map((c) => {
              return (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>
                    {c.name.length > 40 ? c.name.slice(0, 40) + "…" : c.name}
                  </td>
                  <td>{c.gamesCount}</td>
                  <td>
                    <button
                      className={cx("icon-btn danger")}
                      onClick={() => handleDelete(c)}
                      disabled={deletingIds.has(c.id)}
                      title="Удалить категорию"
                      aria-label={`Удалить-${c.id}`}
                    >
                      X
                    </button>
                  </td>
                </tr>
              );
            })}
            {pageSlice.length === 0 && (
              <tr>
                <td colSpan={3} className={cx("static-3")}>
                  Пусто
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={cx("table-pagination")}>
        <button
          className={cx("btn pagination-btn")}
          disabled={page <= 1 || totalPages <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          ←
        </button>

        <div className={cx("pagination-indicator")}>
          {page} / {totalPages}
        </div>

        <button
          className={cx("btn pagination-btn")}
          disabled={page >= totalPages || totalPages <= 1}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          →
        </button>
      </div>
    </div>
  );
}
const cx = bindClasses(style0, style1, staticStyles);
