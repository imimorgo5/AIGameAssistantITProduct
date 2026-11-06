import { list, number, record, text } from "shared/lib/validation";
export interface ChatPreview {
  id: number;
  gameId: number;
  title: string;
  lastUseTime: string;
  gameTitle?: string;
}

interface ChatMessageDTO {
  role: string;
  text: string;
  timestamp: string;
}

export interface Chat {
  id: number;
  title: string;
  lastUseTime: string;
  messageDTOs: ChatMessageDTO[];
}
export interface Session {
  id: string;
  title: string;
  lastUseTime: string;
  createdAt: string;
  _temp?: boolean;
  _loading?: boolean;
}
export interface Message {
  id: string;
  role: string;
  text: string;
  createdAt: string;
  _temp?: boolean;
  _streaming?: boolean;
  _error?: boolean;
}
export function parseChatPreview(value: unknown): ChatPreview {
  const d = record(value);

  return {
    id: number(d.id),
    gameId: number(d.gameId),
    title: text(d.title),
    lastUseTime: text(d.lastUseTime),
  };
}
export function parseChat(value: unknown): Chat {
  const d = record(value);

  return {
    id: number(d.id),
    title: text(d.title),
    lastUseTime: text(d.lastUseTime),
    messageDTOs: list((value) => {
      const m = record(value);

      return {
        role: text(m.role),
        text: text(m.text),
        timestamp: text(m.timestamp),
      };
    })(d.messageDTOs),
  };
}
