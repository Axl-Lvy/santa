import { seedParticipants, testDb } from "@/test-utils/db";

import { loadAssignment, resetAssignmentCache } from "./assignment";
import { runDraw } from "./draw";
import { AlreadyDrawnError } from "./errors";
import { getEvent } from "./event";
import { addRule } from "./rules";
import { NoValidDrawError } from "./solver";

vi.mock("./mail/draw-emails", () => ({ sendDrawEmails: vi.fn().mockResolvedValue(undefined) }));

afterEach(() => resetAssignmentCache());

describe("runDraw", () => {
  it("draws once, honouring the rules", () => {
    const db = testDb();
    const people = seedParticipants(db, ["A", "B", "C", "D", "E", "F", "G", "H"]);
    addRule(db, people[0].id, people[1].id);
    runDraw(db);
    expect(getEvent(db).drawnAt).not.toBeNull();
    const a = loadAssignment(db)!;
    expect(a.size).toBe(8);
    expect(a.get(people[0].id)).not.toBe(people[1].id);
    expect(a.get(people[1].id)).not.toBe(people[0].id);
  });

  it("refuses a second draw and keeps the first (double tap)", () => {
    const db = testDb();
    seedParticipants(db, ["A", "B", "C", "D"]);
    runDraw(db);
    const before = db.prepare("SELECT payload_enc FROM assignment_blob").pluck().get();
    expect(() => runDraw(db)).toThrow(AlreadyDrawnError);
    expect(db.prepare("SELECT payload_enc FROM assignment_blob").pluck().all()).toEqual([before]);
  });

  it("leaves nothing behind when no draw is possible", () => {
    const db = testDb();
    seedParticipants(db, ["A", "B"]);
    expect(() => runDraw(db)).toThrow(NoValidDrawError);
    expect(getEvent(db).drawnAt).toBeNull();
    expect(db.prepare("SELECT count(*) FROM assignment_blob").pluck().get()).toBe(0);
  });
});
