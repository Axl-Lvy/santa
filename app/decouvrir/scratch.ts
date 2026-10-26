export const REVEAL_THRESHOLD = 0.55;
export const HINT_DELAY_MS = 5000;

/** Share of sampled pixels whose alpha is 0; `stride` is in bytes and must be a multiple of 4. */
export function clearedRatio(alpha: Uint8ClampedArray, stride = 16): number {
  let cleared = 0;
  let sampled = 0;
  for (let i = 3; i < alpha.length; i += stride) {
    sampled++;
    if (alpha[i] === 0) cleared++;
  }
  return sampled === 0 ? 0 : cleared / sampled;
}

/** Whether `/decouvrir` shows the card or sends the person home. */
export function revealGate(drawn: boolean, revealedAt: string | null): "show" | "home" {
  return drawn && revealedAt === null ? "show" : "home";
}
