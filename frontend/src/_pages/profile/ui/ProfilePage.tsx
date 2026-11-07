"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

import { AvatarControl } from "features/avatar";
import { bindClasses } from "shared/lib/styles";
import { formatDate } from "shared/lib/utils";
import { SelectDropdown } from "shared/ui/select-dropdown";
import { Header } from "widgets/header";

import style0 from "./ProfilePage.module.scss";
import { useProfile } from "../model/useProfile";
export default function ProfilePage() {
  const {
    currentUser,
    loading,
    globalError,
    avatarUrl,
    avatarLoading,
    avatarUploading,
    handleAvatarChange,
    handleAvatarDelete,
    avatarErrorGetText,
    avatarErrorSet,
    showPasswordForm,
    setShowPasswordForm,
    handlePasswordSubmit,
    newPassword,
    setNewPassword,
    passwordField,
    repeatPassword,
    setRepeatPassword,
    repeatField,
    pwErrors,
    canSubmitPassword,
    isSubmitting,
    gamesLoading,
    games,
    selectedGame,
    setSelectedGame,
    chatsLoading,
    chats,
  } = useProfile();

  return (
    <div className={cx("profile-root")}>
      <Header currentUser={currentUser} />

      {loading && (
        <div className={cx("full-loader")}>
          <div className={cx("spinner")} />
        </div>
      )}
      {globalError && (
        <div className={cx("loading-error")} role="alert">
          {globalError}
        </div>
      )}

      {!loading && (
        <div className={cx("profile-grid")}>
          <div className={cx("profile-left-column")}>
            <section className={cx("profile-panel info-panel")}>
              <div className={cx("profile-panel-inner")}>
                <h3 className={cx("profile-panel-title")}>
                  Основная информация
                </h3>
                <div className={cx("profile-info-lines")}>
                  <div className={cx("profile-info-line")}>
                    <span className={cx("profile-info-label")}>Почта:</span>
                    <span className={cx("profile-info-value")}>
                      {currentUser?.email || "—"}
                    </span>
                  </div>
                  <div className={cx("profile-info-line")}>
                    <span className={cx("profile-info-label")}>Логин:</span>
                    <span className={cx("profile-info-value")}>
                      {currentUser?.login || "—"}
                    </span>
                  </div>
                </div>

                <div className={cx("avatar-block")}>
                  <AvatarControl
                    url={avatarUrl}
                    loading={avatarLoading}
                    loadingText={
                      avatarUploading ? (
                        "Отправка на сервер..."
                      ) : (
                        <div className={cx("spinner profile")} />
                      )
                    }
                    onSelectFile={handleAvatarChange}
                    onDelete={handleAvatarDelete}
                    showDelete={!!currentUser?.imageFileTitle}
                    errorGet={avatarErrorGetText}
                    errorSet={avatarErrorSet}
                  />
                </div>
              </div>
            </section>

            <section className={cx("profile-panel security-panel")}>
              <div className={cx("profile-panel-inner")}>
                <h3 className={cx("profile-panel-title")}>Безопасность</h3>
                {!showPasswordForm ? (
                  <button
                    className={cx("security-toggle")}
                    onClick={() => setShowPasswordForm(true)}
                  >
                    Сменить пароль
                  </button>
                ) : (
                  <form
                    className={cx("password-form")}
                    onSubmit={handlePasswordSubmit}
                    noValidate
                  >
                    <label className={cx("password-row")}>
                      <input
                        type="password"
                        maxLength={30}
                        placeholder="Введите новый пароль"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        onBlur={passwordField.onBlur}
                        className={cx("profile-input")}
                        aria-invalid={!!passwordField.error}
                        aria-label="Введите новый пароль"
                      />
                      {passwordField.error && (
                        <div className={cx("profile-field-error")}>
                          {passwordField.error}
                        </div>
                      )}
                    </label>

                    <label className={cx("password-row")}>
                      <input
                        type="password"
                        maxLength={30}
                        placeholder="Повторите новый пароль"
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                        onBlur={repeatField.onBlur}
                        className={cx("profile-input")}
                        aria-invalid={!!repeatField.error}
                        aria-label="Повторите новый пароль"
                      />
                      {repeatField.error && (
                        <div className={cx("profile-field-error")}>
                          {repeatField.error}
                        </div>
                      )}
                    </label>

                    {pwErrors.general && (
                      <div className={cx("profile-field-error")}>
                        {pwErrors.general}
                      </div>
                    )}

                    <button
                      type="submit"
                      className={cx("btn btn-green")}
                      disabled={!canSubmitPassword}
                    >
                      {isSubmitting ? "Смена..." : "Сменить пароль"}
                    </button>
                  </form>
                )}
              </div>
            </section>
          </div>

          <aside className={cx("profile-right-column")}>
            <section className={cx("profile-panel")}>
              <div className={cx("profile-panel-inner")}>
                {!gamesLoading ? (
                  <div className={cx("profile-chats-header")}>
                    <SelectDropdown
                      appearance="wide"
                      fetchItems={() => games}
                      value={selectedGame}
                      labelFunc={(g) => g.title || "Ошибка"}
                      onChange={(g) => setSelectedGame(g)}
                      allowNull={true}
                      placeholder="Все игры"
                    />
                    <h3 className={cx("profile-panel-title")}>
                      Последние чаты
                    </h3>
                  </div>
                ) : (
                  <h3 className={cx("profile-panel-title")}>Последние чаты</h3>
                )}
                {chatsLoading ? (
                  <div className={cx("profile-message")}>
                    <div className={cx("spinner profile")} />
                  </div>
                ) : (
                  <>
                    {!chats || chats.length === 0 ? (
                      selectedGame ? (
                        <div className={cx("profile-empty-note")}>
                          У вас ещё нет чатов по этой игре
                        </div>
                      ) : (
                        <div className={cx("profile-empty-note")}>
                          У вас ещё нет чатов
                        </div>
                      )
                    ) : (
                      <ul className={cx("profile-chats-list")}>
                        <AnimatePresence mode="popLayout" initial={false}>
                          {chats.map((c) => (
                            <motion.li
                              key={c.id}
                              layout
                              layoutId={`chat-${c.id}`}
                              initial={{
                                opacity: 0,
                                y: 8,
                                scale: 0.995,
                              }}
                              animate={{
                                opacity: 1,
                                y: 0,
                                scale: 1,
                              }}
                              exit={{
                                opacity: 0,
                                y: -8,
                                scale: 0.995,
                              }}
                              transition={{
                                opacity: {
                                  duration: 0.22,
                                },
                                y: {
                                  duration: 0.32,
                                  ease: [0.2, 0.8, 0.2, 1],
                                },
                                scale: {
                                  duration: 0.32,
                                  ease: [0.2, 0.8, 0.2, 1],
                                },
                                layout: {
                                  duration: 0.36,
                                  ease: [0.2, 0.8, 0.2, 1],
                                },
                              }}
                            >
                              <Link
                                href={`/games/ai/${c.gameId}/${c.id}`}
                                className={cx("profile-chat-item")}
                              >
                                <div className={cx("profile-chat-game")}>
                                  {c.gameTitle || "—"}
                                </div>
                                <div className={cx("profile-chat-title")}>
                                  {c.title || "—"}
                                </div>
                                <div className={cx("profile-chat-time")}>
                                  {formatDate(c.lastUseTime)}
                                </div>
                              </Link>
                            </motion.li>
                          ))}
                        </AnimatePresence>
                      </ul>
                    )}
                  </>
                )}
              </div>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
const cx = bindClasses(style0);
