import { timingSafeEqual } from "node:crypto";

import type { Db } from "./db";
import { UserError } from "./errors";
import { findParticipantByName, normalizeName } from "./participants";
import { createPinThrottle, type PinThrottle } from "./pin-throttle";
import { createSession, recordLogin } from "./session";

export type LoginRequest = {
  name: string;
  pin: string;
  ip: string | null;
  userAgent: string | null;
  country: string | null;
};

export type LoginOutcome = { kind: "pin" } | { kind: "in"; token: string };

/** The process-wide limit on wrong admin PINs. */
export const pinThrottle = createPinThrottle();

function samePin(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Logs a guest in by name, or the admin by name and PIN; throws a `UserError` to show on screen. */
export function attemptLogin(
  db: Db,
  req: LoginRequest,
  opts: { adminName: string; adminPin: string; throttle: PinThrottle; at: Date },
): LoginOutcome {
  const device = { ip: req.ip, userAgent: req.userAgent, country: req.country };
  const at = opts.at.toISOString();

  if (normalizeName(req.name) === normalizeName(opts.adminName)) {
    if (!req.pin) return { kind: "pin" };
    const wait = opts.throttle.lockedFor(opts.at);
    if (wait > 0) {
      throw new UserError(`Trop d'essais. Réessaie dans ${Math.ceil(wait / 60_000)} minutes.`);
    }
    if (!samePin(req.pin, opts.adminPin)) {
      opts.throttle.fail(opts.at);
      recordLogin(db, { participantId: null, name: opts.adminName, ok: false, at, ...device });
      throw new UserError("Ce n'est pas le bon code.");
    }
    opts.throttle.succeed();
    const admin = findParticipantByName(db, opts.adminName);
    recordLogin(db, {
      participantId: admin?.id ?? null,
      name: admin?.firstName ?? opts.adminName,
      ok: true,
      at,
      ...device,
    });
    return { kind: "in", token: createSession(db, { participantId: null, isAdmin: true }) };
  }

  const guest = findParticipantByName(db, req.name);
  if (!guest) {
    throw new UserError(
      `Je ne te trouve pas. Vérifie l'orthographe, ou demande à ${opts.adminName}.`,
    );
  }
  recordLogin(db, { participantId: guest.id, name: guest.firstName, ok: true, at, ...device });
  return { kind: "in", token: createSession(db, { participantId: guest.id, isAdmin: false }) };
}
