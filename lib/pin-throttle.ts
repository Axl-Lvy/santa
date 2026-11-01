const FAILURES_BEFORE_LOCK = 5;
const FIRST_LOCK_MS = 15 * 60_000;

export type PinThrottle = {
  /** Milliseconds left before PIN login opens again; 0 when open. */
  lockedFor(at: Date): number;
  fail(at: Date): void;
  succeed(): void;
};

/** Global limit on wrong admin PINs: a lockout every 5 failures, each twice the previous. */
export function createPinThrottle(): PinThrottle {
  let failures = 0;
  let lockouts = 0;
  let lockedUntil = 0;
  return {
    lockedFor: (at) => Math.max(0, lockedUntil - at.getTime()),
    fail(at) {
      failures++;
      if (failures < FAILURES_BEFORE_LOCK) return;
      failures = 0;
      lockedUntil = at.getTime() + FIRST_LOCK_MS * 2 ** lockouts;
      lockouts++;
    },
    succeed() {
      failures = 0;
      lockouts = 0;
      lockedUntil = 0;
    },
  };
}
