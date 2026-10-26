import { existsSync, unlinkSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";

import { getConfig } from "../lib/config";
import { openDb } from "../lib/db";
import { setBudget } from "../lib/event";
import { addParticipant } from "../lib/participants";
import { addRule } from "../lib/rules";

/** Local playground cast. Edit names/emails, then re-run `npm run playground`. */
const CAST: { firstName: string; email: string }[] = [
  { firstName: "Axel", email: "axel@test.fr" },
  { firstName: "Tonton Riri", email: "riri@test.fr" },
  { firstName: "Mamie Boule", email: "boule@test.fr" },
  { firstName: "Kéké", email: "keke@test.fr" },
  { firstName: "Zouzou", email: "zouzou@test.fr" },
  { firstName: "Pépé Flocon", email: "flocon@test.fr" },
  { firstName: "Titouan", email: "titouan@test.fr" },
  { firstName: "Bernadette", email: "bernadette@test.fr" },
];

function assertLocalPlayground(): string {
  if (process.env.NODE_ENV === "production") {
    throw new Error("playground-seed refuses to run when NODE_ENV=production");
  }
  const config = getConfig();
  const dbPath = resolve(config.databasePath);
  const dataRoot = resolve("data");
  const underData = relative(dataRoot, dbPath);
  if (!underData || underData.startsWith("..") || isAbsolute(underData)) {
    throw new Error(`DATABASE_PATH must stay under ./data/ (got ${config.databasePath})`);
  }
  return dbPath;
}

function wipe(dbPath: string): void {
  for (const suffix of ["", "-wal", "-shm"]) {
    const file = `${dbPath}${suffix}`;
    if (existsSync(file)) unlinkSync(file);
  }
}

function main(): void {
  const dbPath = assertLocalPlayground();
  wipe(dbPath);

  const db = openDb(dbPath);
  try {
    const people = CAST.map((p) => addParticipant(db, p));
    setBudget(db, 25);
    const mamie = people.find((p) => p.email === "boule@test.fr")!;
    const pepe = people.find((p) => p.email === "flocon@test.fr")!;
    addRule(db, mamie.id, pepe.id);

    console.log(`playground: seeded ${people.length} people in ${dbPath}`);
    console.log("  → restart npm run dev if it was already running (SQLite handle is cached)");
    console.log("  → http://localhost:3000");
    console.log("  → 🧪 panel to switch identity; « Emails envoyés » for fake mail");
    console.log("  → /organisation to rename people, rules, or launch the draw");
    console.log("  → edit CAST in scripts/playground-seed.ts and re-run to reset");
  } finally {
    db.close();
  }
}

main();
