import { useEffect, useState } from "react";
import { fileApi } from "shared/api/file";
import { bindClasses } from "shared/lib/styles";
import { useBlobUrl } from "shared/lib/useBlobUrl";

import style0 from "./GameCard.module.scss";

import type { Game } from "entities/game";

interface Props {
  game: Game;
  onOpen?: () => void;
  imageBlobUrl?: string | null;
}

export default function GameCard({
  game,
  onOpen = () => {},
  imageBlobUrl = null,
}: Props) {
  const [imageUrl, setImageUrl] = useState(imageBlobUrl || null);
  const [loading, setLoading] = useState(
    Boolean(game.imageFileTitle && !imageBlobUrl),
  );

  const { url, loading: blobLoading } = useBlobUrl(
    fileApi.getImageBlob,
    game.imageFileTitle,
  );

  useEffect(() => {
    if (imageBlobUrl) {
      setImageUrl(imageBlobUrl);
      setLoading(false);

      return;
    }

    setImageUrl(url);
    setLoading(Boolean(blobLoading));
  }, [url, blobLoading, imageBlobUrl]);

  return (
    <div
      className={cx("tile-card")}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
    >
      <div className={cx("tile-media")}>
        {loading && <div className={cx("tile-empty")}>Загрузка...</div>}
        {imageUrl ? (
          <img src={imageUrl} alt={game.title} className={cx("tile-img")} />
        ) : (
          <div className={cx("tile-empty")}>Не удалось загрузить</div>
        )}
        <div className={cx("tile-overlay")}>
          <div className={cx("tile-desc")}>{game.description}</div>
        </div>
        <div className={cx("tile-title-strip")}>
          <div className={cx("tile-title")}>{game.title}</div>
        </div>
      </div>
    </div>
  );
}
const cx = bindClasses(style0);
