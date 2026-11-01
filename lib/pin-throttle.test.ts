import { createPinThrottle } from "./pin-throttle";

const MIN = 60_000;
const t0 = new Date("2026-12-01T10:00:00Z");
const at = (ms: number) => new Date(t0.getTime() + ms);

function failTimes(throttle: ReturnType<typeof createPinThrottle>, n: number, when: Date) {
  for (let i = 0; i < n; i++) throttle.fail(when);
}

describe("PIN throttle", () => {
  it("stays open for four failures and locks for 15 minutes on the fifth", () => {
    const throttle = createPinThrottle();
    failTimes(throttle, 4, t0);
    expect(throttle.lockedFor(t0)).toBe(0);
    throttle.fail(t0);
    expect(throttle.lockedFor(t0)).toBe(15 * MIN);
    expect(throttle.lockedFor(at(15 * MIN))).toBe(0);
  });

  it("doubles each later lockout", () => {
    const throttle = createPinThrottle();
    failTimes(throttle, 5, t0);
    failTimes(throttle, 5, at(15 * MIN));
    expect(throttle.lockedFor(at(15 * MIN))).toBe(30 * MIN);
  });

  it("starts over after a correct PIN", () => {
    const throttle = createPinThrottle();
    failTimes(throttle, 5, t0);
    throttle.succeed();
    failTimes(throttle, 4, at(15 * MIN));
    expect(throttle.lockedFor(at(15 * MIN))).toBe(0);
    throttle.fail(at(15 * MIN));
    expect(throttle.lockedFor(at(15 * MIN))).toBe(15 * MIN);
  });
});
