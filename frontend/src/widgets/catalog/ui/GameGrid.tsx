import { AnimatePresence, motion } from "framer-motion";

import { bindClasses } from "shared/lib/styles";

import GameCard from "./GameCard";
import style0 from "./GameGrid.module.scss";

import type { Game } from "entities/game";

interface Props {
  games?: Game[];
  onOpenGame: (game: Game) => void;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
}

export default function GameGrid({
  games = [],
  onOpenGame,
  loading = false,
  error = null,
  emptyMessage = "Игр пока нет",
}: Props) {
  return (
    <div className={cx("grid-wrap")}>
      <div className={cx("grid-surface")}>
        {loading ? (
          <div className={cx("games-grid-loading")}>
            <div className={cx("spinner grid")} />
          </div>
        ) : error ? (
          <div className={cx("games-grid-error")}>{error}</div>
        ) : games.length === 0 ? (
          <div className={cx("games-grid-empty")} role="status">
            {emptyMessage}
          </div>
        ) : (
          <div className={cx("games-grid")}>
            <AnimatePresence mode="popLayout" initial={false}>
              {games.map((g) => (
                <motion.div
                  key={g.id}
                  layout
                  layoutId={`game-${g.id}`}
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
                  className={cx("game-item")}
                >
                  <GameCard game={g} onOpen={() => onOpenGame(g)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
const cx = bindClasses(style0);
