import { bindClasses } from "shared/lib/styles";
import { originalFileName } from "shared/lib/utils";

import style0 from "./AdminLayout.module.scss";
import style1 from "./AdminTable.module.scss";
import RulesPreparation from "./RulesPreparation";

import type { Game } from "entities/game";
import type { Dispatch, SetStateAction } from "react";

interface Props {
  games?: Game[];
  onEdit: (game: Game) => void;
  onDelete: (game: Game) => void;
  onDownloadFile: (type: "pdf" | "image", title: string) => void;
  onOpenFile: (type: "pdf" | "image", title: string) => void;
  currentPage: number;
  pageCount: number;
  setPage: Dispatch<SetStateAction<number>>;
}

export default function GamesTable({
  games = [],
  onEdit,
  onDelete,
  onDownloadFile,
  onOpenFile,
  currentPage,
  pageCount,
  setPage,
}: Props) {
  return (
    <div>
      <div className={cx("table-wrap")}>
        <table className={cx("admin-table")}>
          <thead>
            <tr>
              <th>Id</th>
              <th>Название</th>
              <th>Категория</th>
              <th>Описание</th>
              <th>Изображение</th>
              <th>Правила</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g, idx) => (
              <tr key={g.id ?? idx}>
                <td>{g.id}</td>
                <td>
                  {g.title.length > 20 ? g.title.slice(0, 20) + "…" : g.title}
                </td>
                <td>
                  {g.categories.join(", ").length > 40
                    ? g.categories.join(", ").slice(0, 40) + "…"
                    : g.categories.join(", ")}
                </td>
                <td>
                  {g.description
                    ? g.description.length > 40
                      ? g.description.slice(0, 40) + "…"
                      : g.description
                    : "-"}
                </td>
                <td>
                  {g.imageFileTitle ? (
                    <button
                      className={cx("link-btn")}
                      onClick={() =>
                        onOpenFile
                          ? onOpenFile("image", g.imageFileTitle ?? "")
                          : onDownloadFile("image", g.imageFileTitle ?? "")
                      }
                    >
                      {originalFileName(g.imageFileTitle).length > 30
                        ? originalFileName(g.imageFileTitle).slice(0, 30) + "…"
                        : originalFileName(g.imageFileTitle)}
                    </button>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  {g.rulesFileTitle ? (
                    <button
                      className={cx("link-btn")}
                      onClick={() =>
                        onOpenFile
                          ? onOpenFile("pdf", g.rulesFileTitle ?? "")
                          : onDownloadFile("pdf", g.rulesFileTitle ?? "")
                      }
                    >
                      {originalFileName(g.rulesFileTitle).length > 30
                        ? originalFileName(g.rulesFileTitle).slice(0, 30) + "…"
                        : originalFileName(g.rulesFileTitle)}
                    </button>
                  ) : (
                    "-"
                  )}
                  {g.rulesFileTitle && (
                    <RulesPreparation
                      key={`${g.id}:${g.rulesFileTitle}`}
                      gameId={g.id}
                    />
                  )}
                </td>
                <td>
                  <button
                    className={cx("icon-btn")}
                    onClick={() => onEdit(g)}
                    title="Редактировать"
                  >
                    ✎
                  </button>
                  <button
                    className={cx("icon-btn danger")}
                    onClick={() => onDelete(g)}
                    title="Удалить"
                  >
                    X
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={cx("table-pagination")}>
        <button
          className={cx("btn pagination-btn")}
          disabled={currentPage <= 1 || pageCount <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          ←
        </button>

        <div className={cx("pagination-indicator")}>
          {currentPage} / {pageCount}
        </div>

        <button
          className={cx("btn pagination-btn")}
          disabled={currentPage >= pageCount || pageCount <= 1}
          onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
        >
          →
        </button>
      </div>
    </div>
  );
}
const cx = bindClasses(style0, style1);
