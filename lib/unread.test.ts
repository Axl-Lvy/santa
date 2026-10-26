import { seedParticipants, testDb } from "@/test-utils/db";

import { markRead } from "./activity";
import { postGroupMessage } from "./group-messages";
import { getParticipant } from "./participants";
import { setNow } from "./time";
import { unreadCounts } from "./unread";

afterEach(() => setNow(null));

describe("unreadCounts", () => {
  it("counts group messages by others after the last read", () => {
    const db = testDb();
    const [a, b] = seedParticipants(db, ["Léon", "Mamie"]);
    const me = getParticipant(db, a.id)!;
    const other = getParticipant(db, b.id)!;
    setNow(new Date("2026-12-01T10:00:00Z"));
    postGroupMessage(db, other, "1");
    setNow(new Date("2026-12-01T10:01:00Z"));
    postGroupMessage(db, other, "2");
    markRead(db, me.id, "group", new Date("2026-12-01T10:01:30Z"));
    setNow(new Date("2026-12-01T10:02:00Z"));
    postGroupMessage(db, other, "3");
    postGroupMessage(db, me, "moi");
    expect(unreadCounts(db, me)).toEqual({ group: 1, santa: 0, giftee: 0, ideas: 0 });
  });
});
