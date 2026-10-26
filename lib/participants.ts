import type { Db } from "./db";
import { tx } from "./db";
import { DuplicateEmailError, LockedError, ValidationError } from "./errors";
import { isDrawn } from "./event";
import { normalizeEmail } from "./identity";

export type Participant = {
  id: number;
  firstName: string;
  email: string;
  revealedAt: string | null;
  drawEmailSentAt: string | null;
};

export type ParticipantRow = {
  id: number;
  first_name: string;
  email: string;
  revealed_at: string | null;
  draw_email_sent_at: string | null;
};

export const PARTICIPANT_COLUMNS = "id, first_name, email, revealed_at, draw_email_sent_at";

export function toParticipant(row: ParticipantRow): Participant {
  return {
    id: row.id,
    firstName: row.first_name,
    email: row.email,
    revealedAt: row.revealed_at,
    drawEmailSentAt: row.draw_email_sent_at,
  };
}

const collator = new Intl.Collator("fr", { sensitivity: "base" });
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function validated(input: { firstName: string; email: string }): {
  firstName: string;
  email: string;
} {
  const firstName = input.firstName.trim();
  const email = normalizeEmail(input.email);
  if (firstName.length < 1 || firstName.length > 40) {
    throw new ValidationError("Le prénom doit faire entre 1 et 40 caractères.");
  }
  if (!EMAIL.test(email)) throw new ValidationError("Cette adresse email n'a pas l'air valide.");
  return { firstName, email };
}

function emailTaken(db: Db, email: string, exceptId: number | null): boolean {
  return (
    db.prepare("SELECT 1 FROM participant WHERE email = ? AND id IS NOT ?").get(email, exceptId) !==
    undefined
  );
}

export function addParticipant(db: Db, input: { firstName: string; email: string }): Participant {
  return tx(db, () => {
    if (isDrawn(db)) throw new LockedError();
    const { firstName, email } = validated(input);
    if (emailTaken(db, email, null)) throw new DuplicateEmailError();
    const id = Number(
      db.prepare("INSERT INTO participant (first_name, email) VALUES (?, ?)").run(firstName, email)
        .lastInsertRowid,
    );
    return getParticipant(db, id)!;
  });
}

/** Renames a participant or fixes their email; allowed after the draw. */
export function updateParticipant(
  db: Db,
  id: number,
  input: { firstName: string; email: string },
): Participant {
  return tx(db, () => {
    const { firstName, email } = validated(input);
    if (!getParticipant(db, id)) throw new ValidationError("Cette personne n'existe pas.");
    if (emailTaken(db, email, id)) throw new DuplicateEmailError();
    db.prepare("UPDATE participant SET first_name = ?, email = ? WHERE id = ?").run(
      firstName,
      email,
      id,
    );
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
