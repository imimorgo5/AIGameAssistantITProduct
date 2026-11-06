import { favouriteApi, gameApi } from "entities/game";
import { useAuth, userApi } from "entities/session";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { errorMessage } from "shared/lib/errors";
import { useDebounce } from "shared/lib/useDebounce";

import type { Game } from "entities/game";
import type { User } from "entities/session";

function increment() {
  const width = window.innerWidth;
  if (width < 549) return 3;

  if (width < 799) return 4;

  if (width < 1099) return 6;

  if (width < 1399) return 8;

  return 10;
}

export function useCatalog() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [topGames, setTopGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameLoading, setGameLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameError, setGameError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [search, setSearchValue] = useState("");
  const [pagesLoaded, setPagesLoaded] = useState(1);
  const [pageSize, setPageSize] = useState(increment);
  const [absoluteCount, setAbsoluteCount] = useState(0);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedCategory, setSelectedCategoryValue] = useState<string | null>(
    null,
  );

  const [showFavourites, setShowFavourites] = useState(false);
  const debouncedSearch = useDebounce(search, 280);
  const visibleCount = pagesLoaded * pageSize;
  const loadingMore = gameLoading && pagesLoaded > 1;
  useEffect(() => {
    const resize = () => setPageSize(increment());
    window.addEventListener("resize", resize, {
      passive: true,
    });

    return () => window.removeEventListener("resize", resize);
  }, []);
  useEffect(() => {
    let active = true;
    gameApi
      .getAllPaged(0, 10)
      .then((data) => {
        if (active) {
          setTopGames(data.content);
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (active)
          setError(errorMessage(cause, "Ошибка при загрузке топ-10 игр"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    if (!isAuthenticated) {
      setUserInfo(null);

      return;
    }

    userApi
      .getAuthenticated()
      .then((user) => {
        if (active) setUserInfo(user);
      })
      .catch(() => {
        if (active) setUserInfo(null);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);
  useEffect(() => {
    let active = true;
    setGameLoading(true);
    setGameError(null);
    const filter = debouncedSearch.trim() || null;
    const load =
      showFavourites && isAuthenticated
        ? favouriteApi.getAllPaged
        : gameApi.getAllPaged;

    load(0, visibleCount, filter, selectedCategory)
      .then((data) => {
        if (active) {
          setGames(data.content);
          setAbsoluteCount(data.totalElements);
        }
      })
      .catch((cause: unknown) => {
        if (active)
          setGameError(errorMessage(cause, "Ошибка при загрузке игр"));
      })
      .finally(() => {
        if (active) setGameLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    debouncedSearch,
    selectedCategory,
    showFavourites,
    isAuthenticated,
    visibleCount,
  ]);
  const setSearch = (value: string) => {
    setSearchValue(value);
    setPagesLoaded(1);
  };

  const setSelectedCategory = (value: string | null) => {
    setSelectedCategoryValue(value);
    setPagesLoaded(1);
  };

  const handleSelectFavourites = (value: boolean) => {
    if (!isAuthenticated) {
      navigate("/login");

      return;
    }

    setShowFavourites(value);
    setPagesLoaded(1);
  };

  const handleFavouriteChange = (game: Game, favourite: boolean) => {
    if (showFavourites && !favourite) {
      setGames((previous) => previous.filter((item) => item.id !== game.id));
      setAbsoluteCount((count) => Math.max(0, count - 1));
    }
  };

  return {
    games,
    topGames,
    loading,
    gameLoading,
    loadingMore,
    error,
    gameError,
    userInfo,
    search,
    setSearch,
    visibleCount,
    absoluteCount,
    selectedGame,
    setSelectedGame,
    showFavourites,
    selectedCategory,
    setSelectedCategory,
    setPagesLoaded,
    handleSelectFavourites,
    handleFavouriteChange,
  };
}
