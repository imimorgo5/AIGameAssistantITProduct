import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { useMediaQuery, useStableCallback } from "shared/lib/react";
import { bindClasses } from "shared/lib/styles";

import GameCard from "./GameCard";
import styles from "./TopCarousel.module.scss";

import type { Game } from "entities/game";

interface Props {
  items?: Game[];
  onOpenGame: (game: Game) => void;
}

export default function TopCarousel({ items = [], onOpenGame }: Props) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const small = useMediaQuery("(max-width: 549px)");
  const medium = useMediaQuery(
    "(max-width: 749px), (min-width: 900px) and (max-width: 1199px)",
  );
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const visibleCount = small ? 1 : medium ? 2 : 3;
  const pages = Math.max(1, Math.ceil(items.length / visibleCount));
  const [page, setPage] = useState(0);
  const destination = useRef<number | null>(null);
  const activePage = Math.min(page, pages - 1);

  const goTo = useStableCallback((nextPage: number) => {
    const container = viewport.current;
    const cards = track.current?.children;
    const target = cards?.item(nextPage * visibleCount);
    const first = cards?.item(0);
    if (
      !container ||
      !(target instanceof HTMLElement) ||
      !(first instanceof HTMLElement)
    )
      return;
    destination.current = nextPage;
    container.scrollTo({
      left: target.offsetLeft - first.offsetLeft,
      behavior: reducedMotion ? "instant" : "smooth",
    });
  });

  const move = useStableCallback((direction: number) => {
    const current = destination.current ?? activePage;
    goTo((current + direction + pages) % pages);
  });

  const synchronize = useStableCallback(() => {
    const container = viewport.current;
    const cards = track.current?.children;
    const first = cards?.item(0);
    const next = cards?.item(visibleCount);
    if (!container || !(first instanceof HTMLElement)) return;
    const maxScroll = Math.max(
      0,
      container.scrollWidth - container.clientWidth,
    );
    const step =
      next instanceof HTMLElement
        ? next.offsetLeft - first.offsetLeft
        : container.clientWidth;
    const current =
      maxScroll < 1
        ? 0
        : container.scrollLeft >= maxScroll - 2
          ? pages - 1
          : Math.round(container.scrollLeft / Math.max(1, step));
    setPage(Math.max(0, Math.min(pages - 1, current)));
  });

  useEffect(() => {
    const container = viewport.current;
    if (!container) return;
    const complete = () => {
      destination.current = null;
      synchronize();
    };
    const observer = new ResizeObserver(() => {
      destination.current = null;
      synchronize();
    });
    observer.observe(container);
    container.addEventListener("scrollend", complete);
    return () => {
      observer.disconnect();
      container.removeEventListener("scrollend", complete);
    };
  }, [synchronize, visibleCount, items.length]);

  useEffect(() => {
    if (pages <= 1 || reducedMotion) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") move(1);
    }, 5000);
    return () => clearInterval(timer);
  }, [pages, reducedMotion, move]);

  return (
    <section
      className={cx("top-carousel")}
      aria-label="Популярные игры"
      aria-roledescription="карусель"
    >
      <button
        type="button"
        className={cx("carousel-arrow")}
        onClick={() => move(-1)}
        disabled={pages <= 1}
        aria-label="Предыдущие игры"
      >
        <Image
          unoptimized
          width={24}
          height={24}
          src="/images/left-arrow.svg"
          alt=""
        />
      </button>
      <div
        className={cx("carousel-window")}
        ref={viewport}
        onScroll={synchronize}
        tabIndex={0}
        aria-label="Список популярных игр"
      >
        <div className={cx("carousel-track")} ref={track}>
          {items.map((game) => (
            <div key={game.id} className={cx("carousel-item")}>
              <GameCard game={game} onOpen={() => onOpenGame(game)} />
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        className={cx("carousel-arrow")}
        onClick={() => move(1)}
        disabled={pages <= 1}
        aria-label="Следующие игры"
      >
        <Image
          unoptimized
          width={24}
          height={24}
          src="/images/right-arrow.svg"
          alt=""
        />
      </button>
      <div className={cx("carousel-indicators")}>
        {Array.from({ length: pages }, (_, index) => (
          <button
            key={index}
            type="button"
            className={cx(`indicator ${index === activePage ? "active" : ""}`)}
            aria-label={`Страница игр ${index + 1}`}
            aria-current={index === activePage ? "page" : undefined}
            onClick={() => goTo(index)}
          />
        ))}
      </div>
    </section>
  );
}

const cx = bindClasses(styles);
