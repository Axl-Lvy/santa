import { jwtVerify, type JWTVerifyGetKey } from "jose";

import type { Db } from "./db";
import {
  PARTICIPANT_COLUMNS,
  toParticipant,
  type Participant,
  type ParticipantRow,
} from "./participants";

export function normalizeEmail(s: string): string {
  return s.trim().toLowerCase();
}

/** Verifies a Cloudflare Access JWT and returns its normalised email; throws when invalid. */
export async function verifyAccessJwt(
  token: string,
  opts: { jwks: JWTVerifyGetKey; issuer: string; audience: string },
): Promise<string> {
  const { payload } = await jwtVerify(token, opts.jwks, {
    issuer: opts.issuer,
    audience: opts.audience,
  });
  if (typeof payload.email !== "string" || !payload.email.trim())
    throw new Error("token has no email");
  return normalizeEmail(payload.email);
}

export function resolveParticipant(db: Db, email: string): Participant | null {
  const row = db
    .prepare(`SELECT ${PARTICIPANT_COLUMNS} FROM participant WHERE email = ?`)
    .get(normalizeEmail(email)) as ParticipantRow | undefined;
  return row ? toParticipant(row) : null;
}

type ImpersonationConfig = {
  production: boolean;
  devIdentityEmail: string | null;
  impersonation: boolean;
  adminEmail: string;
};

/** Whether `realEmail` may act as someone else: anyone in local dev, only the admin on a test site. */
export function canImpersonate(realEmail: string, config: ImpersonationConfig): boolean {
  if (!config.production && config.devIdentityEmail) return true;
  return config.impersonation && realEmail === config.adminEmail;
}

/** The email the request acts as: the switcher cookie when allowed, else the verified one. */
export function resolveEmail(
  realEmail: string,
  cookie: string | undefined,
  config: ImpersonationConfig,
): string {
  const asked = cookie ? normalizeEmail(cookie) : "";
  return asked && canImpersonate(realEmail, config) ? asked : realEmail;
}
