import { modelApi } from "entities/ai";
import { categoryApi, gameApi } from "entities/game";
import { useAuth, userApi } from "entities/session";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fileApi } from "shared/api/file";
import { downloadBlob } from "shared/lib/blobUtils";
import { errorMessage } from "shared/lib/errors";
import { useStableCallback } from "shared/lib/react";
import { useDebounce } from "shared/lib/useDebounce";

import type { Category, Game, GameInput } from "entities/game";
import type { User } from "entities/session";

type Tab = "users" | "games" | "settings";

interface ConfirmState {
  open: boolean;
  text?: string;
  onConfirm?: () => Promise<void>;
  type?: string;
}

interface GameFormState {
  open: boolean;
  mode?: "create" | "edit";
  initial?: Game | null;
}

interface ViewerState {
  open: boolean;
  fileType: "image" | "pdf" | null;
  fileTitle: string | null;
}

export function useAdmin() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [items, setItems] = useState<(User | Game)[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 280);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [viewerState, setViewerState] = useState<ViewerState>({
    open: false,
    fileType: null,
    fileTitle: null,
  });

  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    text: "",
    type: "delete",
  });

  const [gameFormState, setGameFormState] = useState<GameFormState>({
    open: false,
    mode: "create",
    initial: null,
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: Tab = tabParam === "games" || tabParam === "settings" ? tabParam : "users";
  const dataRequest = useRef(0);
  useEffect(
    () => () => {
      dataRequest.current += 1;
    },
    [],
  );
  const loadData = useStableCallback(
    async ({
      tabToUse = "users",
      pageToUse = 1,
      searchToUse = "",
    }: {
      tabToUse?: Tab;
      pageToUse?: number;
      searchToUse?: string;
    } = {}) => {
      const requestId = ++dataRequest.current;
      setItemsLoading(true);
      try {
        let data = null;
        if (tabToUse === "users") {
          data = await userApi.getAllPaged(
            pageToUse - 1,
            10,
            (searchToUse || "").trim() || null,
          );
          if (requestId !== dataRequest.current) return;

          setItems(Array.isArray(data?.content) ? data.content : []);
        } else if (tabToUse === "games") {
          data = await gameApi.getAllPaged(
            pageToUse - 1,
            10,
            (searchToUse || "").trim() || null,
            null,
            "id",
          );
          const games = await Promise.all(
            (data?.content || []).map((item) => gameApi.read(item.id)),
          );

          if (requestId !== dataRequest.current) return;

          setItems(Array.isArray(games) ? games : []);
          const allCategories = await categoryApi.getAll();
          if (requestId !== dataRequest.current) return;

          setCategories([...allCategories].sort((a, b) => a?.id - b?.id) || []);
        } else if (tabToUse === "settings") {
          const currentModel = await modelApi.getMain();
          if (requestId !== dataRequest.current) return;

          setSelectedModel(currentModel || null);
        }

        if (requestId !== dataRequest.current) return;

        setPageCount(data?.totalPages || 1);
        setError(null);
      } catch (err) {
        if (requestId === dataRequest.current)
          setError(errorMessage(err, "Ошибка при загрузке данных"));
      } finally {
        if (requestId === dataRequest.current) setItemsLoading(false);
      }
    },
  );

  const refreshData = async (
    resetPage = false,
    overrideTab: Tab | undefined = undefined,
    overrideSearch: string | undefined = undefined,
  ) => {
    const tabToUse = overrideTab !== undefined ? overrideTab : activeTab;
    const searchToUse =
      overrideSearch !== undefined ? overrideSearch : debouncedSearch;

    const pageToUse = resetPage ? 1 : page;
    await loadData({
      tabToUse,
      pageToUse,
      searchToUse,
    });
  };

  useEffect(() => {
    if (currentUser?.isAdmin)
      void loadData({
        tabToUse: activeTab,
        pageToUse: page,
        searchToUse: debouncedSearch,
      });
  }, [activeTab, page, debouncedSearch, currentUser, loadData]);
  const switchTab = (tab: Tab) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set("tab", tab);

      return next;
    });
    setItems([]);
    setSearch("");
    setPage(1);
    setPageCount(1);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const authUser = await userApi.getAuthenticated();
        if (!mounted) return;

        if (!authUser?.isAdmin) {
          navigate("/", {
            replace: true,
          });

          return;
        }

        setCurrentUser(authUser);
      } catch (cause) {
        setError(
          errorMessage(cause, "Ошибка при получении данных пользователя"),
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [navigate]);
  const handleDeleteUser = (user: User) => {
    setConfirmState({
      open: true,
      text: `Вы уверены, что хотите удалить пользователя "${user.login}" (${user.email})? Это действие нельзя отменить.`,
      onConfirm: async () => {
        try {
          await userApi.delete(user.id);
          setConfirmState({
            open: false,
          });
          if (currentUser && user.id === currentUser.id) {
            await logout();
            navigate("/login", {
              replace: true,
            });

            return;
          }

          setItems([]);
          if (page !== 1) {
            setPage(1);
          }

          await refreshData(true);
        } catch (cause) {
          alert(errorMessage(cause, "Не удалось удалить пользователя."));
          setConfirmState({
            open: false,
          });
        }
      },
      type: "delete",
    });
  };

  const handleEnableUser = async (user: User) => {
    setConfirmState({
      open: true,
      text: `Вы уверены, что хотите подтвердить пользователя "${user.login}" с email "${user.email}"? Это действие нельзя отменить.`,
      onConfirm: async () => {
        try {
          await userApi.forciblyConfirmUserEmail(user.id);
          setConfirmState({
            open: false,
          });
          await refreshData();
        } catch (cause) {
          alert(errorMessage(cause, "Не удалось подтвердить пользователя."));
          setConfirmState({
            open: false,
          });
        }
      },
      type: "confirm",
    });
  };

  const applyAdminChange = async (user: User, checked: boolean) => {
    try {
      if (checked) {
        await userApi.makeAdmin(user.id);
      } else {
        await userApi.makeNotAdmin(user.id);
      }

      if (currentUser && user.id === currentUser.id) {
        navigate("/");

        return;
      }

      await refreshData();
    } catch (cause) {
      alert(errorMessage(cause, "Не удалось изменить права пользователя."));
    }
  };

  const handleToggleAdmin = (user: User, checked: boolean) => {
    if (!user || user.id == null) return;

    const current = Boolean(user.isAdmin);
    if (checked === current) return;

    if (checked) {
      setConfirmState({
        open: true,
        text: `Вы действительно хотите сделать пользователя "${user.login}" (${user.email}) админом?`,
        onConfirm: async () => {
          await applyAdminChange(user, true);
          setConfirmState({
            open: false,
          });
        },
        type: "confirm",
      });
    } else {
      applyAdminChange(user, false);
    }
  };

  const handleOpenViewer = (fileType: "image" | "pdf", fileTitle: string) => {
    if (!fileTitle) return;

    setViewerState({
      open: true,
      fileType,
      fileTitle,
    });
  };

  const handleOpenCreateGame = () => {
    setGameFormState({
      open: true,
      mode: "create",
      initial: null,
    });
  };

  const handleOpenEditGame = (game: Game) => {
    setGameFormState({
      open: true,
      mode: "edit",
      initial: game,
    });
  };

  const handleDeleteGame = (game: Game) => {
    setConfirmState({
      open: true,
      text: `Вы действительно хотите удалить игру "${game.title}"?`,
      onConfirm: async () => {
        try {
          await gameApi.delete(game.id);
          setConfirmState({
            open: false,
          });
          setItems([]);
          if (page !== 1) {
            setPage(1);
          }

          await refreshData(true);
        } catch (cause) {
          alert(errorMessage(cause, "Не удалось удалить игру."));
          setConfirmState({
            open: false,
          });
        }
      },
      type: "delete",
    });
  };

  const handleDownloadFile = async (
    fileType: "image" | "pdf",
    fileTitle: string,
  ) => {
    try {
      if (!fileTitle) return;

      let blob;
      if (fileType === "image") {
        blob = await fileApi.getImageBlob(fileTitle);
      } else {
        blob = await fileApi.getRulesBlob(fileTitle);
      }

      await downloadBlob(blob, false, fileTitle);
    } catch (cause) {
      alert(errorMessage(cause, "Не удалось скачать файл."));
    }
  };

  const handleGameFormSave = async (
    formData: GameInput,
    mode: "create" | "edit",
    id?: number,
  ) => {
    if (mode === "create") {
      await gameApi.create(formData);
    } else {
      if (id === undefined) throw new Error("Игра не найдена");

      await gameApi.update(id, formData);
    }

    setGameFormState({ open: false, mode: "create", initial: null });
    await refreshData();
  };

  const handleAddCategory = async (name: string) => {
    const nameToSave = name.trim();
    if (!nameToSave) return;

    await categoryApi.create(nameToSave);
    await refreshData();
  };

  const handleDeleteCategory = (cat: Category) => {
    const id = cat && (cat.id ?? cat);
    setConfirmState({
      open: true,
      text: `Вы действительно хотите удалить категорию "${typeof cat === "string" ? cat : (cat.name ?? "")}"?`,
      onConfirm: async () => {
        try {
          await categoryApi.delete(id);
          setConfirmState({
            open: false,
          });
          await refreshData();
        } catch (cause) {
          alert(errorMessage(cause, "Не удалось удалить категорию."));
          setConfirmState({
            open: false,
          });
        }
      },
      type: "delete",
    });
  };

  const handleChangeModel = async (newModel: string) => {
    try {
      if (!newModel) return;

      await modelApi.updateMain(newModel);
      setSelectedModel(newModel);
    } catch (cause) {
      alert(errorMessage(cause, "Не удалось изменить модель."));
    }
  };

  return {
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
  };
}
