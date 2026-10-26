import { seedParticipants, testDb } from "@/test-utils/db";

import { getActivity, getLastRead, markDigestSent, markRead, touchSeen } from "./activity";

describe("activity", () => {
  it("round-trips last seen and last digest independently", () => {
    const db = testDb();
    const [p] = seedParticipants(db, ["Léon"]);
    expect(getActivity(db, p.id)).toEqual({ lastSeenAt: null, lastDigestAt: null });
    touchSeen(db, p.id, new Date("2026-12-01T10:00:00Z"));
    markDigestSent(db, p.id, new Date("2026-12-01T12:00:00Z"));
    expect(getActivity(db, p.id)).toEqual({
      lastSeenAt: new Date("2026-12-01T10:00:00Z"),
      lastDigestAt: new Date("2026-12-01T12:00:00Z"),
    });
  });

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
    touchSeen(db, p.id, new Date("2026-12-01T10:00:00Z"));
    markRead(db, p.id, "giftee", new Date("2026-12-01T10:00:00Z"));
    const activity = db.prepare("SELECT activity_enc FROM participant").pluck().get() as string;
    const read = db.prepare("SELECT last_read_at_enc FROM read_state").pluck().get() as string;
    for (const raw of [activity, read]) {
      expect(raw.startsWith("v1:")).toBe(true);
      expect(raw).not.toContain("2026");
    }
  });
});
