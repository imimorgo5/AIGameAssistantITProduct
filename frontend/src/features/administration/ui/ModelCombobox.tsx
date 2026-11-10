import { useEffect, useId, useRef, useState } from "react";

import { bindClasses } from "shared/lib/styles";

import styles from "./ModelCombobox.module.scss";

import type { CatalogModel } from "entities/ai";

interface Props {
  items: CatalogModel[];
  value: CatalogModel | null;
  disabled: boolean;
  loading: boolean;
  error: string;
  onChange: (model: CatalogModel | null) => void;
  onBlur: () => void;
}

export default function ModelCombobox({
  items,
  value,
  disabled,
  loading,
  error,
  onChange,
  onBlur,
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();
  const filtered = items.filter((model) =>
    `${model.name} ${model.id}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const expanded = open && !disabled;
  useEffect(() => {
    const panel = menu.current;
    const field = input.current;
    if (!panel || !field || !expanded) return;
    const position = () => {
      const rect = field.getBoundingClientRect();
      const viewportHeight =
        window.visualViewport?.height ?? window.innerHeight;
      const below = viewportHeight - rect.bottom - 12;
      const above = rect.top - 12;
      const upwards = below < 160 && above > below;
      const height = Math.max(0, Math.min(220, upwards ? above : below));
      panel.style.width = `${rect.width}px`;
      panel.style.left = `${rect.left}px`;
      panel.style.maxHeight = `${height}px`;
      panel.style.top = `${upwards ? rect.top - 6 : rect.bottom + 6}px`;
      panel.style.transform = upwards ? "translateY(-100%)" : "none";
    };
    position();
    panel.showPopover();
    position();
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !panel.contains(event.target) &&
        !field.contains(event.target)
      )
        setOpen(false);
    };
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    window.visualViewport?.addEventListener("resize", position);
    document.addEventListener("pointerdown", outside);
    return () => {
      if (panel.isConnected && panel.matches(":popover-open"))
        panel.hidePopover();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
      window.visualViewport?.removeEventListener("resize", position);
      document.removeEventListener("pointerdown", outside);
    };
  }, [expanded]);
  useEffect(() => {
    const option = document.getElementById(`${id}-option-${active}`);
    const panel = menu.current;
    if (expanded && panel && option) {
      if (option.offsetTop < panel.scrollTop)
        panel.scrollTop = option.offsetTop;
      else if (
        option.offsetTop + option.offsetHeight >
        panel.scrollTop + panel.clientHeight
      )
        panel.scrollTop =
          option.offsetTop + option.offsetHeight - panel.clientHeight;
    }
  }, [active, expanded, id]);
  const choose = (model: CatalogModel) => {
    onChange(model);
    setQuery("");
    setOpen(false);
    input.current?.focus();
  };
  return (
    <div className={cx("combobox")}>
      <input
        ref={input}
        className={cx("input")}
        role="combobox"
        aria-label="Модель OpenRouter"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={`${id}-list`}
        aria-activedescendant={
          expanded && filtered[active] ? `${id}-option-${active}` : undefined
        }
        aria-invalid={!!error}
        aria-describedby={error ? "model-catalog-error" : undefined}
        disabled={disabled}
        maxLength={256}
        autoComplete="off"
        placeholder={
          loading ? "Загрузка каталога..." : "Название или ID OpenRouter"
        }
        value={open ? query : (value?.name ?? query)}
        onClick={() => {
          if (!open) {
            setQuery("");
            setActive(0);
            setOpen(true);
          }
        }}
        onFocus={() => {
          setQuery("");
          setActive(0);
          setOpen(true);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
          if (value) onChange(null);
        }}
        onBlur={() => {
          setOpen(false);
          onBlur();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && expanded) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!expanded) {
              setQuery("");
              setOpen(true);
              setActive(0);
            } else
              setActive(
                (index) =>
                  (index +
                    (event.key === "ArrowDown" ? 1 : -1) +
                    filtered.length) %
                  Math.max(1, filtered.length),
              );
          }
          if (event.key === "Enter" && expanded) {
            event.preventDefault();
            const model = filtered[active];
            if (model) choose(model);
          }
        }}
      />
      <div
        ref={menu}
        popover="manual"
        id={`${id}-list`}
        role="listbox"
        aria-label="Модели OpenRouter"
        className={cx("list")}
      >
        {filtered.length === 0 && (
          <div className={cx("empty")} role="status">
            Модели не найдены
          </div>
        )}
        {filtered.map((model, index) => (
          <div
            key={model.id}
            id={`${id}-option-${index}`}
            role="option"
            aria-label={model.name}
            aria-describedby={`${id}-price-${index}`}
            aria-selected={model.id === value?.id}
            data-active={index === active}
            className={cx("option")}
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => choose(model)}
          >
            <span>{model.name}</span>
            <span className={cx("identifier")}>{model.id}</span>
            <span id={`${id}-price-${index}`} className={cx("price")}>
              Ввод: {formatPrice(model.inputPricePerMillion)} · Вывод:{" "}
              {formatPrice(model.outputPricePerMillion)} за 1 млн токенов
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
const cx = bindClasses(styles);

const priceFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 8,
});

function formatPrice(value: number | null | undefined): string {
  return value == null || value < 0
    ? "нет данных"
    : priceFormatter.format(value);
}
