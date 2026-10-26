import { seedParticipants, testDb } from "@/test-utils/db";

import { getActivity, touchSeen } from "../activity";
import { postGroupMessage } from "../group-messages";
import { addIdea } from "../ideas";
import { getParticipant } from "../participants";
import { setNow } from "../time";
import { runDigestTick, shouldSendDigest } from "./digest";

const at = (iso: string) => new Date(iso);
// 10:00 in Paris on 2026-12-01 is 09:00 UTC.
const tenParis = at("2026-12-01T09:00:00Z");
const hoursBefore = (d: Date, h: number) => new Date(d.getTime() - h * 3_600_000);

afterEach(() => setNow(null));

describe("shouldSendDigest", () => {
  it("sends when the oldest unseen message is 2 h old and no digest went out yet", () => {
    expect(
      shouldSendDigest({
        oldestUnseenAt: hoursBefore(tenParis, 2),
        lastDigestAt: null,
        now: tenParis,
      }),
    ).toBe(true);
  });

  it("waits until the message is 2 h old", () => {
    expect(
      shouldSendDigest({
        oldestUnseenAt: new Date(tenParis.getTime() - 119 * 60_000),
        lastDigestAt: null,
        now: tenParis,
      }),
    ).toBe(false);
  });

  it("waits 6 h between digests", () => {
    const last = new Date(tenParis.getTime() - (6 * 60 - 1) * 60_000);
    expect(
      shouldSendDigest({
        oldestUnseenAt: hoursBefore(tenParis, 3),
        lastDigestAt: last,
        now: tenParis,
      }),
    ).toBe(false);
  });

  it("stays quiet outside 08:00–21:00 Paris", () => {
    const ninePm = at("2026-12-01T20:00:00Z");
    const sevenFiftyNine = at("2026-12-01T06:59:00Z");
    for (const now of [ninePm, sevenFiftyNine]) {
      expect(
        shouldSendDigest({ oldestUnseenAt: hoursBefore(now, 3), lastDigestAt: null, now }),
      ).toBe(false);
    }
  });

  it("does nothing without unseen messages", () => {
    expect(shouldSendDigest({ oldestUnseenAt: null, lastDigestAt: null, now: tenParis })).toBe(
      false,
    );
  });
});

describe("runDigestTick", () => {
  it("never mails for anonymous activity (rule 9)", async () => {
    const db = testDb();
    const [a, b] = seedParticipants(db, ["Léon", "Mamie", "Papa"]);
    setNow(hoursBefore(tenParis, 3));
    addIdea(db, a.id, b.id, "idée");
    db.prepare("INSERT INTO anon_message (id, payload_enc) VALUES ('x', 'v1:x')").run();
    const send = vi.fn().mockResolvedValue(undefined);
    expect(await runDigestTick(db, tenParis, send)).toBe(0);
    expect(send).not.toHaveBeenCalled();
  });

  it("mails everyone who has not seen a 3 h old family message, except its author, once", async () => {
    const db = testDb();
    const [leon, mamie, papa] = seedParticipants(db, ["Léon", "Mamie", "Papa"]);
    touchSeen(db, papa.id, hoursBefore(tenParis, 1));
    setNow(hoursBefore(tenParis, 3));
    postGroupMessage(db, getParticipant(db, leon.id)!, "Coucou");
    const send = vi.fn().mockResolvedValue(undefined);
    expect(await runDigestTick(db, tenParis, send)).toBe(1);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: mamie.email }));
    expect(getActivity(db, mamie.id).lastDigestAt).toEqual(tenParis);
    expect(await runDigestTick(db, new Date(tenParis.getTime() + 60_000), send)).toBe(0);
  });
});
