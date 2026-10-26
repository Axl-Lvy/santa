import { openDb, type Db } from "@/lib/db";

/** A migrated in-memory database. */
export function testDb(): Db {
  return openDb(":memory:");
}

/** Inserts participants named `names`, with emails `<name>@test.fr`. */
export function seedParticipants(db: Db, names: string[]): { id: number; firstName: string; email: string }[] {
  const insert = db.prepare("INSERT INTO participant (first_name, email) VALUES (?, ?)");
  return names.map((firstName) => {
    const email = `${firstName.toLowerCase()}@test.fr`;
    const id = Number(insert.run(firstName, email).lastInsertRowid);
    return { id, firstName, email };
  });
}
