import { bindClasses } from "shared/lib/styles";

import style0 from "./ToggleSlider.module.scss";

interface Props {
  appearance?: "contained" | "outlined";
  leftLabel: string;
  rightLabel: string;
  value?: boolean;
  onChange?: (value: boolean) => void;
}

export default function ToggleSlider({
  appearance = "contained",
  leftLabel,
  rightLabel,
  value = false,
  onChange = () => {},
}: Props) {
  const switchTo = (v: boolean) => {
    if (v === value) return;

    onChange(v);
  };

  return (
    <div
      className={cx(`ts-tabs ${appearance}`)}
      role="tablist"
      aria-label="Переключатель режимов"
    >
      <button
        role="tab"
        aria-selected={value}
        className={cx(`ts-tab ${value ? "active" : ""}`)}
        onClick={() => switchTo(true)}
        type="button"
      >
        {leftLabel}
      </button>
      <button
        role="tab"
        aria-selected={!value}
        className={cx(`ts-tab ${!value ? "active" : ""}`)}
        onClick={() => switchTo(false)}
        type="button"
      >
        {rightLabel}
      </button>

      <div
        className={cx(`ts-tab-slider ${!value ? "right" : ""}`)}
        aria-hidden="true"
      />
    </div>
  );
}
const cx = bindClasses(style0);
