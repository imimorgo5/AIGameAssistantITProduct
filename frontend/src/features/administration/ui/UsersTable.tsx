import { bindClasses } from "shared/lib/styles";

import style0 from "./AdminLayout.module.scss";
import style1 from "./AdminTable.module.scss";

import type { User } from "entities/session";
import type { Dispatch, SetStateAction } from "react";

interface Props {
  users?: User[];
  currentUser?: User | null;
  onDelete: (user: User) => void;
  onEnabled: (user: User) => void;
  onToggleAdmin: (user: User, checked: boolean) => void;
  currentPage: number;
  pageCount: number;
  setPage: Dispatch<SetStateAction<number>>;
}

export default function UsersTable({
  users = [],
  currentUser = null,
  onDelete,
  onEnabled,
  onToggleAdmin,
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
              <th>Логин</th>
              <th>Email</th>
              <th>Админ</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, idx) => {
              const isCurrent = currentUser && u.id === currentUser.id;
              const rowClass = isCurrent
                ? "row-current"
                : u.isAdmin
                  ? "row-admin"
                  : "";

              return (
                <tr key={u.id ?? idx} className={cx(rowClass)}>
                  <td>{u.id}</td>
                  <td>
                    {u.login.length > 20 ? u.login.slice(0, 20) + "…" : u.login}
                  </td>
                  <td>
                    {u.email.length > 40 ? u.email.slice(0, 40) + "…" : u.email}
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!u.isAdmin}
                      onChange={(e) => onToggleAdmin(u, e.target.checked)}
                      aria-label={`isAdmin-${u.id}`}
                    />
                  </td>
                  <td>
                    {!u.isEnabled && (
                      <button
                        className={cx("icon-btn")}
                        onClick={() => onEnabled(u)}
                        title="Подтвердить почту"
                      >
                        ✔
                      </button>
                    )}
                    <button
                      className={cx("icon-btn danger")}
                      onClick={() => onDelete(u)}
                      title="Удалить пользователя"
                    >
                      X
                    </button>
                  </td>
                </tr>
              );
            })}
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
