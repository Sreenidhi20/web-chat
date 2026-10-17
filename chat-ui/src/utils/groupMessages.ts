import type { DisplayMessage } from "../types/chat.ts";

export type MessageListItem =
  | { type: "date"; key: string; label: string }
  | { type: "group"; key: string; senderId: number; messages: DisplayMessage[] };

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${month}-${day}`;
}

function getDateKey(timestamp: string): string {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) {
    return "unknown-date";
  }
  return formatDateKey(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateLabel(dateKey: string, now: Date): string {
  if (dateKey === "unknown-date") {
    return "Unknown date";
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    dateKey ===
    formatDateKey(today.getFullYear(), today.getMonth(), today.getDate())
  ) {
    return "Today";
  }
  if (
    dateKey ===
    formatDateKey(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate(),
    )
  ) {
    return "Yesterday";
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(year, month, day));
}

export function groupMessages(
  messages: DisplayMessage[],
  now = new Date(),
): MessageListItem[] {
  const result: MessageListItem[] = [];
  let currentDateKey: string | null = null;
  let currentGroup: Extract<MessageListItem, { type: "group" }> | null = null;

  for (const message of messages) {
    const messageDateKey = getDateKey(message.sent_at);
    if (messageDateKey !== currentDateKey) {
      currentGroup = null;
      currentDateKey = messageDateKey;
      result.push({
        type: "date",
        key: `date:${messageDateKey}`,
        label: dateLabel(messageDateKey, now),
      });
    }

    if (
      currentGroup === null ||
      currentGroup.senderId !== message.sender_id
    ) {
      currentGroup = {
        type: "group",
        key: `messages:${message.id}`,
        senderId: message.sender_id,
        messages: [],
      };
      result.push(currentGroup);
    }
    currentGroup.messages.push(message);
  }

  return result;
}
