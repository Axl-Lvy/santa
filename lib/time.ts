let frozen: Date | null = null;

/** The current time, or the time frozen by `setNow` in tests. */
export function now(): Date {
  return frozen ? new Date(frozen) : new Date();
}

/** Freezes `now()`; `null` unfreezes. */
export function setNow(d: Date | null): void {
  frozen = d;
}

const parisHourFormat = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  hour: "numeric",
  hourCycle: "h23",
});

/** The hour of `d` in Europe/Paris, 0–23. */
export function parisHour(d: Date): number {
  return Number(parisHourFormat.formatToParts(d).find((part) => part.type === "hour")!.value);
}
