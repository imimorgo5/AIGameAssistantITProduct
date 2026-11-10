import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { bindClasses } from "shared/lib/styles";

import style0 from "./Header.module.scss";
import UserMenu from "./UserMenu";

import type { User } from "entities/session";

const logo = "/images/LOGO.svg";
const searchIcon = "/images/search-icon.svg";

interface Props {
  appearance?: "catalog" | "plain";
  search?: string | null;
  onSearchChange?: (value: string) => void;
  currentUser?: User | null;
  centralTitle?: string;
}

export default function Header({
  appearance = "plain",
  search = null,
  onSearchChange,
  currentUser,
  centralTitle,
}: Props) {
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const handleScroll = () => {
    const heroAnchor =
      document.querySelector<HTMLElement>("[data-hero-anchor]");

    const heroAnchorBottom = heroAnchor
      ? heroAnchor.offsetTop + heroAnchor.offsetHeight
      : 0;

    setScrolledPastHero(window.scrollY > heroAnchorBottom);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cx(
        `site-header ${appearance} ${scrolledPastHero ? "scrolled-past-hero" : ""}`,
      )}
    >
      <div className={cx(`header-inner ${centralTitle ? "title-layout" : ""}`)}>
        <div className={cx("header-left")}>
          <Link href="/" className={cx("logo")}>
            <Image
              unoptimized
              width={112}
              height={42}
              src={logo}
              alt="AIGameAssistant"
            />
          </Link>
        </div>

        <div className={cx("header-center")}>
          {search !== null && (
            <div className={cx("search-wrap")}>
              <input
                type="text"
                aria-label="Поиск игр"
                maxLength={100}
                className={cx("search-input")}
                value={search}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
              <span className={cx("search-icon")} aria-hidden="true">
                <Image
                  unoptimized
                  width={20}
                  height={20}
                  src={searchIcon}
                  alt="Поиск"
                />
              </span>
            </div>
          )}
          {centralTitle && (
            <h1 className={cx("header-title")}>{centralTitle}</h1>
          )}
        </div>

        <div className={cx("header-right")}>
          <UserMenu currentUser={currentUser ?? null} />
        </div>
      </div>

      {(search !== null || centralTitle) && (
        <div className={cx("header-center header-mobile")}>
          {search !== null ? (
            <div className={cx("search-wrap")}>
              <input
                type="text"
                aria-label="Поиск игр"
                maxLength={100}
                className={cx("search-input")}
                value={search}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
              <span className={cx("search-icon")} aria-hidden="true">
                <Image
                  unoptimized
                  width={20}
                  height={20}
                  src={searchIcon}
                  alt="Поиск"
                />
              </span>
            </div>
          ) : (
            <h1 className={cx("header-title")}>{centralTitle}</h1>
          )}
        </div>
      )}
    </header>
  );
}
const cx = bindClasses(style0);
