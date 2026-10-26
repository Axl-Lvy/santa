import { clearedRatio, revealGate } from "./scratch";

const rgba = (pixels: number, clearedFirst: number) => {
  const data = new Uint8ClampedArray(pixels * 4);
  for (let i = 0; i < pixels; i++) data[i * 4 + 3] = i < clearedFirst ? 0 : 255;
  return data;
};

describe("clearedRatio", () => {
  it("measures the share of transparent pixels", () => {
    expect(clearedRatio(rgba(1000, 0))).toBe(0);
    expect(clearedRatio(rgba(1000, 500))).toBeCloseTo(0.5, 1);
    expect(clearedRatio(rgba(1000, 1000))).toBe(1);
  });
});

describe("revealGate", () => {
  it("shows the card only after the draw and before the reveal", () => {
    expect(revealGate(false, null)).toBe("home");
    expect(revealGate(true, "2026-12-01T10:00:00Z")).toBe("home");
    expect(revealGate(true, null)).toBe("show");
  });
});
