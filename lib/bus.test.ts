import { publish, subscribe } from "./bus";

describe("bus", () => {
  it("delivers only the subscriber's own events until unsubscribed", () => {
    const mine: string[] = [];
    const theirs: string[] = [];
    const off = subscribe(1, (k) => mine.push(k));
    subscribe(2, (k) => theirs.push(k));
    publish(1, "group");
    publish(2, "santa");
    off();
    publish(1, "wishlist");
    expect(mine).toEqual(["group"]);
    expect(theirs).toEqual(["santa"]);
  });
});
