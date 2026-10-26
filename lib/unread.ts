import { getLastRead } from "./activity";
import { listAnonThread } from "./anon-messages";
import { gifteeOf } from "./assignment";
import type { Db } from "./db";
import { groupMessagesFromOthersSince } from "./group-messages";
import { listIdeasForTarget } from "./ideas";
import type { Participant } from "./participants";

export type UnreadCounts = { group: number; santa: number; giftee: number; ideas: number };

const after = (iso: string, since: Date | null) => since === null || new Date(iso) > since;

export function unreadCounts(db: Db, me: Participant): UnreadCounts {
  const group = groupMessagesFromOthersSince(db, me.id, getLastRead(db, me.id, "group")).length;
  const giftee = gifteeOf(db, me.id);
  if (giftee === null) return { group, santa: 0, giftee: 0, ideas: 0 };

  const santaRead = getLastRead(db, me.id, "santa");
  const gifteeRead = getLastRead(db, me.id, "giftee");
  const ideasRead = getLastRead(db, me.id, "ideas");
  return {
    group,
    santa: listAnonThread(db, me.id).filter((m) => m.direction === "from_santa" && after(m.createdAt, santaRead)).length,
    giftee: listAnonThread(db, giftee).filter((m) => m.direction === "from_giftee" && after(m.createdAt, gifteeRead)).length,
    ideas: listIdeasForTarget(db, giftee).filter((i) => i.authorId !== me.id && after(i.updatedAt, ideasRead)).length,
  };
}
