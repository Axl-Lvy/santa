import { seedParticipants, testDb } from "@/test-utils/db";

import { DuplicateNameError, LockedError, ValidationError } from "./errors";
import { setBudget } from "./event";
import {
  addParticipant,
  findParticipantByName,
  listParticipants,
  normalizeName,
  removeParticipant,
  updateParticipant,
} from "./participants";
import { addRule, removeRule } from "./rules";

function markDrawn(db: ReturnType<typeof testDb>) {
  db.prepare("UPDATE event SET drawn_at = ?").run(new Date().toISOString());
}

describe("participants", () => {
  it("stores a trimmed first name and nothing else", () => {
    const db = testDb();
    const p = addParticipant(db, { firstName: " Léon " });
    expect(p).toEqual({ id: p.id, firstName: "Léon", revealedAt: null });
  });

  it("refuses a name that matches another guest's once normalised", () => {
    const db = testDb();
    addParticipant(db, { firstName: "Hélène" });
    expect(() => addParticipant(db, { firstName: "Helene" })).toThrow(DuplicateNameError);
    expect(() => addParticipant(db, { firstName: "Helene" })).toThrow(
      "Quelqu'un porte déjà ce prénom.",
    );
  });

  it("refuses an empty first name", () => {
    const db = testDb();
    expect(() => addParticipant(db, { firstName: "  " })).toThrow(ValidationError);
  });

  it("refuses a rename onto another guest's name, but allows a case fix", () => {
    const db = testDb();
    const [leon] = seedParticipants(db, ["Léon", "Hélène"]);
    expect(() => updateParticipant(db, leon.id, { firstName: "helene" }, "Axel")).toThrow(
      DuplicateNameError,
    );
    expect(updateParticipant(db, leon.id, { firstName: "léon" }, "Axel").firstName).toBe("léon");
  });

  it("never renames a guest to or from the admin's name", () => {
    const db = testDb();
    const [axel, leon] = seedParticipants(db, ["Axel", "Léon"]);
    const message = "Le prénom de l'organisateur ne peut pas changer.";
    expect(() => updateParticipant(db, leon.id, { firstName: "axel" }, "Axel")).toThrow(message);
    expect(() => updateParticipant(db, axel.id, { firstName: "Axelle" }, "Axel")).toThrow(message);
  });

  it("lets the admin add themself", () => {
    const db = testDb();
    expect(addParticipant(db, { firstName: "Axel" }).firstName).toBe("Axel");
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
    db.prepare(
      "INSERT INTO wish (owner_id, title, position, created_at, updated_at) VALUES (?, 'x', 0, ?, ?)",
    ).run(b.id, now, now);
    db.prepare(
      "INSERT INTO idea (author_id, target_id, body_enc, created_at, updated_at) VALUES (?, ?, 'v1:x', ?, ?)",
    ).run(b.id, a.id, now, now);
    db.prepare(
      "INSERT INTO idea (author_id, target_id, body_enc, created_at, updated_at) VALUES (?, ?, 'v1:x', ?, ?)",
    ).run(a.id, b.id, now, now);
    db.prepare(
      "INSERT INTO read_state (participant_id, kind, last_read_at_enc) VALUES (?, 'group', 'v1:x')",
    ).run(b.id);
    db.prepare(
      "INSERT INTO group_message (author_id, author_name, body, created_at) VALUES (?, 'Léon', 'coucou', ?)",
    ).run(b.id, now);
    addRule(db, a.id, b.id);

    removeParticipant(db, b.id);

    const count = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
    expect(count("SELECT count(*) AS n FROM wish")).toBe(0);
    expect(count("SELECT count(*) AS n FROM idea")).toBe(0);
    expect(count("SELECT count(*) AS n FROM read_state")).toBe(0);
    expect(count("SELECT count(*) AS n FROM pair_rule")).toBe(0);
    expect(db.prepare("SELECT author_id, author_name FROM group_message").get()).toEqual({
      author_id: null,
      author_name: "Léon",
    });
  });

  describe("after the draw", () => {
    it("locks membership and rules but not names or budget", () => {
      const db = testDb();
      const [a, b, c] = seedParticipants(db, ["Axel", "Léon", "Mamie", "Papa"]);
      addRule(db, a.id, b.id);
      markDrawn(db);

      expect(() => addParticipant(db, { firstName: "Julie" })).toThrow(LockedError);
      expect(() => removeParticipant(db, c.id)).toThrow(LockedError);
      expect(() => addRule(db, a.id, c.id)).toThrow(LockedError);
      expect(() => removeRule(db, a.id, b.id)).toThrow(LockedError);
      expect(updateParticipant(db, c.id, { firstName: "Mamou" }, "Axel")).toMatchObject({
        firstName: "Mamou",
      });
      expect(() => setBudget(db, 25)).not.toThrow();
    });
  });
});

describe("names", () => {
  it("normalises case, accents, hyphens and spaces", () => {
    expect(normalizeName("  LÉON ")).toBe("leon");
    expect(normalizeName("marie  claire")).toBe("marie claire");
    expect(normalizeName("Marie-Claire")).toBe("marie claire");
  });

  it("finds a guest by a loosely typed name, and only by the whole name", () => {
    const db = testDb();
    const [helene] = seedParticipants(db, ["Hélène", "Léon"]);
    expect(findParticipantByName(db, "helene")?.id).toBe(helene.id);
    expect(findParticipantByName(db, "Hélèn")).toBeNull();
  });
});
