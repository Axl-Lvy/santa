import { openDb, type Db } from "@/lib/db";

/** A migrated in-memory database. */
export function testDb(): Db {
  return openDb(":memory:");
}

/** Inserts participants named `names`. */
export function seedParticipants(db: Db, names: string[]): { id: number; firstName: string }[] {
  const insert = db.prepare("INSERT INTO participant (first_name) VALUES (?)");
  return names.map((firstName) => ({
    id: Number(insert.run(firstName).lastInsertRowid),
    firstName,
  }));
}
