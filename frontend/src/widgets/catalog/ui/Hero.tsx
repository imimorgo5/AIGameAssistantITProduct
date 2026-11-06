import { bindClasses } from "shared/lib/styles";

import style0 from "./Hero.module.scss";
import TopCarousel from "./TopCarousel";

import type { Game } from "entities/game";

interface Props {
  topGames?: Game[];
  onOpenGame: (game: Game) => void;
}

export default function Hero({ topGames = [], onOpenGame }: Props) {
  return (
    <section className={cx("hero-root")}>
      <div className={cx("hero-bg")} />
      <div className={cx("hero-inner")}>
        <div className={cx("hero-left")}>
          <h2 className={cx("hero-title")}>ПРОВЕДИТЕ ВЕЧЕР С КОМФОРТОМ</h2>
        </div>
        <div className={cx("hero-right")}>
          <div className={cx("top-label")}>ТОП-10</div>
          <TopCarousel items={topGames} onOpenGame={onOpenGame} />
        </div>
      </div>
    </section>
  );
}
const cx = bindClasses(style0);
