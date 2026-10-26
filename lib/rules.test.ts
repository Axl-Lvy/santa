import { seedParticipants, testDb } from "@/test-utils/db";

import { ImpossibleDrawError, ValidationError } from "./errors";
import { addRule, listRules, removeRule } from "./rules";

describe("pair rules", () => {
  it("stores pairs ordered and ignores duplicates", () => {
    const db = testDb();
    const [a, , c] = seedParticipants(db, ["A", "B", "C", "D"]);
    addRule(db, c.id, a.id);
    addRule(db, a.id, c.id);
    expect(listRules(db)).toEqual([[a.id, c.id]]);
    removeRule(db, c.id, a.id);
    expect(listRules(db)).toEqual([]);
  });

  it("refuses a rule with oneself", () => {
    const db = testDb();
    const [a] = seedParticipants(db, ["A", "B", "C"]);
    expect(() => addRule(db, a.id, a.id)).toThrow(ValidationError);
  });

  it("refuses a rule that leaves no valid draw and stores nothing", () => {
    const db = testDb();
    const [a, b, c] = seedParticipants(db, ["A", "B", "C"]);
    expect(() => addRule(db, a.id, b.id)).toThrow(ImpossibleDrawError);
    expect(() => addRule(db, a.id, b.id)).toThrow("Avec cette règle, aucun tirage n'est possible.");
    expect(listRules(db)).toEqual([]);
    expect(c).toBeDefined();
  });
});
