import "server-only";

import { createRemoteJWKSet, type JWTVerifyGetKey } from "jose";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { touchSeen } from "./activity";
import { getConfig } from "./config";
import { getDb } from "./db";
import { isDrawn } from "./event";
import { normalizeEmail, resolveParticipant, verifyAccessJwt } from "./identity";
import type { Participant } from "./participants";

export type Viewer = { email: string; isAdmin: boolean; participant: Participant | null };

export const DEV_AS_COOKIE = "dev_as";

let jwks: JWTVerifyGetKey | null = null;

async function identifiedEmail(): Promise<string | null> {
  const config = getConfig();
  if (!config.production && config.devIdentityEmail) {
    const override = (await cookies()).get(DEV_AS_COOKIE)?.value;
    return normalizeEmail(override || config.devIdentityEmail);
  }
  const token = (await headers()).get("cf-access-jwt-assertion");
  if (!token || !config.cfTeamDomain || !config.cfAud) return null;
  jwks ??= createRemoteJWKSet(new URL(`https://${config.cfTeamDomain}/cdn-cgi/access/certs`));
  try {
    return await verifyAccessJwt(token, {
      jwks,
      issuer: `https://${config.cfTeamDomain}`,
      audience: config.cfAud,
    });
  } catch {
    return null;
  }
}

const SEEN_THROTTLE_MS = 60_000;
const lastSeenWrite = new Map<number, number>();

/** Records a visit, at most once a minute per participant. */
function noteSeen(participantId: number): void {
  const t = Date.now();
  if (t - (lastSeenWrite.get(participantId) ?? 0) < SEEN_THROTTLE_MS) return;
  lastSeenWrite.set(participantId, t);
  touchSeen(getDb(), participantId);
}

/** The person behind this request, or null without a valid identity; records the participant's visit. */
export async function getViewer(): Promise<Viewer | null> {
  const email = await identifiedEmail();
  if (!email) return null;
  const participant = resolveParticipant(getDb(), email);
  if (participant) noteSeen(participant.id);
  return { email, isAdmin: email === getConfig().adminEmail, participant };
}

/** The viewer as a participant; 404 otherwise (the (app) layout shows the outsider page). */
export async function requireParticipant(): Promise<{ viewer: Viewer; me: Participant }> {
  const viewer = await getViewer();
  if (!viewer?.participant) notFound();
  return { viewer, me: viewer.participant };
}

/** For pages: the viewer as a participant, sent to the scratch card until they have revealed. */
export async function requirePageParticipant(): Promise<{ viewer: Viewer; me: Participant }> {
  const result = await requireParticipant();
  if (result.me.revealedAt === null && isDrawn(getDb())) redirect("/decouvrir");
  return result;
}

/** The viewer when they are the admin; 404 otherwise. */
export async function requireAdmin(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) notFound();
  return viewer;
}
