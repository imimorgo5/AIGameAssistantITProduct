import { useEffect, useId, useRef, useState } from "react";
import { bindClasses } from "shared/lib/styles";

import styles from "./SelectDropdown.module.scss";

type Item =
  | string
  | {
    id: string | number;
    name?: string;
    title?: string;
  };

interface BaseProps<T> {
  appearance?: "field" | "filter" | "wide" | "compact";
  disabled?: boolean;
  items?: T[] | null;
  fetchItems?: (() => T[] | Promise<T[]>) | null;
  allowNull?: boolean;
  placeholder?: string;
  labelFunc?: (item: T) => string;
  ariaLabel?: string;
  maxSelections?: number;
}

type Props<T> = BaseProps<T> &
  (
    | {
      multiple: true;
      value: T[];
      onChange: (value: T[]) => void;
    }
    | {
      multiple?: false;
      value: T | null;
      onChange: (value: T | null) => void;
    }
  );

const cx = bindClasses(styles);
const keyOf = (item: Item) => (typeof item === "string" ? item : item.id);
export default function SelectDropdown<T extends Item>(props: Props<T>) {
  const {
    disabled = false,
    items,
    fetchItems,
    allowNull = true,
    placeholder = "Выбрать",
    labelFunc = String,
    ariaLabel = "Выбор",
    maxSelections = Infinity,
  } = props;

  const [open, setOpen] = useState(false);
  const [list, setList] = useState<T[]>(items ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const fetchRef = useRef(fetchItems);
  const id = useId();
  useEffect(() => {
    fetchRef.current = fetchItems;
  }, [fetchItems]);
  useEffect(() => {
    if (items) {
      setList(items);

      return;
    }

    if (!open) {
      setLoading(false);

      return;
    }

    let cancelled = false;
    const fetcher = fetchRef.current;
    if (!fetcher) return;

    setLoading(true);
    setError(false);
    Promise.resolve()
      .then(fetcher)
      .then((result) => {
        if (!cancelled) setList(result);
      })
      .catch(() => {
        if (!cancelled) {
          setList([]);
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [items, open]);
  useEffect(() => {
    const outside = (event: MouseEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        setOpen(false);
    };

    document.addEventListener("mousedown", outside);

    return () => document.removeEventListener("mousedown", outside);
  }, []);
  const selected = props.multiple
    ? props.value
    : props.value === null
      ? []
      : [props.value];

  const isSelected = (item: T) =>
    selected.some((value) => keyOf(value) === keyOf(item));

  const select = (item: T) => {
    if (props.multiple) {
      const next = props.value.filter((value) => keyOf(value) !== keyOf(item));
      if (isSelected(item)) props.onChange(next);
      else if (next.length < maxSelections) props.onChange([...next, item]);
    } else {
      props.onChange(item);
      setOpen(false);
      trigger.current?.focus();
    }
  };

  const display = selected.length
    ? selected.map(labelFunc).join(", ")
    : placeholder;

  const sorted = [...list].sort((a, b) =>
    labelFunc(a).localeCompare(labelFunc(b), "ru", {
      numeric: true,
      sensitivity: "base",
    }),
  );

  return (
    <div
      data-appearance={props.appearance}
      className={cx("seldd-root")}
      ref={root}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setOpen(false);
          trigger.current?.focus();
        }

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          if (!open) {
            setOpen(true);

            return;
          }

          const options = Array.from(
            root.current?.querySelectorAll<HTMLElement>('[role="option"]') ??
              [],
          );

          const index = options.findIndex(
            (option) => option === document.activeElement,
          );

          options[
            (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) %
              options.length
          ]?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-controls={id}
        aria-expanded={open}
        className={cx(
          `seldd-button ${open ? "open" : ""} ${selected.length ? "" : "unset"}`,
        )}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={cx("seldd-label")} title={display}>
          {loading ? "Загрузка..." : display}
        </span>
        <span className={cx("seldd-arrow")} aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d={open ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      {open && (
        <ul
          id={id}
          role="listbox"
          aria-label={ariaLabel}
          aria-multiselectable={props.multiple || undefined}
          className={cx("seldd-list")}
        >
          {allowNull && (
            <li
              role="option"
              aria-selected={!selected.length}
              tabIndex={0}
              className={cx(`seldd-item ${selected.length ? "" : "selected"}`)}
              onClick={() => {
                if (props.multiple) props.onChange([]);
                else {
                  props.onChange(null);
                  setOpen(false);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.currentTarget.click();
                }
              }}
            >
              {props.multiple ? "Очистить" : "—"}
            </li>
          )}
          {error && (
            <li role="presentation" className={cx("seldd-item disabled")}>
              Не удалось загрузить список
            </li>
          )}
          {!error && !sorted.length && (
            <li role="presentation" className={cx("seldd-item disabled")}>
              {loading ? "Загрузка..." : "Пусто"}
            </li>
          )}
          {sorted.map((item) => (
            <li
              key={keyOf(item)}
              role="option"
              aria-selected={isSelected(item)}
              tabIndex={0}
              className={cx(
                `seldd-item ${isSelected(item) ? "selected" : ""} ${props.multiple && !isSelected(item) && selected.length >= maxSelections ? "disabled" : ""}`,
              )}
              onClick={() => select(item)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  select(item);
                }
              }}
            >
              {props.multiple && (
                <input
                  type="checkbox"
                  readOnly
                  tabIndex={-1}
                  checked={isSelected(item)}
                  aria-label={labelFunc(item)}
                />
              )}
              <span className={cx("seldd-item-label")}>{labelFunc(item)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
