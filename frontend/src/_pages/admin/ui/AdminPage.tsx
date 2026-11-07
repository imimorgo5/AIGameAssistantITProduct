"use client";

import Link from "next/link";

import {
  adminStyles as style0,
  adminTableStyles as style1,
  CategoriesTable,
  GameForm,
  GamesTable,
  PromptEditor,
  UsersTable,
} from "features/administration";
import { ModelSelect } from "features/model-select";
import { bindClasses } from "shared/lib/styles";
import { FileViewer } from "shared/ui/file-viewer";
import { Modal, ModalActions } from "shared/ui/modal";

import { useAdmin } from "../model/useAdmin";

import type { Game } from "entities/game";
import type { User } from "entities/session";
export default function AdminPage() {
  const {
    loading,
    error,
    activeTab,
    switchTab,
    logout,
    selectedModel,
    handleChangeModel,
    search,
    setSearch,
    setPage,
    itemsLoading,
    items,
    currentUser,
    handleEnableUser,
    handleDeleteUser,
    handleToggleAdmin,
    page,
    pageCount,
    handleOpenCreateGame,
    handleOpenEditGame,
    handleDeleteGame,
    handleDownloadFile,
    handleOpenViewer,
    categories,
    handleAddCategory,
    handleDeleteCategory,
    confirmState,
    setConfirmState,
    gameFormState,
    setGameFormState,
    handleGameFormSave,
    viewerState,
    setViewerState,
  } = useAdmin();

  if (loading) {
    return (
      <div className={cx("admin-root")}>
        <div className={cx("admin-header")}>
          <h1>Админская панель</h1>
        </div>
        <div className={cx("full-loader")}>
          <div className={cx("spinner")} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cx("admin-root")}>
        <div className={cx("admin-header")}>
          <h1>Админская панель</h1>
          <Link href="/" className={cx("main-link")}>
            На главную
          </Link>
        </div>
        <div className={cx("loading-error")}>{error}</div>
      </div>
    );
  }

  return (
    <div className={cx("admin-root")}>
      <header className={cx("admin-header")}>
        <div className={cx("admin-header-left")}>
          <h1>Админская панель</h1>
          <nav
            className={cx("admin-tabs")}
            role="tablist"
            aria-label="Админ вкладки"
          >
            <button
              type="button"
              className={cx(
                `admin-tab ${activeTab === "users" ? "active" : ""}`,
              )}
              onClick={() => switchTab("users")}
              role="tab"
              aria-selected={activeTab === "users"}
            >
              Пользователи
            </button>
            <button
              type="button"
              className={cx(
                `admin-tab ${activeTab === "games" ? "active" : ""}`,
              )}
              onClick={() => switchTab("games")}
              role="tab"
              aria-selected={activeTab === "games"}
            >
              Игры
            </button>
            <button
              type="button"
              className={cx(
                `admin-tab ${activeTab === "settings" ? "active" : ""}`,
              )}
              onClick={() => switchTab("settings")}
              role="tab"
              aria-selected={activeTab === "settings"}
            >
              Настройки
            </button>
          </nav>
        </div>

        <div className={cx("admin-header-right")}>
          <Link href="/" className={cx("link main-link")}>
            На главную
          </Link>
          <button className={cx("btn admin-btn-logout")} onClick={logout}>
            Выйти
          </button>
        </div>
      </header>

      <main className={cx("admin-main")}>
        {activeTab === "settings" && (
          <>
            <section className={cx("admin-section admin-model")}>
              <div className={cx("admin-table-header")}>
                <h2 className={cx("admin-table-title")}>Модель по умолчанию</h2>
              </div>
              <ModelSelect value={selectedModel} onChange={handleChangeModel} />
            </section>
            <section className={cx("admin-section")}>
              <div className={cx("admin-table-header")}>
                <h2 className={cx("admin-table-title")}>Промпт</h2>
              </div>
              <PromptEditor />
            </section>
          </>
        )}

        {activeTab === "users" && (
          <section className={cx("admin-section")}>
            <div className={cx("admin-table-header")}>
              <h2 className={cx("admin-table-title")}>Пользователи</h2>
              <div className={cx("admin-table-controls")}>
                <input
                  type="text"
                  maxLength={100}
                  className={cx("admin-table-search users-search")}
                  placeholder="Поиск пользователей..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Поиск пользователей..."
                />
              </div>
            </div>
            {itemsLoading ? (
              <div className={cx("admin-loading")}>
                <div className={cx("spinner")} />
              </div>
            ) : (
              <UsersTable
                users={items.filter((item): item is User => "email" in item)}
                currentUser={currentUser}
                onEnabled={handleEnableUser}
                onDelete={handleDeleteUser}
                onToggleAdmin={handleToggleAdmin}
                currentPage={page}
                pageCount={pageCount}
                setPage={setPage}
              />
            )}
          </section>
        )}

        {activeTab === "games" && (
          <>
            <section className={cx("admin-section")}>
              <div className={cx("admin-table-header")}>
                <h2 className={cx("admin-table-title")}>Игры</h2>
                <div className={cx("admin-table-controls")}>
                  <input
                    type="text"
                    maxLength={100}
                    className={cx("admin-table-search")}
                    placeholder="Поиск игр..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    aria-label="Поиск игр..."
                  />
                  <button
                    className={cx("btn admin-btn-add")}
                    onClick={handleOpenCreateGame}
                    title="Добавить игру"
                  >
                    ＋
                  </button>
                </div>
              </div>
              {itemsLoading ? (
                <div className={cx("admin-loading")}>
                  <div className={cx("spinner")} />
                </div>
              ) : (
                <GamesTable
                  games={items.filter((item): item is Game => "title" in item)}
                  onEdit={handleOpenEditGame}
                  onDelete={handleDeleteGame}
                  onDownloadFile={handleDownloadFile}
                  onOpenFile={handleOpenViewer}
                  currentPage={page}
                  pageCount={pageCount}
                  setPage={setPage}
                />
              )}
            </section>
            <section className={cx("admin-section")}>
              <div className={cx("admin-table-header")}>
                <h2 className={cx("admin-table-title")}>Категории</h2>
              </div>
              <CategoriesTable
                categories={categories}
                onAdd={handleAddCategory}
                onDelete={handleDeleteCategory}
              />
            </section>
          </>
        )}
      </main>

      {confirmState.open && (
        <Modal
          onClose={() =>
            setConfirmState({
              open: false,
            })
          }
        >
          <p>{confirmState.text}</p>
          <ModalActions>
            <button
              className={cx("btn btn-ghost")}
              onClick={() =>
                setConfirmState({
                  open: false,
                })
              }
            >
              Отмена
            </button>
            <button
              className={cx(
                `btn ${confirmState.type === "delete" ? "btn-danger" : ""}`,
              )}
              onClick={confirmState.onConfirm}
            >
              {confirmState.type === "delete" ? "Удалить" : "Да"}
            </button>
          </ModalActions>
        </Modal>
      )}

      {gameFormState.open && (
        <Modal
          onClose={() =>
            setGameFormState({
              open: false,
            })
          }
        >
          <GameForm
            mode={gameFormState.mode ?? "create"}
            initial={gameFormState.initial ?? null}
            onCancel={() =>
              setGameFormState({
                open: false,
              })
            }
            onSave={handleGameFormSave}
          />
        </Modal>
      )}

      {viewerState.open && (
        <Modal
          variant="viewer"
          onClose={() =>
            setViewerState({
              open: false,
              fileType: null,
              fileTitle: null,
            })
          }
        >
          <FileViewer
            fileType={viewerState.fileType ?? "pdf"}
            fileTitle={viewerState.fileTitle ?? ""}
            onClose={() =>
              setViewerState({ open: false, fileType: null, fileTitle: null })
            }
          />
        </Modal>
      )}
    </div>
  );
}
const cx = bindClasses(style0, style1);
