import { createHash, randomBytes } from "node:crypto";

import type { Db } from "./db";
import { now } from "./time";

export const SESSION_COOKIE = "santa_session";
export const SESSION_END = new Date("2027-01-31T23:59:59+01:00");

export type Session = { participantId: number | null; isAdmin: boolean };

export type LoginEvent = {
  id: number;
  participantId: number | null;
  name: string;
  ok: boolean;
  at: string;
  ip: string | null;
  userAgent: string | null;
  country: string | null;
};

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Opens a session and returns its secret token; only the token's hash is stored. */
export function createSession(db: Db, s: Session): string {
  const token = randomBytes(32).toString("base64url");
  db.prepare("INSERT INTO session (token_hash, participant_id, is_admin) VALUES (?, ?, ?)").run(
    hash(token),
    s.participantId,
    s.isAdmin ? 1 : 0,
  );
  return token;
}

/** The session behind `token`, or null when unknown, past the event, or its guest is gone. */
export function readSession(db: Db, token: string | undefined, at: Date = now()): Session | null {
  if (!token || at > SESSION_END) return null;
  const row = db
    .prepare("SELECT participant_id, is_admin FROM session WHERE token_hash = ?")
    .get(hash(token)) as { participant_id: number | null; is_admin: number } | undefined;
  if (!row) return null;
  if (!row.is_admin && row.participant_id === null) return null;
  return { participantId: row.participant_id, isAdmin: row.is_admin === 1 };
}

export function deleteSession(db: Db, token: string): void {
  db.prepare("DELETE FROM session WHERE token_hash = ?").run(hash(token));
}

export function recordLogin(db: Db, e: Omit<LoginEvent, "id">): void {
  db.prepare(
    `INSERT INTO login_event (participant_id, name, ok, at, ip, user_agent, country)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(e.participantId, e.name, e.ok ? 1 : 0, e.at, e.ip, e.userAgent, e.country);
}

/** The most recent logins and failed admin codes, newest first. */
export function listLoginEvents(db: Db, limit = 200): LoginEvent[] {
  const rows = db
    .prepare(
      `SELECT id, participant_id, name, ok, at, ip, user_agent, country
       FROM login_event ORDER BY at DESC, id DESC LIMIT ?`,
    )
    .all(limit) as {
    id: number;
    participant_id: number | null;
    name: string;
    ok: number;
    at: string;
    ip: string | null;
    user_agent: string | null;
    country: string | null;
  }[];
  return rows.map((r) => ({
    id: r.id,
    participantId: r.participant_id,
    name: r.name,
    ok: r.ok === 1,
    at: r.at,
    ip: r.ip,
    userAgent: r.user_agent,
    country: r.country,
  }));
}
