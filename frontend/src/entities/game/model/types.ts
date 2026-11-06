import {
  list,
  nullableText,
  number,
  record,
  text,
} from "shared/lib/validation";
export type Id = string | number;
export interface Game {
  id: number;
  title: string;
  description: string;
  categories: string[];
  imageFileTitle: string | null;
  rulesFileTitle: string | null;
}
export interface GameInput {
  title: string;
  description: string;
  categories: string[];
  imageFile?: Blob;
  rulesFile?: Blob;
}
export interface Category {
  id: number;
  name: string;
  gamesCount: number;
}
export function parseGame(value: unknown): Game {
  const d = record(value);

  return {
    id: number(d.id),
    title: text(d.title),
    description: text(d.description ?? ""),
    categories: list(text)(d.categories),
    imageFileTitle: nullableText(d.imageFileTitle),
    rulesFileTitle: nullableText(d.rulesFileTitle),
  };
}
export function parseCategory(value: unknown): Category {
  const d = record(value);

  return {
    id: number(d.id),
    name: text(d.name),
    gamesCount: number(d.gamesCount),
  };
}
