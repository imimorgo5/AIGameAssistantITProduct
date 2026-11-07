"use client";

import { categoryApi } from "entities/game";
import { bindClasses } from "shared/lib/styles";
import { SelectDropdown } from "shared/ui/select-dropdown";
import { ToggleSlider } from "shared/ui/toggle-slider";
import { GameGrid, GameModal, Hero } from "widgets/catalog";
import { Header } from "widgets/header";

import style0 from "./MainPage.module.scss";
import { useCatalog } from "../model/useCatalog";

import type { Game } from "entities/game";
import type { Page } from "shared/lib/validation";

export default function MainPage({
  initialCatalog,
}: {
  initialCatalog: Page<Game>;
}) {
  const {
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
  } = useCatalog(initialCatalog);

  return (
    <div className={cx("catalog-root")}>
      <Header
        appearance="catalog"
        search={search}
        onSearchChange={setSearch}
        currentUser={userInfo}
      />

      <main className={cx("catalog-content")}>
        {loading && (
          <div className={cx("full-loader")}>
            <div className={cx("spinner")} />
          </div>
        )}

        {!loading && error && (
          <div className={cx("loading-error")}>{error}</div>
        )}

        {!loading && !error && (
          <>
            <div className={cx("hero-anchor")} data-hero-anchor>
              <Hero
                topGames={topGames}
                onOpenGame={(g) => setSelectedGame(g)}
              />
            </div>

            <div className={cx("grid-container")}>
              <div className={cx("grid-top-controls")}>
                <SelectDropdown
                  appearance="filter"
                  fetchItems={() =>
                    categoryApi
                      .getAll()
                      .then((list) =>
                        Array.isArray(list) ? list.map((c) => c.name) : [],
                      )
                  }
                  value={selectedCategory}
                  onChange={(v) => {
                    setSelectedCategory(v);
                    setPagesLoaded(1);
                  }}
                  allowNull={true}
                  placeholder="Категория игр"
                />
                <div className={cx("slider-container")}>
                  <ToggleSlider
                    appearance="outlined"
                    leftLabel="Избранное"
                    rightLabel="Все игры"
                    value={showFavourites}
                    onChange={handleSelectFavourites}
                  />
                </div>
              </div>

              <div className={cx("games-area")}>
                {gameError && !games.length ? (
                  <div className="loading-error" role="alert">
                    {gameError}
                  </div>
                ) : gameLoading && !games.length ? (
                  <div className={cx("games-grid-loading")}>
                    <div className="spinner" />
                  </div>
                ) : (
                  <GameGrid
                    games={games}
                    onOpenGame={(g) => setSelectedGame(g)}
                    loading={gameLoading && !games.length}
                    error={games.length ? null : gameError}
                    emptyMessage={
                      search.trim() || selectedCategory || showFavourites
                        ? "Ничего не найдено"
                        : "Игр пока нет"
                    }
                  />
                )}

                {(visibleCount < absoluteCount || loadingMore) && (
                  <div className={cx("load-more-wrap")}>
                    <button
                      className={cx("btn load-more")}
                      disabled={loadingMore}
                      onClick={() => setPagesLoaded((p) => p + 1)}
                    >
                      {loadingMore ? "Загрузка..." : "Загрузить ещё"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {selectedGame && (
        <GameModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
          onFavouriteChange={handleFavouriteChange}
        />
      )}
    </div>
  );
}
const cx = bindClasses(style0);
