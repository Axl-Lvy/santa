import { seedParticipants, testDb } from "@/test-utils/db";

import { attemptLogin, type LoginRequest } from "./login";
import { createPinThrottle } from "./pin-throttle";
import { createSession, listLoginEvents, readSession } from "./session";

const at = new Date("2026-12-01T10:00:00Z");
const device = { ip: "82.1.2.3", userAgent: "UA", country: "FR" };

function setup() {
  const db = testDb();
  const people = seedParticipants(db, ["Léon", "Hélène"]);
  const opts = { adminName: "Axel", adminPin: "1234", throttle: createPinThrottle(), at };
  const login = (name: string, pin = "") =>
    attemptLogin(db, { name, pin, ...device } satisfies LoginRequest, opts);
  return { db, people, login };
}

describe("attemptLogin", () => {
  it("logs a guest in by a loosely typed name and records it", () => {
    const { db, people, login } = setup();
    const result = login("leon");
    expect(result.kind).toBe("in");
    const token = result.kind === "in" ? result.token : "";
    expect(readSession(db, token)).toEqual({ participantId: people[0].id, isAdmin: false });
    expect(listLoginEvents(db)).toEqual([
      {
        id: expect.any(Number),
        participantId: people[0].id,
        name: "Léon",
        ok: true,
        at: at.toISOString(),
        ...device,
      },
    ]);
  });

  it("does not know a name that matches nobody, and logs nothing", () => {
    const { db, login } = setup();
    expect(() => login("Zorro")).toThrow(
      "Je ne te trouve pas. Vérifie l'orthographe, ou demande à Axel.",
    );
    expect(listLoginEvents(db)).toEqual([]);
  });

  it("asks the admin for the PIN, whether or not Axel is a guest yet", () => {
    const { db, login } = setup();
    expect(login("axel")).toEqual({ kind: "pin" });
    seedParticipants(db, ["Axel"]);
    expect(login(" AXEL ")).toEqual({ kind: "pin" });
    expect(db.prepare("SELECT count(*) FROM session").pluck().get()).toBe(0);
    expect(listLoginEvents(db)).toEqual([]);
  });

  it("refuses a wrong PIN and logs the failure", () => {
    const { db, login } = setup();
    expect(() => login("Axel", "0000")).toThrow("Ce n'est pas le bon code.");
    expect(db.prepare("SELECT count(*) FROM session").pluck().get()).toBe(0);
    expect(listLoginEvents(db)).toMatchObject([{ name: "Axel", ok: false, participantId: null }]);
  });

  it("logs the admin in with the right PIN", () => {
    const { db, login } = setup();
    const result = login("Axel", "1234");
    const token = result.kind === "in" ? result.token : "";
    expect(readSession(db, token)).toEqual({ participantId: null, isAdmin: true });
    expect(listLoginEvents(db)).toMatchObject([{ name: "Axel", ok: true }]);
  });

  it("locks PIN login after five wrong codes, without ending an open session", () => {
    const { db, login } = setup();
    const open = createSession(db, { participantId: null, isAdmin: true });
    for (let i = 0; i < 5; i++) expect(() => login("Axel", "0000")).toThrow();
    expect(() => login("Axel", "1234")).toThrow("Trop d'essais. Réessaie dans 15 minutes.");
    expect(readSession(db, open)).toEqual({ participantId: null, isAdmin: true });
  });
});
