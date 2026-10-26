import { getActivity, markDigestSent } from "../activity";
import { getConfig } from "../config";
import { getDb, type Db } from "../db";
import { groupMessagesFromOthersSince } from "../group-messages";
import { listParticipants } from "../participants";
import { now, parisHour } from "../time";
import { digestEmail } from "./templates";
import { sendMail, type Mail } from "./transport";

const HOUR = 3_600_000;
const MIN_AGE = 2 * HOUR;
const MIN_GAP = 6 * HOUR;
const FIRST_HOUR = 8;
const LAST_HOUR = 21;
const TICK_MS = 15 * 60_000;

export function shouldSendDigest(o: {
  oldestUnseenAt: Date | null;
  lastDigestAt: Date | null;
  now: Date;
}): boolean {
  if (!o.oldestUnseenAt) return false;
  if (o.now.getTime() - o.oldestUnseenAt.getTime() < MIN_AGE) return false;
  if (o.lastDigestAt && o.now.getTime() - o.lastDigestAt.getTime() < MIN_GAP) return false;
  const hour = parisHour(o.now);
  return hour >= FIRST_HOUR && hour < LAST_HOUR;
}

/** Mails the family chat digest to whoever is due; only family chat counts (privacy rule 9). */
export async function runDigestTick(
  db: Db,
  at: Date = now(),
  send: (m: Mail) => Promise<void> = sendMail,
): Promise<number> {
  let sent = 0;
  for (const p of listParticipants(db)) {
    const { lastSeenAt, lastDigestAt } = getActivity(db, p.id);
    const since =
      [lastSeenAt, lastDigestAt]
        .filter((d): d is Date => d !== null)
        .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
    const unseen = groupMessagesFromOthersSince(db, p.id, since);
    const oldestUnseenAt = unseen.length ? new Date(unseen[0].createdAt) : null;
    if (!shouldSendDigest({ oldestUnseenAt, lastDigestAt, now: at })) continue;
    try {
      await send({
        to: p.email,
        ...digestEmail({ firstName: p.firstName, appUrl: getConfig().appUrl }),
      });
      markDigestSent(db, p.id, at);
      sent++;
    } catch (error) {
      console.error(`santa: digest failed: ${error instanceof Error ? error.name : "unknown"}`);
    }
  }
  if (sent > 0) console.info(`santa: digest sent to ${sent} participants`);
  return sent;
}

const holder = globalThis as unknown as { __santaDigest?: NodeJS.Timeout };

export function startDigestScheduler(): void {
  if (holder.__santaDigest) return;
  holder.__santaDigest = setInterval(() => void runDigestTick(getDb()), TICK_MS);
  holder.__santaDigest.unref();
}
