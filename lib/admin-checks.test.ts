import { seedParticipants, testDb } from "@/test-utils/db";

import { adminChecks } from "./admin-checks";
import { addRule } from "./rules";

describe("adminChecks", () => {
  it("reports a possible draw and three possible Santas", () => {
    const db = testDb();
    seedParticipants(db, ["Axel", "Léon", "Mamie", "Papa"]);
    expect(adminChecks(db, "axel@test.fr")).toEqual({ drawPossible: true, mystery: { count: 3, warn: false } });
  });

  it("warns when two or fewer people could be the admin's Santa", () => {
    const db = testDb();
    const [axel, leon] = seedParticipants(db, ["Axel", "Léon", "Mamie", "Papa"]);
    addRule(db, axel.id, leon.id);
    expect(adminChecks(db, "axel@test.fr").mystery).toEqual({ count: 2, warn: true });
  });

  it("reports no possible draw below three participants", () => {
    const db = testDb();
    seedParticipants(db, ["Axel", "Léon"]);
    expect(adminChecks(db, "axel@test.fr").drawPossible).toBe(false);
  });

  it("skips the mystery check when the admin is not a participant", () => {
    const db = testDb();
    seedParticipants(db, ["Léon", "Mamie", "Papa"]);
    expect(adminChecks(db, "axel@test.fr").mystery).toBeNull();
  });
});

describe("adminStatus", () => {
  it("shows only id, first name and a status per person (rule 7)", async () => {
    const { adminStatus } = await import("./admin-checks");
    const db = testDb();
    const [a, b, c] = seedParticipants(db, ["Axel", "Léon", "Mamie"]);
    db.prepare("UPDATE event SET drawn_at = '2026-12-01T10:00:00.000Z'").run();
    db.prepare("UPDATE participant SET draw_email_sent_at = 'x' WHERE id IN (?, ?)").run(a.id, b.id);
    db.prepare("UPDATE participant SET revealed_at = 'x' WHERE id = ?").run(a.id);
    const status = adminStatus(db);
    expect(status.drawnAt).toBe("2026-12-01T10:00:00.000Z");
    expect(status.rows).toEqual([
      { id: a.id, firstName: "Axel", status: "revealed" },
      { id: b.id, firstName: "Léon", status: "pending" },
      { id: c.id, firstName: "Mamie", status: "email-not-sent" },
    ]);
  });
});
