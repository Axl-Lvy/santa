import { getLastRead } from "./activity";
import type { Db } from "./db";
import { groupMessagesFromOthersSince } from "./group-messages";
import type { Participant } from "./participants";

export type UnreadCounts = { group: number; santa: number; giftee: number; ideas: number };

export function unreadCounts(db: Db, me: Participant): UnreadCounts {
  const group = groupMessagesFromOthersSince(db, me.id, getLastRead(db, me.id, "group")).length;
  return { group, santa: 0, giftee: 0, ideas: 0 };
}
