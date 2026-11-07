import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { favouriteApi, gameApi } from "entities/game";
import { useAuth, userApi } from "entities/session";
import { errorMessage } from "shared/lib/errors";
import { useMediaQuery } from "shared/lib/react";
import { useDebounce } from "shared/lib/useDebounce";

import type { Game } from "entities/game";
import type { User } from "entities/session";
import type { Page } from "shared/lib/validation";

interface Result {
  key: string;
  data: Page<Game>;
  error: string | null;
}

export function useCatalog(initialCatalog: Page<Game>) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [search, setSearchValue] = useState("");
  const [pagesLoaded, setPagesLoaded] = useState(1);
  const small = useMediaQuery("(max-width: 548px)");
  const medium = useMediaQuery("(max-width: 798px)");
  const large = useMediaQuery("(max-width: 1098px)");
  const wide = useMediaQuery("(max-width: 1398px)");
  const pageSize = small ? 3 : medium ? 4 : large ? 6 : wide ? 8 : 10;
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedCategory, setSelectedCategoryValue] = useState<string | null>(
    null,
  );
  const [showFavourites, setShowFavourites] = useState(false);
  const debouncedSearch = useDebounce(search, 280);
  const visibleCount = pagesLoaded * pageSize;
  const favourites = showFavourites && isAuthenticated;
  const filter = debouncedSearch.trim() || null;
  const key = JSON.stringify([
    visibleCount,
    filter,
    selectedCategory,
    favourites,
  ]);
  const [result, setResult] = useState<Result>({
    key: JSON.stringify([10, null, null, false]),
    data: initialCatalog,
    error: null,
  });
  const gameLoading = result.key !== key;
  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    void userApi
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
    const load = favourites ? favouriteApi.getAllPaged : gameApi.getAllPaged;
    void load(0, visibleCount, filter, selectedCategory)
      .then((data) => {
        if (active) setResult({ key, data, error: null });
      })
      .catch((cause: unknown) => {
        if (active)
          setResult((previous) => ({
            ...previous,
            key,
            error: errorMessage(cause, "Ошибка при загрузке игр"),
          }));
      });
    return () => {
      active = false;
    };
  }, [favourites, visibleCount, filter, selectedCategory, key]);
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
      router.push("/login");
      return;
    }
    setShowFavourites(value);
    setPagesLoaded(1);
  };
  const handleFavouriteChange = (game: Game, favourite: boolean) => {
    if (showFavourites && !favourite)
      setResult((previous) => ({
        ...previous,
        data: {
          ...previous.data,
          content: previous.data.content.filter((item) => item.id !== game.id),
          totalElements: Math.max(0, previous.data.totalElements - 1),
        },
      }));
  };
  return {
    games: result.data.content,
    topGames: initialCatalog.content,
    loading: false,
    error: null,
    gameLoading,
    loadingMore: gameLoading && pagesLoaded > 1,
    gameError: result.key === key ? result.error : null,
    userInfo: isAuthenticated ? userInfo : null,
    search,
    setSearch,
    visibleCount,
    absoluteCount: result.data.totalElements,
    selectedGame,
    setSelectedGame,
    showFavourites: favourites,
    selectedCategory,
    setSelectedCategory,
    setPagesLoaded,
    handleSelectFavourites,
    handleFavouriteChange,
  };
}
