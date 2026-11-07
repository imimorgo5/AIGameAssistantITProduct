import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { favouriteApi, gameApi } from "entities/game";
import { useAuth } from "entities/session";
import { fileApi } from "shared/api/file";
import { errorMessage } from "shared/lib/errors";
import { bindClasses } from "shared/lib/styles";
import { useBlobUrl } from "shared/lib/useBlobUrl";
import { FileViewer } from "shared/ui/file-viewer";
import { Modal } from "shared/ui/modal";

import gridStyles from "./GameGrid.module.scss";
import style1 from "./GameModal.module.scss";

import type { Game } from "entities/game";

interface Props {
  game: Game;
  onClose: () => void;
  onFavouriteChange?: (game: Game, favourite: boolean) => void;
}

export default function GameModal(props: Props) {
  return <GameModalContent key={props.game.id} {...props} />;
}

function GameModalContent({ game, onClose, onFavouriteChange }: Props) {
  const [rulesOpen, setRulesOpen] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [gameData, setGameData] = useState<Game | null>(null);
  const [loadingGame, setLoadingGame] = useState(true);
  const [isFavourite, setIsFavourite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [favouriteError, setFavouriteError] = useState(false);
  const mountedRef = useRef(true);
  const { url: imageUrl, loading: blobLoading } = useBlobUrl(
    fileApi.getImageBlob,
    gameData?.imageFileTitle,
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await gameApi.read(game.id);
        if (cancelled) return;

        if (mountedRef.current) setGameData(data);
      } catch {
        if (!cancelled && mountedRef.current) setGameData(null);
      } finally {
        if (!cancelled && mountedRef.current) setLoadingGame(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [game]);
  useEffect(() => {
    let cancelled = false;
    if (!isAuthenticated) return;

    if (!gameData?.id) return;

    (async () => {
      try {
        setFavLoading(true);
        setFavouriteError(false);
        const exists = await favouriteApi.contains(gameData.id, gameData.title);
        if (!cancelled && mountedRef.current) setIsFavourite(exists);
      } catch {
        if (!cancelled) setFavouriteError(true);
      } finally {
        if (!cancelled) setFavLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [gameData, isAuthenticated]);
  const toggleFavourite = async () => {
    if (!isAuthenticated) {
      router.push("/login");

      return;
    }

    if (!gameData?.id) return;

    setFavLoading(true);
    const prev = isFavourite;
    setIsFavourite(!prev);
    try {
      if (!prev) {
        await favouriteApi.add(gameData.id);
      } else {
        await favouriteApi.remove(gameData.id);
      }

      if (typeof onFavouriteChange === "function")
        onFavouriteChange(gameData, !prev);
    } catch (err) {
      if (mountedRef.current) setIsFavourite(prev);

      alert(
        errorMessage(err, "Не удалось обновить избранное. Попробуйте ещё раз."),
      );
    } finally {
      if (mountedRef.current) setFavLoading(false);
    }
  };

  const titleText = loadingGame
    ? "Загрузка..."
    : gameData?.title || "Название отсутствует";

  const descriptionText = loadingGame
    ? ""
    : gameData?.description || "Описание отсутствует";

  if (rulesOpen && gameData?.rulesFileTitle) {
    return (
      <Modal variant="viewer" onClose={() => setRulesOpen(false)}>
        <FileViewer
          fileType="pdf"
          fileTitle={gameData.rulesFileTitle}
          title="Правила игры"
          onClose={() => setRulesOpen(false)}
        />
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      {loadingGame ? (
        <div className={cx("games-grid-loading")}>
          <div className={cx("spinner grid")} />
        </div>
      ) : (
        <div
          className={cx("game-modal-window")}
          role="dialog"
          aria-modal="true"
        >
          <h2 className={cx("gm-title")}>{titleText}</h2>
          <div className={cx("gm-body")}>
            <div className={cx("gm-left")}>
              <div className={cx("gm-image-wrap")}>
                {imageUrl ? (
                  <>
                    <Image
                      unoptimized
                      width={512}
                      height={512}
                      src={imageUrl}
                      alt={gameData?.title || "game image"}
                      className={cx("modal-image")}
                    />
                  </>
                ) : blobLoading ? (
                  <div className={cx("modal-image placeholder")}>
                    <div className={cx("spinner")} />
                  </div>
                ) : (
                  <div className={cx("modal-image placeholder")}>
                    <div className={cx("gm-error")}>Не удалось загрузить</div>
                  </div>
                )}
              </div>

              <div className={cx("gm-btn-row")}>
                <button
                  className={cx("btn gm-circle-btn")}
                  onClick={() => setRulesOpen(true)}
                  disabled={loadingGame || !gameData?.rulesFileTitle}
                  title="Смотреть правила игры"
                  aria-label="Смотреть правила игры"
                >
                  <svg
                    width="50"
                    height="50"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="
                      M12 6.90909C10.8999 5.50893 9.20406 4.10877 5.00119 4.00602C4.72513 3.99928 4.5 4.22351 4.5 4.49965C4.5 6.54813 4.5 14.3034
                      4.5 16.597C4.5 16.8731 4.72515 17.09 5.00114 17.099C9.20405 17.2364 10.8999 19.0998 12 20.5M12 6.90909C13.1001 5.50893 14.7959 4.10877
                      18.9988 4.00602C19.2749 3.99928 19.5 4.21847 19.5 4.49461C19.5 6.78447 19.5 14.3064 19.5 16.5963C19.5 16.8724 19.2749 17.09 18.9989
                      17.099C14.796 17.2364 13.1001 19.0998 12 20.5M12 6.90909L12 20.5
                  "
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="
                      M19.2353 6H21.5C21.7761 6 22 6.22386 22 6.5V19.539C22 19.9436 21.5233 20.2124 21.1535 20.0481C20.3584 19.6948 19.0315 19.2632 17.2941
                      19.2632C14.3529 19.2632 12 21 12 21C12 21 9.64706 19.2632 6.70588 19.2632C4.96845 19.2632 3.64156 19.6948 2.84647 20.0481C2.47668 20.2124 2
                      19.9436 2 19.539V6.5C2 6.22386 2.22386 6 2.5 6H4.76471
                  "
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className={cx("gm-tooltip")}>Смотреть правила</span>
                </button>

                <button
                  className={cx("btn gm-circle-btn")}
                  onClick={toggleFavourite}
                  disabled={favLoading || loadingGame || favouriteError}
                  aria-pressed={isFavourite}
                  title={
                    isFavourite
                      ? "Удалить из избранного"
                      : "Добавить в избранное"
                  }
                >
                  <svg
                    width="50"
                    height="50"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="
                      M12 6.00019C10.2006 3.90317 7.19377 3.2551 4.93923 5.17534C2.68468 7.09558 2.36727 10.3061 4.13778 12.5772C5.60984 14.4654 10.0648
                      18.4479 11.5249 19.7369C11.6882 19.8811 11.7699 19.9532 11.8652 19.9815C11.9483 20.0062 12.0393 20.0062 12.1225 19.9815C12.2178 19.9532
                      12.2994 19.8811 12.4628 19.7369C13.9229 18.4479 18.3778 14.4654 19.8499 12.5772C21.6204 10.3061 21.3417 7.07538 19.0484 5.17534C16.7551
                      3.2753 13.7994 3.90317 12 6.00019Z
                  "
                      fill={isFavourite ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className={cx("gm-tooltip")}>
                    {isFavourite
                      ? "Удалить из избранного"
                      : "Добавить в избранное"}
                  </span>
                </button>

                <button
                  className={cx("btn gm-circle-btn")}
                  onClick={() => router.push(`/games/ai/${gameData?.id}`)}
                  disabled={loadingGame || !gameData}
                  title="Задать вопрос"
                  aria-label="Задать вопрос"
                >
                  <svg
                    width="50"
                    height="50"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M21 15a2 2 0 0 1-2 2H8l-5 3V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7.5 9.5h9"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7.5 12.5h6"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className={cx("gm-tooltip")}>Задать вопрос</span>
                </button>
              </div>
            </div>

            <div className={cx("gm-right")}>
              <div className={cx("gm-description")} tabIndex={0}>
                {descriptionText}
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
const cx = bindClasses(style1, gridStyles);
