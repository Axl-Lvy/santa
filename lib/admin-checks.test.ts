import { seedParticipants, testDb } from "@/test-utils/db";

import { adminChecks } from "./admin-checks";
import { addRule } from "./rules";

describe("adminChecks", () => {
  it("reports a possible draw and three possible Santas", () => {
    const db = testDb();
    seedParticipants(db, ["Axel", "Léon", "Mamie", "Papa"]);
    expect(adminChecks(db, "axel@test.fr")).toEqual({ drawPossible: true, mystery: { count: 3, warn: false } });
  });

  it("warns when two or fewer people could be the admin's Santa", () => {
    const db = testDb();
    const [axel, leon] = seedParticipants(db, ["Axel", "Léon", "Mamie", "Papa"]);
    addRule(db, axel.id, leon.id);
    expect(adminChecks(db, "axel@test.fr").mystery).toEqual({ count: 2, warn: true });
  });

  it("reports no possible draw below three participants", () => {
    const db = testDb();
    seedParticipants(db, ["Axel", "Léon"]);
    expect(adminChecks(db, "axel@test.fr").drawPossible).toBe(false);
  });

  it("skips the mystery check when the admin is not a participant", () => {
    const db = testDb();
    seedParticipants(db, ["Léon", "Mamie", "Papa"]);
    expect(adminChecks(db, "axel@test.fr").mystery).toBeNull();
  });
});
