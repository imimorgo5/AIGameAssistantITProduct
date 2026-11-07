import { useEffect, useRef, useState } from "react";

import { chatApi } from "entities/chat";
import { gameApi } from "entities/game";
import {
  passwordError,
  repeatedPasswordError,
  userApi,
} from "entities/session";
import { fileApi } from "shared/api/file";
import { createObjectUrl, revokeObjectUrl } from "shared/lib/blobUtils";
import { errorMessage } from "shared/lib/errors";
import { useBlurField } from "shared/lib/forms";
import { useBlobUrl } from "shared/lib/useBlobUrl";

import type { ChatPreview } from "entities/chat";
import type { User, UserImageInput } from "entities/session";
import type React from "react";

type GameOption = {
  id: number;
  title: string;
};

export function useProfile() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarErrorSet, setAvatarErrorSet] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [pwErrors, setPwErrors] = useState({
    short: "",
    diff: "",
    general: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [games, setGames] = useState<GameOption[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<GameOption | null>(null);
  const mountedRef = useRef(true);
  const {
    url: avatarBlobUrl,
    loading: avatarLoadingFetch,
    error: avatarGetError,
    refresh: refreshAvatar,
  } = useBlobUrl(fileApi.getImageBlob, currentUser?.imageFileTitle);

  useEffect(() => {
    mountedRef.current = true;
    const loadProfile = async () => {
      setLoading(true);
      setGlobalError(null);
      if (!mountedRef.current) return;

      try {
        const auth = await userApi.getAuthenticated();
        if (mountedRef.current) setCurrentUser(auth);
      } catch (err) {
        setGlobalError(
          errorMessage(err, "Не удалось загрузить данные пользователя"),
        );
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      mountedRef.current = false;
    };
  }, []);
  useEffect(() => {
    let mounted = true;
    (async () => {
      setGamesLoading(true);
      try {
        const page = await gameApi.getAllPaged(0, 1000);
        if (!mounted) return;

        const games = page.content.map((g) => ({
          id: g.id,
          title: g.title,
        }));

        setGames(games);
      } catch {
        setGames([]);
      } finally {
        if (mounted) setGamesLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => () => revokeObjectUrl(avatarPreviewUrl), [avatarPreviewUrl]);
  const passwordField = useBlurField(newPassword, passwordError);
  const repeatField = useBlurField(repeatPassword, (value) =>
    repeatedPasswordError(value, newPassword),
  );

  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      let increment = 8;
      if (w < 950) increment = 5;
      else increment = 8;

      setVisibleCount(increment);
    };

    calc();
    let raf = 0;
    const onResize = () => {
      if (raf) cancelAnimationFrame(raf);

      raf = requestAnimationFrame(calc);
    };

    window.addEventListener("resize", onResize, {
      passive: true,
    });
    window.addEventListener("orientationchange", onResize);

    return () => {
      if (raf) cancelAnimationFrame(raf);

      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);
  useEffect(() => {
    let mounted = true;
    (async () => {
      setChatsLoading(true);
      try {
        const resp = await chatApi.getAllChatPaged(
          0,
          visibleCount,
          selectedGame?.id || null,
        );

        if (!mounted) return;

        const arr = Array.isArray(resp?.content) ? resp.content : [];
        const chats = await Promise.all(
          arr.map(async (chat) => {
            if (chat.gameId) {
              const game = await gameApi.read(chat.gameId);

              return {
                ...chat,
                gameTitle: game.title,
              };
            }

            return chat;
          }),
        );

        if (mounted) setChats(chats);
      } catch {
        if (mounted) setChats([]);
      } finally {
        if (mounted) setChatsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [visibleCount, selectedGame]);
  const handleAvatarChange = async (file: File) => {
    if (!file) return;

    if (!currentUser?.id) {
      setAvatarErrorSet("Ошибка при изменении");

      return;
    }

    if (avatarPreviewUrl) {
      revokeObjectUrl(avatarPreviewUrl);
    }

    const localUrl = createObjectUrl(file);
    setAvatarPreviewUrl(localUrl);
    setAvatarErrorSet("");
    setAvatarUploading(true);
    try {
      const refreshed = await userApi.updateImage(currentUser.id, {
        imageFile: file,
      });

      if (!mountedRef.current) {
        if (localUrl) {
          revokeObjectUrl(localUrl);
        }

        return;
      }

      setCurrentUser(refreshed || currentUser);
      if (!refreshed?.imageFileTitle) {
        setAvatarErrorSet("Ошибка при изменении");
        refreshAvatar();
      }
    } catch {
      revokeObjectUrl(localUrl);
      setAvatarPreviewUrl(null);
      setAvatarErrorSet("Ошибка при изменении");
    } finally {
      if (mountedRef.current) setAvatarUploading(false);
    }
  };

  const handleAvatarDelete = async () => {
    if (!currentUser?.id) {
      setAvatarErrorSet("Ошибка при изменении");

      return;
    }

    setAvatarUploading(true);
    setAvatarErrorSet("");
    try {
      const payload: UserImageInput = {
        imageFile: null,
      };

      await userApi.updateImage(currentUser.id, payload);

      const refreshed = await userApi.getAuthenticated();
      if (mountedRef.current) {
        setCurrentUser(refreshed || null);
        setAvatarPreviewUrl(null);
        setAvatarErrorSet("");
      }
    } catch {
      if (mountedRef.current) {
        setAvatarErrorSet("Ошибка при изменении");
      }
    } finally {
      if (mountedRef.current) setAvatarUploading(false);
    }
  };

  const canSubmitPassword =
    newPassword.length >= 4 &&
    newPassword.length <= 30 &&
    newPassword === repeatPassword &&
    !isSubmitting;

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmitPassword) return;

    if (!currentUser?.id) {
      setPwErrors((prev) => ({
        ...prev,
        general: "Неизвестный пользователь — повторите вход.",
      }));

      return;
    }

    setIsSubmitting(true);
    setPwErrors({
      short: "",
      diff: "",
      general: "",
    });
    try {
      await userApi.updatePassword(currentUser.id, {
        newPassword,
      });
      setNewPassword("");
      passwordField.reset();
      repeatField.reset();
      setRepeatPassword("");
      setShowPasswordForm(false);
    } catch (err) {
      setPwErrors((prev) => ({
        ...prev,
        general: errorMessage(err, "Не удалось сменить пароль"),
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const avatarUrl = avatarPreviewUrl || avatarBlobUrl;
  const avatarLoading = avatarLoadingFetch || avatarUploading;
  const avatarErrorGetText =
    avatarPreviewUrl || avatarUploading
      ? ""
      : avatarGetError
        ? errorMessage(avatarGetError, "Ошибка при получении")
        : "";

  return {
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
  };
}
