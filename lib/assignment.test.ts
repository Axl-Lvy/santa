import { seedParticipants, testDb } from "@/test-utils/db";

import { gifteeOf, loadAssignment, resetAssignmentCache, saveAssignment, santaOf } from "./assignment";

afterEach(() => resetAssignmentCache());

describe("assignment", () => {
  it("stores one sealed blob with no readable ids", () => {
    const db = testDb();
    const [a, b, c] = seedParticipants(db, ["A", "B", "C"]);
    saveAssignment(db, new Map([[a.id, b.id], [b.id, c.id], [c.id, a.id]]));
    const raw = db.prepare("SELECT payload_enc FROM assignment_blob").pluck().get() as string;
    expect(raw.startsWith("v1:")).toBe(true);
    expect(raw).not.toContain('"1":');
    expect(loadAssignment(db)?.get(a.id)).toBe(b.id);
  });

  it("answers giftee and santa as inverses", () => {
    const db = testDb();
    const [a, b, c] = seedParticipants(db, ["A", "B", "C"]);
    saveAssignment(db, new Map([[a.id, c.id], [c.id, b.id], [b.id, a.id]]));
    expect(gifteeOf(db, a.id)).toBe(c.id);
    expect(santaOf(db, c.id)).toBe(a.id);
    expect(santaOf(db, gifteeOf(db, b.id)!)).toBe(b.id);
  });

  it("returns null before any draw", () => {
    const db = testDb();
    expect(loadAssignment(db)).toBeNull();
    expect(gifteeOf(db, 1)).toBeNull();
  });
});
