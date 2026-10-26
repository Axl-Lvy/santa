// Runs once per server start. Node-only work lives in instrumentation-node.ts, out of the edge bundle.
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  await import("./instrumentation-node");
}
