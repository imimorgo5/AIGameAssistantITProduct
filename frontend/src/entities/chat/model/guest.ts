import { list, number, record, text } from "shared/lib/validation";

import type { Message } from "./types";

export const guestLimits = { questions: 5, input: 1000, history: 10 } as const;

export interface GuestStatus {
  remaining: number;
  limit: number;
  resetsAt: string;
  modelId?: string | null;
}

export interface GuestMessage {
  role: "user" | "assistant";
  text: string;
}

export function parseGuestStatus(value: unknown): GuestStatus {
  const d = record(value);
  return {
    remaining: number(d.remaining),
    limit: number(d.limit),
    resetsAt: text(d.resetsAt),
    modelId: d.modelId == null ? null : text(d.modelId),
  };
}

export function parseGuestHistory(value: unknown): Message[] {
  const messages = list((value) => {
    const d = record(value);
    const role = text(d.role);
    const content = text(d.text);
    if (!["user", "assistant"].includes(role) || content.length > 150000)
      throw new Error("Некорректная история");
    return {
      id: text(d.id),
      role,
      text: content,
      createdAt: text(d.createdAt),
    };
  })(value);
  if (messages.length > guestLimits.history)
    throw new Error("История слишком длинная");
  return messages;
}
