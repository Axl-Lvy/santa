import { seedParticipants, testDb } from "@/test-utils/db";

import { getLastRead, markRead } from "./activity";

describe("activity", () => {
  it("round-trips read state per kind with one row each", () => {
    const db = testDb();
    const [p] = seedParticipants(db, ["Léon"]);
    expect(getLastRead(db, p.id, "santa")).toBeNull();
    markRead(db, p.id, "santa", new Date("2026-12-01T10:00:00Z"));
    markRead(db, p.id, "santa", new Date("2026-12-02T10:00:00Z"));
    markRead(db, p.id, "group", new Date("2026-12-03T10:00:00Z"));
    expect(getLastRead(db, p.id, "santa")).toEqual(new Date("2026-12-02T10:00:00Z"));
    expect(getLastRead(db, p.id, "group")).toEqual(new Date("2026-12-03T10:00:00Z"));
    expect(db.prepare("SELECT count(*) AS n FROM read_state").get()).toEqual({ n: 2 });
  });

  it("stores no readable timestamp (privacy rule 3)", () => {
    const db = testDb();
    const [p] = seedParticipants(db, ["Léon"]);
    markRead(db, p.id, "giftee", new Date("2026-12-01T10:00:00Z"));
    const read = db.prepare("SELECT last_read_at_enc FROM read_state").pluck().get() as string;
    expect(read.startsWith("v1:")).toBe(true);
    expect(read).not.toContain("2026");
  });
});
