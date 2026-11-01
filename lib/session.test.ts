import { seedParticipants, testDb } from "@/test-utils/db";

import { createSession, deleteSession, readSession, SESSION_END } from "./session";

describe("sessions", () => {
  it("reads back a guest session and stores only a hash of the token", () => {
    const db = testDb();
    const [leon] = seedParticipants(db, ["Léon"]);
    const token = createSession(db, { participantId: leon.id, isAdmin: false });
    expect(readSession(db, token)).toEqual({ participantId: leon.id, isAdmin: false });
    const dump = JSON.stringify(db.prepare("SELECT * FROM session").all());
    expect(dump).not.toContain(token);
  });

  it("reads back an admin session without a guest", () => {
    const db = testDb();
    const token = createSession(db, { participantId: null, isAdmin: true });
    expect(readSession(db, token)).toEqual({ participantId: null, isAdmin: true });
  });

  it("refuses an unknown or missing token", () => {
    const db = testDb();
    expect(readSession(db, "nope")).toBeNull();
    expect(readSession(db, undefined)).toBeNull();
  });

  it("ends every session after the event", () => {
    const db = testDb();
    const [leon] = seedParticipants(db, ["Léon"]);
    const token = createSession(db, { participantId: leon.id, isAdmin: false });
    const after = new Date(SESSION_END.getTime() + 1000);
    expect(readSession(db, token, after)).toBeNull();
  });

  it("ends the session of a guest who was removed", () => {
    const db = testDb();
    const [leon] = seedParticipants(db, ["Léon"]);
    const token = createSession(db, { participantId: leon.id, isAdmin: false });
    db.prepare("DELETE FROM participant WHERE id = ?").run(leon.id);
    expect(readSession(db, token)).toBeNull();
  });

  it("forgets a deleted session", () => {
    const db = testDb();
    const token = createSession(db, { participantId: null, isAdmin: true });
    deleteSession(db, token);
    expect(readSession(db, token)).toBeNull();
  });
});
