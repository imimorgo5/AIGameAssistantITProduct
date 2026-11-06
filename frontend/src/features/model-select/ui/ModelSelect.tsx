import { modelApi } from "entities/ai";
import { useEffect, useState } from "react";
import { SelectDropdown } from "shared/ui/select-dropdown";

import type { AIModel } from "entities/ai";

interface Props {
  value: string | null;
  onChange: (model: string) => void;
  disabled?: boolean;
}

export default function ModelSelect({
  value,
  onChange,
  disabled = false,
}: Props) {
  const [models, setModels] = useState<AIModel[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    modelApi
      .getAll()
      .then((items) => {
        if (active) setModels(items);
      })
      .catch(() => {
        if (active) setError("Не удалось загрузить список моделей");
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <SelectDropdown
        appearance="compact"
        items={models}
        disabled={disabled}
        value={models.find((model) => model.id === value) ?? null}
        onChange={(model) => {
          if (!disabled && model) onChange(model.id);
        }}
        allowNull={false}
        placeholder="Выберите модель"
        ariaLabel="Модель нейросети"
        labelFunc={(model) => model.name}
      />
      {error && <div role="alert">{error}</div>}
    </>
  );
}
