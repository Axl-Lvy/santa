import { seedParticipants, testDb } from "@/test-utils/db";

import { resetAssignmentCache, saveAssignment } from "./assignment";
import * as bus from "./bus";
import { notifyWishlistChanged } from "./notify";

afterEach(() => {
  resetAssignmentCache();
  vi.restoreAllMocks();
});

describe("notifyWishlistChanged", () => {
  it("tells only the owner before the draw, and the owner's Santa after", () => {
    const db = testDb();
    const [a, b, c] = seedParticipants(db, ["A", "B", "C"]);
    const spy = vi.spyOn(bus, "publish");
    notifyWishlistChanged(db, b.id);
    expect(spy.mock.calls).toEqual([[b.id, "wishlist"]]);

    spy.mockClear();
    saveAssignment(
      db,
      new Map([
        [a.id, b.id],
        [b.id, c.id],
        [c.id, a.id],
      ]),
    );
    notifyWishlistChanged(db, b.id);
    expect(spy.mock.calls.sort()).toEqual(
      [
        [a.id, "wishlist"],
        [b.id, "wishlist"],
      ].sort(),
    );
  });
});
