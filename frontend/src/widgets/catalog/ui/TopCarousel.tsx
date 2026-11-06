import { useEffect, useMemo, useRef, useState } from "react";
import leftArrow from "shared/assets/left-arrow.svg";
import rightArrow from "shared/assets/right-arrow.svg";
import { useStableCallback } from "shared/lib/react";
import { bindClasses } from "shared/lib/styles";

import GameCard from "./GameCard";
import style0 from "./TopCarousel.module.scss";

import type { Game } from "entities/game";

interface Props {
  items?: Game[];
  onOpenGame: (game: Game) => void;
}

export default function TopCarousel({ items = [], onOpenGame }: Props) {
  const [index, setIndex] = useState(0);
  const [pageNumber, setPageNumber] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const visibleCount = useResponsiveCount();
  const length = items.length || 0;
  const pages = Math.max(1, Math.ceil(length / visibleCount));
  const [animating, setAnimating] = useState(false);
  const animDirectionRef = useRef(1);
  const [buffer, setBuffer] = useState<Game[]>([]);
  const [translatePx, setTranslatePx] = useState(0);
  const gap = 20;
  const [itemWidth, setItemWidth] = useState(0);
  const TRANS_MS = 1000;
  const FINISH_PAD = 70;
  const animTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef(index);
  const animatingRef = useRef(animating);
  useEffect(() => {
    indexRef.current = index;
  }, [index]);
  useEffect(() => {
    animatingRef.current = animating;
  }, [animating]);
  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState === "visible") {
        if (!trackRef.current) return;

        if (!animatingRef.current) return;

        if (animTimeoutRef.current) {
          clearTimeout(animTimeoutRef.current);
          animTimeoutRef.current = null;
        }

        const currIndex = indexRef.current;
        const nextIndex = mod(
          currIndex + animDirectionRef.current * visibleCount,
          length,
        );

        setAnimating(false);
        setBuffer(buildDisplay(nextIndex, visibleCount, items));
        setTranslatePx(0);
        setIndex(nextIndex);
      }
    };

    document.addEventListener("visibilitychange", handleVisible);
    window.addEventListener("focus", handleVisible);

    return () => {
      document.removeEventListener("visibilitychange", handleVisible);
      window.removeEventListener("focus", handleVisible);
    };
  }, [visibleCount, items, length]);
  useEffect(() => {
    setBuffer(buildDisplay(index, visibleCount, items));
    setTranslatePx(0);
  }, [index, visibleCount, items]);
  useEffect(() => {
    if (!windowRef.current) return;

    const ro = new ResizeObserver(() => recalcItemWidth());
    ro.observe(windowRef.current);
    recalcItemWidth();
    window.addEventListener("resize", recalcItemWidth);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recalcItemWidth);
    };

    function recalcItemWidth() {
      const win = windowRef.current;
      if (!win) return;

      const totalGap = gap * (visibleCount - 1);
      const w = Math.max(0, win.clientWidth - 10 - totalGap);
      const per = Math.floor(w / visibleCount);
      setItemWidth(per);
    }
  }, [visibleCount]);
  useEffect(() => {
    return () => {
      if (animTimeoutRef.current) {
        clearTimeout(animTimeoutRef.current);
        animTimeoutRef.current = null;
      }

      if (autoTimerRef.current) {
        clearInterval(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    };
  }, []);
  const finalizeAnimation = (nextIndex: number) => {
    setAnimating(false);
    setBuffer(buildDisplay(nextIndex, visibleCount, items));
    setTranslatePx(0);
    setIndex(nextIndex);
  };

  const triggerGo = useStableCallback((dir: number) => {
    if (animating) return;

    if (length <= visibleCount) return;

    if (!itemWidth || itemWidth <= 0) return;

    animDirectionRef.current = dir;
    const nextIndex = mod(index + dir * visibleCount, length);
    const prevIndex = mod(index - visibleCount, length);
    const current = buildDisplay(index, visibleCount, items);
    const next = buildDisplay(nextIndex, visibleCount, items);
    const prev = buildDisplay(prevIndex, visibleCount, items);
    const rawStep = (itemWidth + gap) * visibleCount;
    const step = Math.round(rawStep);
    let combined: Game[], initialTranslate: number, targetTranslate: number;
    if (dir === 1) {
      combined = [...current, ...next];
      initialTranslate = 0;
      targetTranslate = -step;
    } else {
      combined = [...prev, ...current];
      initialTranslate = -step;
      targetTranslate = 0;
    }

    setPageNumber((p) => (p + pages + dir) % pages);
    if (animTimeoutRef.current) {
      clearTimeout(animTimeoutRef.current);
      animTimeoutRef.current = null;
    }

    setBuffer(combined);
    setTranslatePx(initialTranslate);
    setAnimating(false);
    requestAnimationFrame(() => {
      if (trackRef.current) trackRef.current.getBoundingClientRect();

      setAnimating(true);
      requestAnimationFrame(() => {
        setTranslatePx(targetTranslate);
      });
    });
    animTimeoutRef.current = setTimeout(() => {
      animTimeoutRef.current = null;
      finalizeAnimation(nextIndex);
    }, TRANS_MS + FINISH_PAD);
  });

  useEffect(() => {
    if (autoTimerRef.current) {
      clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    }

    if (length <= visibleCount) return;

    if (!itemWidth || itemWidth <= 0) return;

    autoTimerRef.current = setInterval(() => {
      if (!animating) triggerGo(1);
    }, 3000);

    return () => {
      if (autoTimerRef.current) {
        clearInterval(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    };
  }, [visibleCount, length, animating, itemWidth, triggerGo]);
  const go = (dir: number) => {
    triggerGo(dir);
  };

  const display = useMemo(() => {
    if (animating) return buffer.slice(0, visibleCount * 2);

    return buildDisplay(index, visibleCount, items);
  }, [animating, buffer, index, visibleCount, items]);

  return (
    <div className={cx("top-carousel")} ref={rootRef}>
      <img
        className={cx("carousel-arrow")}
        onClick={() => go(-1)}
        aria-label="Previous"
        src={leftArrow}
        alt="left"
      />
      <div className={cx("carousel-window")} ref={windowRef}>
        <div
          className={cx("carousel-track")}
          ref={trackRef}
          style={{
            transform: `translate3d(${translatePx}px,0,0)`,
            transition: animating
              ? `transform ${TRANS_MS}ms cubic-bezier(.2,.9,.2,1)`
              : "none",
            gap: `${gap}px`,
          }}
        >
          {display.map((g, idx) => (
            <div
              key={g.id + "-" + idx}
              className={cx("carousel-item")}
              style={{
                flex: `0 0 ${itemWidth}px`,
                width: `${itemWidth}px`,
                height: `${itemWidth}px`,
              }}
            >
              <GameCard game={g} onOpen={() => onOpenGame(g)} />
            </div>
          ))}
        </div>
      </div>
      <img
        className={cx("carousel-arrow")}
        onClick={() => go(1)}
        aria-label="Next"
        src={rightArrow}
        alt="right"
      />

      <div className={cx("carousel-indicators")}>
        {Array.from({
          length: pages,
        }).map((_, i) => (
          <div
            key={i}
            className={cx(`indicator ${i === pageNumber ? "active" : ""}`)}
          />
        ))}
      </div>
    </div>
  );
}

function useResponsiveCount() {
  const [count, setCount] = useState(calc());
  useEffect(() => {
    const onR = () => setCount(calc());
    window.addEventListener("resize", onR);

    return () => window.removeEventListener("resize", onR);
  }, []);

  return count;

  function calc() {
    const w = window.innerWidth;
    if (w < 550) return 1;

    if ((w < 1200 && w > 899) || w < 750) return 2;

    return 3;
  }
}

const cx = bindClasses(style0);

function buildDisplay(startIdx: number, count: number, arr: Game[]) {
  const out: Game[] = [];
  const n = arr.length || 0;
  if (!n) return out;

  for (let i = 0; i < Math.min(count, n); i++) {
    const idx = mod(startIdx + i, n);
    const it = arr[idx];
    if (it) out.push(it);
  }

  return out;
}

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}
