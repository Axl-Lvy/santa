import { seedParticipants, testDb } from "@/test-utils/db";

import { DuplicateEmailError, LockedError, ValidationError } from "./errors";
import { setBudget } from "./event";
import { addParticipant, listParticipants, removeParticipant, updateParticipant } from "./participants";
import { addRule, removeRule } from "./rules";

function markDrawn(db: ReturnType<typeof testDb>) {
  db.prepare("UPDATE event SET drawn_at = ?").run(new Date().toISOString());
}

describe("participants", () => {
  it("stores a trimmed first name and a normalised email", () => {
    const db = testDb();
    const p = addParticipant(db, { firstName: " Léon ", email: " Leon@Test.FR " });
    expect(p).toMatchObject({ firstName: "Léon", email: "leon@test.fr" });
  });

  it("refuses the same email in another case", () => {
    const db = testDb();
    addParticipant(db, { firstName: "Léon", email: "leon@test.fr" });
    expect(() => addParticipant(db, { firstName: "Léo", email: "LEON@test.fr" })).toThrow(DuplicateEmailError);
  });

  it("refuses an empty first name or an invalid email", () => {
    const db = testDb();
    expect(() => addParticipant(db, { firstName: "  ", email: "a@b.fr" })).toThrow(ValidationError);
    expect(() => addParticipant(db, { firstName: "A", email: "pas-un-email" })).toThrow(ValidationError);
  });

  it("lists by first name, case-insensitively", () => {
    const db = testDb();
    seedParticipants(db, ["mamie", "Léon", "Axel"]);
    expect(listParticipants(db).map((p) => p.firstName)).toEqual(["Axel", "Léon", "mamie"]);
  });

  it("removes a participant with their data but keeps their chat messages", () => {
    const db = testDb();
    const [a, b] = seedParticipants(db, ["Axel", "Léon", "Mamie", "Papa"]);
    const now = new Date().toISOString();
    db.prepare("INSERT INTO wish (owner_id, title, position, created_at, updated_at) VALUES (?, 'x', 0, ?, ?)").run(b.id, now, now);
    db.prepare("INSERT INTO idea (author_id, target_id, body_enc, created_at, updated_at) VALUES (?, ?, 'v1:x', ?, ?)").run(b.id, a.id, now, now);
    db.prepare("INSERT INTO idea (author_id, target_id, body_enc, created_at, updated_at) VALUES (?, ?, 'v1:x', ?, ?)").run(a.id, b.id, now, now);
    db.prepare("INSERT INTO read_state (participant_id, kind, last_read_at_enc) VALUES (?, 'group', 'v1:x')").run(b.id);
    db.prepare("INSERT INTO group_message (author_id, author_name, body, created_at) VALUES (?, 'Léon', 'coucou', ?)").run(b.id, now);
    addRule(db, a.id, b.id);

    removeParticipant(db, b.id);

    const count = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
    expect(count("SELECT count(*) AS n FROM wish")).toBe(0);
    expect(count("SELECT count(*) AS n FROM idea")).toBe(0);
    expect(count("SELECT count(*) AS n FROM read_state")).toBe(0);
    expect(count("SELECT count(*) AS n FROM pair_rule")).toBe(0);
    expect(db.prepare("SELECT author_id, author_name FROM group_message").get()).toEqual({ author_id: null, author_name: "Léon" });
  });

  describe("after the draw", () => {
    it("locks membership and rules but not names, emails or budget", () => {
      const db = testDb();
      const [a, b, c] = seedParticipants(db, ["Axel", "Léon", "Mamie", "Papa"]);
      addRule(db, a.id, b.id);
      markDrawn(db);

      expect(() => addParticipant(db, { firstName: "Julie", email: "julie@test.fr" })).toThrow(LockedError);
      expect(() => removeParticipant(db, c.id)).toThrow(LockedError);
      expect(() => addRule(db, a.id, c.id)).toThrow(LockedError);
      expect(() => removeRule(db, a.id, b.id)).toThrow(LockedError);
      expect(updateParticipant(db, c.id, { firstName: "Mamou", email: "mamou@test.fr" })).toMatchObject({ firstName: "Mamou", email: "mamou@test.fr" });
      expect(() => updateParticipant(db, c.id, { firstName: "Mamou", email: b.email.toUpperCase() })).toThrow(DuplicateEmailError);
      expect(() => setBudget(db, 25)).not.toThrow();
    });
  });
});
