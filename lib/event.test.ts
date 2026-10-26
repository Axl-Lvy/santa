import { testDb } from "@/test-utils/db";

import { ValidationError } from "./errors";
import { getEvent, isDrawn, setBudget } from "./event";

describe("event", () => {
  it("starts with no budget and no draw", () => {
    const db = testDb();
    expect(getEvent(db)).toEqual({ budgetEur: null, drawnAt: null });
    expect(isDrawn(db)).toBe(false);
  });

  it("stores a whole-euro budget and refuses out of range values", () => {
    const db = testDb();
    setBudget(db, 30);
    expect(getEvent(db).budgetEur).toBe(30);
    expect(() => setBudget(db, 1001)).toThrow(ValidationError);
    expect(() => setBudget(db, 12.5)).toThrow(ValidationError);
    setBudget(db, null);
    expect(getEvent(db).budgetEur).toBeNull();
  });
});
