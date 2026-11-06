import { record, text } from "shared/lib/validation";
export interface AIModel {
  id: string;
  name: string;
}
export function parseModel(value: unknown): AIModel {
  const d = record(value);

  return {
    id: text(d.id),
    name: text(d.name),
  };
}
