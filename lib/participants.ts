import type { Db } from "./db";
import { tx } from "./db";
import { DuplicateNameError, LockedError, ValidationError } from "./errors";
import { isDrawn } from "./event";

export type Participant = {
  id: number;
  firstName: string;
  revealedAt: string | null;
};

type ParticipantRow = { id: number; first_name: string; revealed_at: string | null };

const PARTICIPANT_COLUMNS = "id, first_name, revealed_at";

function toParticipant(row: ParticipantRow): Participant {
  return { id: row.id, firstName: row.first_name, revealedAt: row.revealed_at };
}

const collator = new Intl.Collator("fr", { sensitivity: "base" });

export function listParticipants(db: Db): Participant[] {
  const rows = db
    .prepare(`SELECT ${PARTICIPANT_COLUMNS} FROM participant`)
    .all() as ParticipantRow[];
  return rows.map(toParticipant).sort((a, b) => collator.compare(a.firstName, b.firstName));
}

export function getParticipant(db: Db, id: number): Participant | null {
  const row = db.prepare(`SELECT ${PARTICIPANT_COLUMNS} FROM participant WHERE id = ?`).get(id) as
    ParticipantRow | undefined;
  return row ? toParticipant(row) : null;
}

/** The form of a name used to match logins and to tell guests apart. */
export function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[-\s]+/g, " ")
    .trim();
}

/** The guest whose name matches `typed` once both are normalised. */
export function findParticipantByName(db: Db, typed: string): Participant | null {
  const key = normalizeName(typed);
  if (!key) return null;
  return listParticipants(db).find((p) => normalizeName(p.firstName) === key) ?? null;
}

function validName(input: { firstName: string }): string {
  const firstName = input.firstName.trim();
  if (firstName.length < 1 || firstName.length > 40) {
    throw new ValidationError("Le prénom doit faire entre 1 et 40 caractères.");
  }
  return firstName;
}

function assertNameFree(db: Db, firstName: string, exceptId: number | null): void {
  const other = findParticipantByName(db, firstName);
  if (other && other.id !== exceptId) throw new DuplicateNameError();
}

export function addParticipant(db: Db, input: { firstName: string }): Participant {
  return tx(db, () => {
    if (isDrawn(db)) throw new LockedError();
    const firstName = validName(input);
    assertNameFree(db, firstName, null);
    const id = Number(
      db.prepare("INSERT INTO participant (first_name) VALUES (?)").run(firstName).lastInsertRowid,
    );
    return getParticipant(db, id)!;
  });
}

/** Renames a guest, also after the draw; never to or from `adminName`, which carries the admin role. */
export function updateParticipant(
  db: Db,
  id: number,
  input: { firstName: string },
  adminName: string,
): Participant {
  return tx(db, () => {
    const firstName = validName(input);
    const current = getParticipant(db, id);
    if (!current) throw new ValidationError("Cette personne n'existe pas.");
    const admin = normalizeName(adminName);
    const wasAdmin = normalizeName(current.firstName) === admin;
    if (wasAdmin !== (normalizeName(firstName) === admin)) {
      throw new ValidationError("Le prénom de l'organisateur ne peut pas changer.");
    }
    assertNameFree(db, firstName, id);
    db.prepare("UPDATE participant SET first_name = ? WHERE id = ?").run(firstName, id);
    return getParticipant(db, id)!;
  });
}

/** Deletes a participant with their wishes, ideas and rules; their chat messages stay. */
export function removeParticipant(db: Db, id: number): void {
  tx(db, () => {
    if (isDrawn(db)) throw new LockedError();
    db.prepare("DELETE FROM participant WHERE id = ?").run(id);
  });
}
