import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import Database from "better-sqlite3";

import { getConfig } from "./config";
import { MIGRATIONS } from "./schema";

export type Db = Database.Database;

/** Applies pending migrations, tracked by `user_version`. */
export function migrate(db: Db): void {
  const current = db.pragma("user_version", { simple: true }) as number;
  for (let v = current; v < MIGRATIONS.length; v++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[v]);
      db.pragma(`user_version = ${v + 1}`);
    })();
  }
}

/** Opens a migrated database, creating its directory if needed. */
export function openDb(path: string): Db {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

const holder = globalThis as unknown as { __santaDb?: Db };

/** The process-wide database. */
export function getDb(): Db {
  holder.__santaDb ??= openDb(getConfig().databasePath);
  return holder.__santaDb;
}

/** Runs `fn` in one immediate transaction. */
export function tx<T>(db: Db, fn: () => T): T {
  return db.transaction(fn).immediate();
}
