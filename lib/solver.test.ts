import {
  NoValidDrawError,
  drawAssignment,
  isDrawPossible,
  possibleSantas,
  type Rule,
} from "./solver";

const ids = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe("isDrawPossible", () => {
  it("needs at least three participants", () => {
    expect(isDrawPossible([1, 2], [])).toBe(false);
    expect(isDrawPossible([1, 2, 3], [])).toBe(true);
  });

  it("detects rules that leave no assignment", () => {
    expect(isDrawPossible([1, 2, 3], [[1, 2]])).toBe(false);
  });
});

describe("possibleSantas", () => {
  it("lists everyone who can give to the target in some valid draw", () => {
    expect(possibleSantas(1, ids(4), [[1, 2]])).toEqual([3, 4]);
    expect(
      possibleSantas(1, ids(4), [
        [1, 2],
        [1, 3],
      ]),
    ).toEqual([4]);
  });
});

describe("drawAssignment", () => {
  const rules: Rule[] = [
    [1, 2],
    [3, 4],
  ];

  it("always yields a valid permutation and sometimes a mutual pair", () => {
    let mutual = 0;
    for (let run = 0; run < 200; run++) {
      const a = drawAssignment(ids(8), rules);
      expect([...a.keys()].sort()).toEqual(ids(8));
      expect([...a.values()].sort()).toEqual(ids(8));
      for (const [giver, receiver] of a) {
        expect(giver).not.toBe(receiver);
        for (const [x, y] of rules) {
          expect([giver, receiver].sort()).not.toEqual([x, y]);
        }
        if (a.get(receiver) === giver) mutual++;
      }
    }
    expect(mutual).toBeGreaterThan(0);
  });

  it("is uniform over valid assignments", () => {
    const counts = new Map<string, number>();
    for (let run = 0; run < 18000; run++) {
      const a = drawAssignment(ids(4), []);
      const key = ids(4)
        .map((i) => a.get(i))
        .join("");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    expect(counts.size).toBe(9);
    for (const n of counts.values()) {
      expect(n).toBeGreaterThan(1750);
      expect(n).toBeLessThan(2250);
    }
  });

  it("throws when no draw exists", () => {
    expect(() => drawAssignment([1, 2, 3], [[1, 2]])).toThrow(NoValidDrawError);
  });

  it("falls back to enumeration when sampling never hits", () => {
    let calls = 0;
    // A sampler stuck on the identity permutation never produces a valid draw.
    const stuck = (max: number) => {
      calls++;
      return calls > 2_000_000 ? 0 : max - 1;
    };
    const a = drawAssignment([1, 2, 3], [], stuck);
    expect([...a.entries()].every(([g, r]) => g !== r)).toBe(true);
  });
});
