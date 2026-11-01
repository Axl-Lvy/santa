import Database from "better-sqlite3";

import { migrate, openDb } from "./db";
import { MIGRATIONS } from "./schema";

describe("openDb", () => {
  it("migrates to the latest version with the single event row", () => {
    const db = openDb(":memory:");
    expect(db.pragma("user_version", { simple: true })).toBe(MIGRATIONS.length);
    expect(db.prepare("SELECT id FROM event").all()).toEqual([{ id: 1 }]);
  });

  it("is a no-op when migrated twice", () => {
    const db = openDb(":memory:");
    migrate(db);
    expect(db.prepare("SELECT count(*) AS n FROM event").get()).toEqual({ n: 1 });
  });

  it("keeps guests and everything pointing at them when dropping their emails", () => {
    const db = new Database(":memory:");
    db.pragma("foreign_keys = ON");
    db.exec(MIGRATIONS[0]);
    db.exec(MIGRATIONS[1]);
    db.pragma("user_version = 2");
    const add = db.prepare("INSERT INTO participant (id, first_name, email) VALUES (?, ?, ?)");
    add.run(4, "Léon", "leon@test.fr");
    add.run(7, "Mamie", "mamie@test.fr");
    db.prepare(
      "INSERT INTO wish (owner_id, title, position, created_at, updated_at) VALUES (4, 'x', 0, 't', 't')",
    ).run();
    db.prepare("INSERT INTO pair_rule (a_id, b_id) VALUES (4, 7)").run();
    db.prepare("INSERT INTO session (token_hash, participant_id, is_admin) VALUES ('h', 7, 0)").run();

    migrate(db);

    expect(db.prepare("SELECT * FROM participant ORDER BY id").all()).toEqual([
      { id: 4, first_name: "Léon", revealed_at: null },
      { id: 7, first_name: "Mamie", revealed_at: null },
    ]);
    expect(db.prepare("SELECT owner_id FROM wish").pluck().all()).toEqual([4]);
    expect(db.prepare("SELECT a_id, b_id FROM pair_rule").get()).toEqual({ a_id: 4, b_id: 7 });
    expect(db.prepare("SELECT participant_id FROM session").pluck().all()).toEqual([7]);
    expect(db.pragma("foreign_key_check")).toEqual([]);
    expect(db.pragma("foreign_keys", { simple: true })).toBe(1);
    db.prepare("DELETE FROM participant WHERE id = 7").run();
    expect(db.prepare("SELECT count(*) FROM session").pluck().get()).toBe(0);
  });
});
