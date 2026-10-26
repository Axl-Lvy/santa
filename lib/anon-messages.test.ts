import { seedParticipants, testDb } from "@/test-utils/db";

import { listAnonThread, postAnon } from "./anon-messages";
import { resetAssignmentCache, saveAssignment } from "./assignment";
import * as bus from "./bus";
import { ValidationError } from "./errors";
import { notifyAnon } from "./notify";
import { getParticipant } from "./participants";

afterEach(() => {
  resetAssignmentCache();
  vi.restoreAllMocks();
});

function drawnFamily() {
  const db = testDb();
  const [a, b, c, d] = seedParticipants(db, ["A", "B", "C", "D"]);
  // A→B→C→D→A
  saveAssignment(
    db,
    new Map([
      [a.id, b.id],
      [b.id, c.id],
      [c.id, d.id],
      [d.id, a.id],
    ]),
  );
  db.prepare("UPDATE event SET drawn_at = '2026-12-01T10:00:00Z'").run();
  const p = (id: number) => getParticipant(db, id)!;
  return { db, a: p(a.id), b: p(b.id), c: p(c.id), d: p(d.id) };
}

describe("anonymous threads", () => {
  it("puts both directions of one Santa–giftee pair in the giftee's thread", () => {
    const { db, a, b } = drawnFamily();
    postAnon(db, a, "giftee", "Tu as déjà ce livre ?");
    postAnon(db, b, "santa", "Non !");
    expect(listAnonThread(db, b.id).map((m) => [m.direction, m.body])).toEqual([
      ["from_santa", "Tu as déjà ce livre ?"],
      ["from_giftee", "Non !"],
    ]);
    expect(listAnonThread(db, a.id)).toEqual([]);
  });

  it("stores opaque rows with no body or date in clear (rule 3)", () => {
    const { db, a } = drawnFamily();
    postAnon(db, a, "giftee", "secret-marker");
    const rows = db.prepare("SELECT * FROM anon_message").all() as Record<string, string>[];
    expect(Object.keys(rows[0]).sort()).toEqual(["id", "payload_enc"]);
    expect(rows[0].payload_enc.startsWith("v1:")).toBe(true);
    const dump = JSON.stringify(rows);
    expect(dump).not.toContain("secret-marker");
    expect(dump).not.toMatch(/20\d\d-\d\d-\d\d/);
  });

  it("notifies only the other side of the pair and the sender", () => {
    const { db, a, b, c, d } = drawnFamily();
    const spy = vi.spyOn(bus, "publish");
    notifyAnon(db, postAnon(db, b, "santa", "réponse"));
    expect(spy.mock.calls).toEqual(
      expect.arrayContaining([
        [a.id, "giftee"],
        [b.id, "santa"],
      ]),
    );
    expect(spy.mock.calls.map((c) => c[0])).not.toContain(c.id);
    expect(spy.mock.calls.map((c) => c[0])).not.toContain(d.id);
  });

  it("refuses messages before the draw", () => {
    const db = testDb();
    const [a] = seedParticipants(db, ["A", "B", "C"]);
    expect(() => postAnon(db, getParticipant(db, a.id)!, "giftee", "x")).toThrow(ValidationError);
  });
});
