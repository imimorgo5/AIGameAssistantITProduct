import {
  boolean,
  nullableText,
  number,
  record,
  text,
} from "shared/lib/validation";
export interface User {
  id: number;
  email: string;
  login: string;
  isAdmin: boolean;
  imageFileTitle: string | null;
  model: string | null;
  isEnabled: boolean;
}
export interface Credentials {
  email: string;
  password: string;
}
export interface Registration extends Credentials {
  login: string;
}
export interface UserImageInput {
  imageFile?: Blob | null;
}
export function parseUser(value: unknown): User {
  const d = record(value);

  return {
    id: number(d.id),
    email: text(d.email),
    login: text(d.login),
    isAdmin: boolean(d.isAdmin),
    imageFileTitle: nullableText(d.imageFileTitle),
    model: nullableText(d.model),
    isEnabled: boolean(d.isEnabled),
  };
}
