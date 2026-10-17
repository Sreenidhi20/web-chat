import { describe, expect, it } from "vitest";
import { groupMessages } from "./groupMessages.ts";
import type { DisplayMessage } from "../types/chat.ts";

function message(
  id: number,
  senderId: number,
  sentAt: Date,
): DisplayMessage {
  return {
    id,
    sender_id: senderId,
    receiver_id: senderId === 1 ? 2 : 1,
    content: `message ${id}`,
    sent_at: sentAt.toISOString(),
  };
}

describe("groupMessages", () => {
  it("returns no list items for an empty conversation", () => {
    expect(groupMessages([])).toEqual([]);
  });

  it("groups adjacent senders and inserts local-day dividers", () => {
    const now = new Date(2026, 9, 17, 12);
    const messages = [
      message(1, 1, new Date(2026, 9, 17, 9)),
      message(2, 1, new Date(2026, 9, 17, 9, 1)),
      message(3, 2, new Date(2026, 9, 17, 9, 2)),
      message(4, 1, new Date(2026, 9, 16, 23, 59)),
    ];

    expect(groupMessages(messages, now)).toMatchObject([
      { type: "date", label: "Today" },
      { type: "group", senderId: 1, messages: [{ id: 1 }, { id: 2 }] },
      { type: "group", senderId: 2, messages: [{ id: 3 }] },
      { type: "date", label: "Yesterday" },
      { type: "group", senderId: 1, messages: [{ id: 4 }] },
    ]);
  });
});
