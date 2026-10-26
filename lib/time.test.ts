import { parisHour } from "./time";

describe("parisHour", () => {
  it("converts to Europe/Paris, winter and summer", () => {
    expect(parisHour(new Date("2026-12-01T09:00:00Z"))).toBe(10);
    expect(parisHour(new Date("2026-07-01T20:30:00Z"))).toBe(22);
    expect(parisHour(new Date("2026-12-01T23:30:00Z"))).toBe(0);
  });
});
