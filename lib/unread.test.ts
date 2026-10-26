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

describe("unreadCounts after the draw", () => {
  it("counts the Santa thread, the giftee thread and ideas for the giftee", async () => {
    const { saveAssignment, resetAssignmentCache } = await import("./assignment");
    const { postAnon } = await import("./anon-messages");
    const { addIdea } = await import("./ideas");
    const db = testDb();
    const [a, b, c] = seedParticipants(db, ["A", "B", "C"]).map((p) => getParticipant(db, p.id)!);
    saveAssignment(
      db,
      new Map([
        [a.id, b.id],
        [b.id, c.id],
        [c.id, a.id],
      ]),
    );
    db.prepare("UPDATE event SET drawn_at = '2026-12-01T10:00:00Z'").run();
    setNow(new Date("2026-12-01T10:00:00Z"));
    postAnon(db, c, "giftee", "de mon Père Noël");
    postAnon(db, b, "santa", "de ma mission");
    addIdea(db, c.id, b.id, "idée pour ma mission");
    addIdea(db, a.id, b.id, "mon idée à moi");
    expect(unreadCounts(db, a)).toEqual({ group: 0, santa: 1, giftee: 1, ideas: 1 });
    markRead(db, a.id, "santa", new Date("2026-12-01T10:05:00Z"));
    markRead(db, a.id, "ideas", new Date("2026-12-01T10:05:00Z"));
    expect(unreadCounts(db, a)).toEqual({ group: 0, santa: 0, giftee: 1, ideas: 0 });
    resetAssignmentCache();
  });
});
