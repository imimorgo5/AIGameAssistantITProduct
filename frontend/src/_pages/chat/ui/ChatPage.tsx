"use client";

import { usePathname } from "next/navigation";

import { ChatMessage, ChatSidebarItem } from "entities/chat";
import { ModelSelect } from "features/model-select";
import { bindClasses } from "shared/lib/styles";
import { FileViewer } from "shared/ui/file-viewer";
import { Modal, ModalActions } from "shared/ui/modal";
import { Header } from "widgets/header";

import style0 from "./ChatPage.module.scss";
import RulesIcon from "./RulesIcon";
import { useChat } from "../model/useChat";
export default function ChatPage() {
  const segments = usePathname().split("/").slice(3);
  return <ChatContent key={segments[0] ?? "none"} />;
}

function ChatContent() {
  const {
    currentUser,
    gameLoading,
    error,
    game,
    loading,
    selectedModel,
    handleChangeModel,
    modelChanging,
    sending,
    sidebarOpen,
    setSidebarOpen,
    setRulesSidebarOpen,
    chatsLoading,
    sessions,
    grouped,
    activeSession,
    handleSidebarSelect,
    handleNewChat,
    handleDeleteSession,
    visibleCount,
    absoluteCount,
    loadingMore,
    setVisibleCount,
    routeGameId,
    router,
    chatError,
    chatLoading,
    messages,
    messagesRef,
    inputRef,
    input,
    inputField,
    setInput,
    handleKeyDown,
    handleSend,
    rulesSidebarOpen,
    confirmState,
    setConfirmState,
  } = useChat();

  return (
    <div className={cx("chat-root")} data-chat-page>
      <Header
        currentUser={currentUser}
        centralTitle={!gameLoading && !error ? (game?.title ?? "") : ""}
      />

      {(gameLoading || loading) && (
        <div className={cx("full-loader")}>
          <div className={cx("spinner")} />
        </div>
      )}

      {!gameLoading && !loading && error && (
        <div className={cx("loading-error")}>{error}</div>
      )}

      {!gameLoading && !loading && !error && (
        <div className={cx("chat-page-switch-container")}>
          <ModelSelect
            value={selectedModel}
            onChange={handleChangeModel}
            disabled={modelChanging || sending}
          />
        </div>
      )}

      {!gameLoading && !loading && !error && (
        <div className={cx("chat-container")}>
          {game && (
            <button
              className={cx(`sidebar-toggle ${sidebarOpen ? "hidden" : ""}`)}
              onClick={() => {
                setSidebarOpen(true);
                setRulesSidebarOpen(false);
              }}
              aria-label="Открыть список чатов"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                data-rtl-flip=""
              >
                <path d="M6.83496 3.99992C6.38353 4.00411 6.01421 4.0122 5.69824 4.03801C5.31232 4.06954 5.03904 4.12266 4.82227 4.20012L4.62207 4.28606C4.18264 4.50996 3.81498 4.85035 3.55859 5.26848L3.45605 5.45207C3.33013 5.69922 3.25006 6.01354 3.20801 6.52824C3.16533 7.05065 3.16504 7.71885 3.16504 8.66301V11.3271C3.16504 12.2712 3.16533 12.9394 3.20801 13.4618C3.25006 13.9766 3.33013 14.2909 3.45605 14.538L3.55859 14.7216C3.81498 15.1397 4.18266 15.4801 4.62207 15.704L4.82227 15.79C5.03904 15.8674 5.31234 15.9205 5.69824 15.9521C6.01398 15.9779 6.383 15.986 6.83398 15.9902L6.83496 3.99992ZM18.165 11.3271C18.165 12.2493 18.1653 12.9811 18.1172 13.5702C18.0745 14.0924 17.9916 14.5472 17.8125 14.9648L17.7295 15.1415C17.394 15.8 16.8834 16.3511 16.2568 16.7353L15.9814 16.8896C15.5157 17.1268 15.0069 17.2285 14.4102 17.2773C13.821 17.3254 13.0893 17.3251 12.167 17.3251H7.83301C6.91071 17.3251 6.17898 17.3254 5.58984 17.2773C5.06757 17.2346 4.61294 17.1508 4.19531 16.9716L4.01855 16.8896C3.36014 16.5541 2.80898 16.0434 2.4248 15.4169L2.27051 15.1415C2.03328 14.6758 1.93158 14.167 1.88281 13.5702C1.83468 12.9811 1.83496 12.2493 1.83496 11.3271V8.66301C1.83496 7.74072 1.83468 7.00898 1.88281 6.41985C1.93157 5.82309 2.03329 5.31432 2.27051 4.84856L2.4248 4.57317C2.80898 3.94666 3.36012 3.436 4.01855 3.10051L4.19531 3.0175C4.61285 2.83843 5.06771 2.75548 5.58984 2.71281C6.17898 2.66468 6.91071 2.66496 7.83301 2.66496H12.167C13.0893 2.66496 13.821 2.66468 14.4102 2.71281C15.0069 2.76157 15.5157 2.86329 15.9814 3.10051L16.2568 3.25481C16.8833 3.63898 17.394 4.19012 17.7295 4.84856L17.8125 5.02531C17.9916 5.44285 18.0745 5.89771 18.1172 6.41985C18.1653 7.00898 18.165 7.74072 18.165 8.66301V11.3271ZM8.16406 15.995H12.167C13.1112 15.995 13.7794 15.9947 14.3018 15.9521C14.8164 15.91 15.1308 15.8299 15.3779 15.704L15.5615 15.6015C15.9797 15.3451 16.32 14.9774 16.5439 14.538L16.6299 14.3378C16.7074 14.121 16.7605 13.8478 16.792 13.4618C16.8347 12.9394 16.835 12.2712 16.835 11.3271V8.66301C16.835 7.71885 16.8347 7.05065 16.792 6.52824C16.7605 6.14232 16.7073 5.86904 16.6299 5.65227L16.5439 5.45207C16.32 5.01264 15.9796 4.64498 15.5615 4.3886L15.3779 4.28606C15.1308 4.16013 14.8165 4.08006 14.3018 4.03801C13.7794 3.99533 13.1112 3.99504 12.167 3.99504H8.16406C8.16407 3.99667 8.16504 3.99829 8.16504 3.99992L8.16406 15.995Z"></path>
              </svg>
            </button>
          )}
          {game && (
            <aside
              className={cx(
                `chat-sidebar sessions-sidebar ${sidebarOpen ? "open" : ""}`,
              )}
              aria-hidden={
                !sidebarOpen &&
                typeof window !== "undefined" &&
                window.innerWidth < 900
              }
            >
              <div className={cx("chat-sidebar-header")}>
                <h2 className={cx("sidebar-title")}>Мои чаты по игре</h2>
                <div className={cx("chat-sidebar-actions")}>
                  <button
                    type="button"
                    className={cx("chat-sidebar-btn new-chat-btn")}
                    onClick={handleNewChat}
                    disabled={sending || chatLoading || modelChanging}
                    aria-label="Новый чат"
                    title="Новый чат"
                  >
                    +
                  </button>
                  <button
                    className={cx("chat-sidebar-btn")}
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Свернуть меню"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                      data-rtl-flip=""
                    >
                      <path d="M6.83496 3.99992C6.38353 4.00411 6.01421 4.0122 5.69824 4.03801C5.31232 4.06954 5.03904 4.12266 4.82227 4.20012L4.62207 4.28606C4.18264 4.50996 3.81498 4.85035 3.55859 5.26848L3.45605 5.45207C3.33013 5.69922 3.25006 6.01354 3.20801 6.52824C3.16533 7.05065 3.16504 7.71885 3.16504 8.66301V11.3271C3.16504 12.2712 3.16533 12.9394 3.20801 13.4618C3.25006 13.9766 3.33013 14.2909 3.45605 14.538L3.55859 14.7216C3.81498 15.1397 4.18266 15.4801 4.62207 15.704L4.82227 15.79C5.03904 15.8674 5.31234 15.9205 5.69824 15.9521C6.01398 15.9779 6.383 15.986 6.83398 15.9902L6.83496 3.99992ZM18.165 11.3271C18.165 12.2493 18.1653 12.9811 18.1172 13.5702C18.0745 14.0924 17.9916 14.5472 17.8125 14.9648L17.7295 15.1415C17.394 15.8 16.8834 16.3511 16.2568 16.7353L15.9814 16.8896C15.5157 17.1268 15.0069 17.2285 14.4102 17.2773C13.821 17.3254 13.0893 17.3251 12.167 17.3251H7.83301C6.91071 17.3251 6.17898 17.3254 5.58984 17.2773C5.06757 17.2346 4.61294 17.1508 4.19531 16.9716L4.01855 16.8896C3.36014 16.5541 2.80898 16.0434 2.4248 15.4169L2.27051 15.1415C2.03328 14.6758 1.93158 14.167 1.88281 13.5702C1.83468 12.9811 1.83496 12.2493 1.83496 11.3271V8.66301C1.83496 7.74072 1.83468 7.00898 1.88281 6.41985C1.93157 5.82309 2.03329 5.31432 2.27051 4.84856L2.4248 4.57317C2.80898 3.94666 3.36012 3.436 4.01855 3.10051L4.19531 3.0175C4.61285 2.83843 5.06771 2.75548 5.58984 2.71281C6.17898 2.66468 6.91071 2.66496 7.83301 2.66496H12.167C13.0893 2.66496 13.821 2.66468 14.4102 2.71281C15.0069 2.76157 15.5157 2.86329 15.9814 3.10051L16.2568 3.25481C16.8833 3.63898 17.394 4.19012 17.7295 4.84856L17.8125 5.02531C17.9916 5.44285 18.0745 5.89771 18.1172 6.41985C18.1653 7.00898 18.165 7.74072 18.165 8.66301V11.3271ZM8.16406 15.995H12.167C13.1112 15.995 13.7794 15.9947 14.3018 15.9521C14.8164 15.91 15.1308 15.8299 15.3779 15.704L15.5615 15.6015C15.9797 15.3451 16.32 14.9774 16.5439 14.538L16.6299 14.3378C16.7074 14.121 16.7605 13.8478 16.792 13.4618C16.8347 12.9394 16.835 12.2712 16.835 11.3271V8.66301C16.835 7.71885 16.8347 7.05065 16.792 6.52824C16.7605 6.14232 16.7073 5.86904 16.6299 5.65227L16.5439 5.45207C16.32 5.01264 15.9796 4.64498 15.5615 4.3886L15.3779 4.28606C15.1308 4.16013 14.8165 4.08006 14.3018 4.03801C13.7794 3.99533 13.1112 3.99504 12.167 3.99504H8.16406C8.16407 3.99667 8.16504 3.99829 8.16504 3.99992L8.16406 15.995Z"></path>
                    </svg>
                  </button>
                </div>
              </div>

              {chatsLoading && (
                <div className={cx("sidebar-spinner-container")}>
                  <div className={cx("spinner chat")} />
                </div>
              )}

              <div className={cx("chat-sessions-list")}>
                {!chatsLoading && sessions.length === 0 && (
                  <div className={cx("sidebar-muted-empty")}>
                    Ещё нет ни одного чата
                  </div>
                )}
                {!chatsLoading &&
                  sessions.length !== 0 &&
                  grouped.map(([groupName, items]) => (
                    <div key={groupName} className={cx("session-group")}>
                      <h3 className={cx("session-group-title")}>{groupName}</h3>
                      <div className={cx("session-group-list")}>
                        {items.map((s) => (
                          <ChatSidebarItem
                            key={s.id}
                            session={s}
                            active={s.id === activeSession?.id}
                            onSelect={handleSidebarSelect}
                            onDelete={handleDeleteSession}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
              {((!chatsLoading && visibleCount < absoluteCount) ||
                loadingMore) && (
                <div className={cx("load-more-container")}>
                  <button
                    className={cx("btn btn-load-more-chats")}
                    disabled={loadingMore}
                    onClick={() => setVisibleCount((v) => v + 10)}
                  >
                    {loadingMore ? "Загрузка..." : "Загрузить ещё"}
                  </button>
                </div>
              )}
            </aside>
          )}
          <main className={cx("chat-main")}>
            {!routeGameId ? (
              <div className={cx("chat-main-inner")}>
                <div className={cx("not-found-container")}>
                  <div className={cx("chat-not-found")}>
                    Выберите конкретную игру из каталога
                  </div>
                  <button
                    className={cx("btn btn-to-main")}
                    onClick={() => router.push("/")}
                  >
                    Посмотреть доступные игры
                  </button>
                </div>
              </div>
            ) : game === null ? (
              <div className={cx("chat-main-inner")}>
                <div className={cx("not-found-container")}>
                  <div className={cx("chat-not-found")}>
                    Игра не найдена, выберите игру из каталога
                  </div>
                  <button
                    className={cx("btn btn-to-main")}
                    onClick={() => router.push("/")}
                  >
                    Посмотреть доступные игры
                  </button>
                </div>
              </div>
            ) : (
              <div className={cx("chat-main-inner")}>
                <div className={cx("chat-dialog-container")}>
                  {chatError && (
                    <div className={cx("chat-muted")}>{chatError}</div>
                  )}
                  {chatLoading && !chatError && (
                    <div className={cx("chat-muted")}>
                      <div className={cx("spinner chat")} />
                    </div>
                  )}
                  {!chatLoading &&
                    !chatError &&
                    messages.length === 0 &&
                    !sending &&
                    !activeSession && (
                      <div className={cx("chat-muted")}>Чем я могу помочь?</div>
                    )}
                  {!chatLoading && !chatError && (
                    <div className={cx("chat-messages")} ref={messagesRef}>
                      <div className={cx("messages-inner")}>
                        {messages.map((m) => (
                          <ChatMessage key={m.id} msg={m} />
                        ))}
                      </div>
                    </div>
                  )}

                  {!chatLoading && !chatError && (
                    <div className={cx("chat-input-area")}>
                      <div className={cx("chat-input-field")}>
                        <textarea
                          ref={inputRef}
                          className={cx("chat-input")}
                          placeholder="Задайте вопрос по игре..."
                          value={input}
                          maxLength={10000}
                          onBlur={inputField.onBlur}
                          aria-invalid={!!inputField.error}
                          aria-describedby={
                            inputField.error ? "chat-input-error" : undefined
                          }
                          onChange={(e) => {
                            setInput(e.target.value);
                          }}
                          onKeyDown={handleKeyDown}
                          rows={1}
                          disabled={!game}
                          aria-label="Текст сообщения"
                        />
                        {inputField.error && (
                          <div
                            id="chat-input-error"
                            className={cx("chat-input-error")}
                            role="alert"
                          >
                            {inputField.error}
                          </div>
                        )}
                      </div>
                      <button
                        className={cx("btn send-btn")}
                        onClick={handleSend}
                        disabled={
                          sending ||
                          modelChanging ||
                          !input.trim() ||
                          input.length > 10000 ||
                          !game
                        }
                        aria-label="Отправить"
                        title="Отправить"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden
                        >
                          <path
                            d="M5 12h14M12 5l7 7-7 7"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
          {game && (
            <button
              className={cx(
                `sidebar-toggle rules-toggle ${rulesSidebarOpen ? "hidden" : ""}`,
              )}
              onClick={() => {
                setRulesSidebarOpen(true);
                setSidebarOpen(false);
              }}
              aria-label="Открыть правила"
              title="Открыть правила"
            >
              <RulesIcon />
            </button>
          )}
          {game && (
            <aside
              className={cx(
                `chat-sidebar rules-sidebar ${rulesSidebarOpen ? "open" : ""}`,
              )}
              aria-hidden={!rulesSidebarOpen}
            >
              {rulesSidebarOpen && (
                <FileViewer
                  fileType="pdf"
                  fileTitle={game?.rulesFileTitle ?? ""}
                  title="Правила игры"
                  closeIcon={<RulesIcon />}
                  closeButtonClassName={cx("chat-sidebar-btn")}
                  onClose={() => setRulesSidebarOpen(false)}
                />
              )}
            </aside>
          )}
        </div>
      )}

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
              className={cx("btn btn-danger")}
              onClick={confirmState.onConfirm}
            >
              Удалить
            </button>
          </ModalActions>
        </Modal>
      )}
    </div>
  );
}
const cx = bindClasses(style0);
