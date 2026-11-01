import "server-only";

import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { getConfig } from "./config";
import { getDb } from "./db";
import { isDrawn } from "./event";
import { findParticipantByName, getParticipant, type Participant } from "./participants";
import { readSession, SESSION_COOKIE } from "./session";

export type Viewer = {
  /** Who the request acts as: the switcher's choice when allowed, else the logged-in guest. */
  participant: Participant | null;
  isAdmin: boolean;
  canImpersonate: boolean;
};

export const DEV_AS_COOKIE = "dev_as";

/** The person behind this request, or null without a valid session. */
export async function getViewer(): Promise<Viewer | null> {
  const jar = await cookies();
  const db = getDb();
  const session = readSession(db, jar.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const config = getConfig();
  const self = session.isAdmin
    ? findParticipantByName(db, config.adminName)
    : getParticipant(db, session.participantId!);
  const canImpersonate = session.isAdmin && (!config.production || config.impersonation);
  const asId = Number(jar.get(DEV_AS_COOKIE)?.value);
  const other = canImpersonate && asId && asId !== self?.id ? getParticipant(db, asId) : null;
  return {
    participant: other ?? self,
    isAdmin: session.isAdmin && !other,
    canImpersonate,
  };
}

/** The viewer as a participant; 404 otherwise (the layouts show the login screen). */
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
