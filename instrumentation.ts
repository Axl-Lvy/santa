// Runs once per server start: fail fast on bad config, migrate, start background jobs.
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { ConfigError, getConfig } = await import("@/lib/config");
  try {
    getConfig();
  } catch (error) {
    if (error instanceof ConfigError) {
      console.error(`santa: invalid configuration: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
  const { getDb } = await import("@/lib/db");
  getDb();
}
