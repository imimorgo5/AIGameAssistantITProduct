import Image from "next/image";

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
  const { url, loading: blobLoading } = useBlobUrl(
    fileApi.getImageBlob,
    game.imageFileTitle,
  );

  const imageUrl = imageBlobUrl || url;
  const loading = !imageBlobUrl && blobLoading;

  return (
    <button type="button" className={cx("tile-card")} onClick={onOpen}>
      <span className={cx("tile-media")}>
        {loading && <span className={cx("tile-empty")}>Загрузка...</span>}
        {imageUrl ? (
          <Image
            unoptimized
            width={512}
            height={512}
            src={imageUrl}
            alt={game.title}
            className={cx("tile-img")}
          />
        ) : (
          <span className={cx("tile-empty")}>Не удалось загрузить</span>
        )}
        <span className={cx("tile-overlay")}>
          <span className={cx("tile-desc")}>{game.description}</span>
        </span>
        <span className={cx("tile-title-strip")}>
          <span className={cx("tile-title")}>{game.title}</span>
        </span>
      </span>
    </button>
  );
}
const cx = bindClasses(style0);
