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
});
