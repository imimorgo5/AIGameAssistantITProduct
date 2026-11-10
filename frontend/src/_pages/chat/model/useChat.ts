import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { modelApi } from "entities/ai";
import { chatApi, guestLimits } from "entities/chat";
import { gameApi, useRulesStatus } from "entities/game";
import { userApi } from "entities/session";
import { errorMessage } from "shared/lib/errors";
import { textError, useBlurField } from "shared/lib/forms";
import { useMediaQuery, useStableCallback } from "shared/lib/react";

import { useGuestChat } from "./useGuestChat";

import type { Message, Session } from "entities/chat";
import type { Game } from "entities/game";
import type { User } from "entities/session";
import type React from "react";

function makeId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function groupSessionsByTime(sessions: Session[]): [string, Session[]][] {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfToday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - 7);
  const thirtyDaysAgo = new Date(startOfToday);
  thirtyDaysAgo.setDate(startOfToday.getDate() - 30);
  const groups = new Map<string, Session[]>();
  const push = (key: string, item: Session) => {
    if (!groups.has(key)) groups.set(key, []);

    groups.get(key)?.push(item);
  };

  sessions.forEach((s) => {
    const time = new Date(s.lastUseTime || s.createdAt || Date.now());
    if (time >= startOfToday) {
      push("Сегодня", s);

      return;
    }

    if (time >= startOfYesterday && time < startOfToday) {
      push("Вчера", s);

      return;
    }

    if (time >= startOfWeek && time < startOfYesterday) {
      push("Последняя неделя", s);

      return;
    }

    if (time >= thirtyDaysAgo && time < startOfWeek) {
      push("Последний месяц", s);

      return;
    }

    push("Ранее", s);
  });
  const order = [
    "Сегодня",
    "Вчера",
    "Последняя неделя",
    "Последний месяц",
    "Ранее",
  ];

  const final: [string, Session[]][] = [];
  order.forEach((k) => {
    const group = groups.get(k);
    if (group) final.push([k, group]);
  });

  return final;
}

export function useChat(guest = false) {
  const router = useRouter();
  const pathname = usePathname();
  const segments = pathname.split("/").slice(3);
  const pendingNewChatPath = useRef<string | null>(null);
  const routeGameId = segments[0];
  const routeChatId = segments[1];
  const guestChat = useGuestChat(routeGameId, guest);
  const inputLimit = guest ? guestLimits.input : 10000;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameLoading, setGameLoading] = useState(true);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [modelChanging, setModelChanging] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const rulesPreparation = useRulesStatus(game?.id);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [absoluteCount, setAbsoluteCount] = useState(0);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const inputField = useBlurField(input, (value) =>
    textError(value, inputLimit, false),
  );
  const [sending, setSending] = useState(false);
  const desktop = useMediaQuery("(min-width: 900px)");
  const [sidebarOverride, setSidebarOpen] = useState<boolean | null>(null);
  const sidebarOpen = sidebarOverride ?? desktop;

  const [rulesSidebarOpen, setRulesSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (guest)
      messagesRef.current?.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: "auto",
      });
  }, [guest, guestChat.messages]);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);
  const activeStreamRef = useRef<{
    controller: {
      close: () => void;
    };
    streamId: string;
  } | null>(null);

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    text?: string;
    onConfirm?: () => Promise<void>;
  }>({
    open: false,
    text: "",
  });

  const sessionRequest = useRef(0);
  const refreshAllSessions = useStableCallback(
    async (useGame: Game | null = game, isLoadMore = false) => {
      if (guest) {
        setChatsLoading(false);
        return;
      }
      const requestId = ++sessionRequest.current;
      if (isLoadMore) setLoadingMore(true);
      else setChatsLoading(true);
      let mapped: Session[] = [];
      try {
        if (!useGame || !useGame.id) {
          setSessions([]);

          return;
        }

        const previews = await chatApi.getAllChatPaged(
          0,
          visibleCount,
          useGame.id,
        );

        mapped = (Array.isArray(previews?.content) ? previews.content : []).map(
          (p) => ({
            id: p.id != null ? String(p.id) : makeId("s"),
            title: p.title || "Чат",
            lastUseTime: p.lastUseTime
              ? new Date(p.lastUseTime).toISOString()
              : new Date().toISOString(),
            createdAt: p.lastUseTime
              ? new Date(p.lastUseTime).toISOString()
              : new Date().toISOString(),
          }),
        );
        if (!mounted.current || requestId !== sessionRequest.current) return;

        setAbsoluteCount(previews?.totalElements || 0);
        setError(null);
      } catch (cause) {
        mapped = [];
        setError(errorMessage(cause, "Ошибка при загрузке чатов"));
      } finally {
        if (mounted.current && requestId === sessionRequest.current) {
          if (isLoadMore) setLoadingMore(false);
          else setChatsLoading(false);
          setSessions(mapped);
        }
      }
    },
  );

  const adjustTextareaHeight = (el: HTMLTextAreaElement | null) => {
    if (!el) return 0;

    el.style.height = "auto";
    const max = 220;
    const newH = Math.min(el.scrollHeight, max);
    el.style.height = `${newH}px`;

    return newH;
  };

  useEffect(() => {
    adjustTextareaHeight(inputRef.current);
  }, []);
  useEffect(() => {
    if (!input) {
      if (inputRef.current) inputRef.current.style.height = "";
    } else {
      adjustTextareaHeight(inputRef.current);
    }

    setTimeout(() => {
      if (messagesRef.current) {
        messagesRef.current.scrollTo({
          top: messagesRef.current.scrollHeight,
          behavior: "auto",
        });
      }
    }, 0);
  }, [input]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (guest) {
        setLoading(false);
        return;
      }
      try {
        const user = await userApi.getAuthenticated();
        if (!mounted) return;

        setCurrentUser(user);
        const [available, defaultModel] = await Promise.all([
          modelApi.getAll(),
          modelApi.getMain(),
        ]);
        const userModel = available.some((model) => model.id === user.model)
          ? user.model
          : defaultModel;
        if (mounted) setSelectedModel(userModel || null);
      } catch (cause) {
        setError(
          errorMessage(cause, "Ошибка при получении данных пользователя"),
        );
        if (!mounted) return;

        setCurrentUser(null);
        setSelectedModel(null);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [guest]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!routeGameId) {
        setGameLoading(false);

        return;
      }

      try {
        const g = await gameApi.read(routeGameId);
        if (!mounted) return;

        setGame(g || null);
        setError(null);
      } catch (cause) {
        setError(errorMessage(cause, "Ошибка при загрузке игры"));
        if (mounted) setGame(null);
      } finally {
        setGameLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [routeGameId]);
  useEffect(() => {
    return () => {
      if (
        activeStreamRef.current &&
        typeof activeStreamRef.current.controller.close === "function"
      ) {
        activeStreamRef.current.controller.close();
      }
    };
  }, []);
  const fetchIdRef = useRef(0);
  const selectSession = useStableCallback(
    async (session: Session, { navigateToRoute = true } = {}) => {
      setActiveSession(session);
      if (navigateToRoute) {
        router.push(`/games/ai/${game?.id}/${session.id}`);
      }

      setChatError(null);
      setChatLoading(true);
      setMessages([]);
      setInput("");
      inputField.reset();
      fetchIdRef.current += 1;
      const thisFetchId = fetchIdRef.current;
      try {
        const chatDto = await chatApi.getChat(session.id);
        if (!mounted.current || thisFetchId !== fetchIdRef.current) return;

        const mapped = (chatDto?.messageDTOs || []).map((m, i) => ({
          id: `${session.id}_${i}_${new Date(m.timestamp || Date.now()).getTime()}`,
          role: m.role ? String(m.role).toLowerCase() : "assistant",
          text: m.text || "",
          createdAt: m.timestamp
            ? new Date(m.timestamp).toISOString()
            : new Date().toISOString(),
        }));

        mapped.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        setActiveSession({
          ...session,
          title: chatDto.title,
          lastUseTime: chatDto.lastUseTime,
        });
        setMessages(mapped);
        setChatError(null);
        if (typeof window !== "undefined") {
          if (window.innerWidth < 900) {
            setSidebarOpen(false);
          }
        } else {
          setSidebarOpen(false);
        }

        setTimeout(
          () =>
            messagesRef.current?.scrollTo({
              top: messagesRef.current.scrollHeight,
              behavior: "smooth",
            }),
          40,
        );
      } catch {
        if (!mounted.current || thisFetchId !== fetchIdRef.current) return;

        setChatError("Ошибка при загрузке чата");
        setMessages([]);
      } finally {
        if (thisFetchId === fetchIdRef.current) {
          setChatLoading(false);
        }
      }
    },
  );

  const handleDeleteSession = async (sessionId: string) => {
    setConfirmState({
      open: true,
      text: "Вы уверены, что хотите удалить чат? Это действие нельзя отменить.",
      onConfirm: async () => {
        try {
          await chatApi.deleteChat(sessionId);
          setConfirmState({
            open: false,
          });
          const next = sessions.filter((s) => s.id !== sessionId);
          setSessions(next);
          if (String(activeSession?.id) === String(sessionId)) {
            if (game && game?.id) router.push(`/games/ai/${game?.id}`);
            else router.push("/games/ai");

            setActiveSession(null);
            setMessages([]);
          }
        } catch (cause) {
          alert(errorMessage(cause, "Не удалось удалить сессию."));
          setConfirmState({
            open: false,
          });
        }
      },
    });
  };

  const scrollToBottom = () => {
    setTimeout(
      () =>
        messagesRef.current?.scrollTo({
          top: messagesRef.current.scrollHeight,
          behavior: "smooth",
        }),
      40,
    );
  };

  const closeActiveStream = useStableCallback(() => {
    if (
      activeStreamRef.current &&
      typeof activeStreamRef.current.controller.close === "function"
    ) {
      activeStreamRef.current.controller.close();
      activeStreamRef.current = null;
    }
  });

  const handleSend = async () => {
    if (
      !game ||
      rulesPreparation.state?.status !== "ready" ||
      sending ||
      modelChanging ||
      textError(input, inputLimit)
    )
      return;
    if (guest) {
      if (guestChat.send(input)) {
        inputField.reset();
        setInput("");
      }
      return;
    }

    const text = input;
    inputField.reset();
    setInput("");
    setSending(true);
    closeActiveStream();
    const timestamp = new Date().toISOString();
    const userMessage: Message = {
      id: makeId("user"),
      role: "user",
      text,
      createdAt: timestamp,
    };

    const streamId = makeId("answer");
    setMessages((previous) => [
      ...previous,
      userMessage,
      {
        id: streamId,
        role: "assistant",
        text: "",
        createdAt: timestamp,
        _streaming: true,
      },
    ]);
    scrollToBottom();
    const fail = (cause: unknown) => {
      if (!mounted.current) return;

      setMessages((previous) =>
        previous.map((message) =>
          message.id === streamId
            ? {
                ...message,
                role: "error",
                text: errorMessage(
                  cause,
                  "Ошибка при получении ответа от сервера.",
                ),
                _streaming: false,
              }
            : message,
        ),
      );
      setSending(false);
      activeStreamRef.current = null;
    };

    try {
      const chat = activeSession
        ? await chatApi.continueChat(activeSession.id, text, selectedModel)
        : await chatApi.startChat({
            gameId: game.id,
            request: text,
          });

      if (!mounted.current) return;

      const session: Session = {
        id: String(chat.id),
        title: chat.title,
        lastUseTime: chat.lastUseTime,
        createdAt: activeSession?.createdAt ?? chat.lastUseTime,
      };

      setActiveSession(session);
      setSessions((previous) => [
        session,
        ...previous.filter((item) => item.id !== session.id),
      ]);
      const controller = chatApi.streamAnswer(session.id, {
        onChunk: (chunk) => {
          if (!mounted.current) return;

          setMessages((previous) =>
            previous.map((message) =>
              message.id === streamId
                ? {
                    ...message,
                    text: message.text + chunk,
                  }
                : message,
            ),
          );
          scrollToBottom();
        },
        onComplete: () => {
          if (!mounted.current) return;

          setMessages((previous) =>
            previous.map((message) =>
              message.id === streamId
                ? {
                    ...message,
                    _streaming: false,
                  }
                : message,
            ),
          );
          setSending(false);
          activeStreamRef.current = null;
          void refreshAllSessions();
        },
        onError: fail,
      });

      activeStreamRef.current = {
        controller,
        streamId,
      };
      window.history.replaceState(
        null,
        "",
        `/games/ai/${game.id}/${session.id}`,
      );
    } catch (cause) {
      fail(cause);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSidebarSelect = (session: Session) => {
    if (sending) return;

    router.push(`/games/ai/${game?.id}/${session.id}`);
    if (window.innerWidth < 900) setSidebarOpen(false);
  };

  const handleNewChat = () => {
    if (guest) {
      guestChat.clear();
      setInput("");
      inputField.reset();
      return;
    }
    if (!game || sending || chatLoading) return;

    pendingNewChatPath.current = `/games/ai/${game.id}`;
    fetchIdRef.current += 1;
    closeActiveStream();
    setActiveSession(null);
    setMessages([]);
    setInput("");
    inputField.reset();
    setChatError(null);
    setChatLoading(false);
    window.history.pushState(null, "", `/games/ai/${game.id}`);
    if (window.innerWidth < 900) setSidebarOpen(false);

    inputRef.current?.focus();
  };

  const handleChangeModel = async (newModel: string) => {
    if (modelChanging || sending) return;

    try {
      if (!newModel) return;

      setModelChanging(true);
      if (!currentUser) return;

      await modelApi.updateUser(currentUser.id, newModel);
      setSelectedModel(newModel);
    } catch (cause) {
      alert(errorMessage(cause, "Не удалось изменить модель."));
    } finally {
      setModelChanging(false);
    }
  };

  useEffect(() => {
    void refreshAllSessions(game);
  }, [game, visibleCount, refreshAllSessions]);
  useEffect(() => {
    if (guest || !game || sending) return;
    if (pendingNewChatPath.current) {
      if (pathname !== pendingNewChatPath.current) return;
      pendingNewChatPath.current = null;
    }

    if (!routeChatId) {
      closeActiveStream();
      return;
    }

    if (activeSession?.id === routeChatId) return;

    const session: Session = {
      id: routeChatId,
      title: "Чат",
      createdAt: new Date().toISOString(),
      lastUseTime: new Date().toISOString(),
    };

    void selectSession(session, {
      navigateToRoute: false,
    });
  }, [
    guest,
    game,
    routeChatId,
    pathname,
    sending,
    activeSession?.id,
    selectSession,
    closeActiveStream,
  ]);
  const [previousChatId, setPreviousChatId] = useState(routeChatId);
  if (previousChatId !== routeChatId) {
    setPreviousChatId(routeChatId);
    if (!routeChatId && !sending) {
      setActiveSession(null);
      setMessages([]);
      setChatError(null);
    }
  }
  const grouped = groupSessionsByTime(sessions);

  return {
    currentUser,
    gameLoading,
    error,
    game,
    loading: loading || (guest && !guestChat.ready),
    guest,
    guestStatus: guestChat.status,
    guestNotice: guestChat.notice,
    rulesState: rulesPreparation.state,
    refreshRules: rulesPreparation.refresh,
    inputLimit,
    selectedModel: guest ? (guestChat.status?.modelId ?? null) : selectedModel,
    handleChangeModel,
    modelChanging,
    sending: guest ? guestChat.sending : sending,
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
    messages: guest ? guestChat.messages : messages,
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
  };
}
