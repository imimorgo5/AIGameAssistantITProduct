import { boolean, number, record, text } from "shared/lib/validation";
export interface AIModel {
  id: string;
  name: string;
}
export interface CatalogModel extends AIModel {
  maxOutputTokens: number;
  inputPricePerMillion?: number | null;
  outputPricePerMillion?: number | null;
}
export interface ManagedModel extends AIModel {
  remoteId: string;
  enabled: boolean;
  maxOutputTokens: number;
}

export interface ModelRegistry {
  models: ManagedModel[];
  defaultModel: string | null;
}

export interface ModelInput {
  remoteId: string;
  name: string;
  maxOutputTokens: number;
}

export function modelNameError(value: string): string {
  if (!value.trim()) return "Обязательное поле";
  return value.length > 100 ? "Максимум 100 символов" : "";
}

export function remoteIdError(value: string): string {
  return value.length <= 200 &&
    /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.:/-]+$/.test(value)
    ? ""
    : "Выберите модель из каталога OpenRouter";
}

export function tokenLimitError(value: string): string {
  const count = Number(value);
  return /^\d{1,5}$/.test(value) &&
    Number.isInteger(count) &&
    count >= 256 &&
    count <= 32768
    ? ""
    : "Укажите целое число от 256 до 32768";
}

export function parseManagedModel(value: unknown): ManagedModel {
  const d = record(value);
  return {
    ...parseModel(d),
    remoteId: text(d.remoteId),
    enabled: boolean(d.enabled),
    maxOutputTokens: number(d.maxOutputTokens),
  };
}

export function parseCatalogModel(value: unknown): CatalogModel {
  const d = record(value);
  return {
    ...parseModel(d),
    maxOutputTokens: number(d.maxOutputTokens),
    inputPricePerMillion:
      d.inputPricePerMillion == null ? null : number(d.inputPricePerMillion),
    outputPricePerMillion:
      d.outputPricePerMillion == null ? null : number(d.outputPricePerMillion),
  };
}

export function parseModelRegistry(value: unknown): ModelRegistry {
  const d = record(value);
  if (!Array.isArray(d.models)) throw new Error("Некорректный список моделей");
  return {
    models: d.models.map(parseManagedModel),
    defaultModel: d.defaultModel === null ? null : text(d.defaultModel),
  };
}
export function parseModel(value: unknown): AIModel {
  const d = record(value);

  return {
    id: text(d.id),
    name: text(d.name),
  };
}
