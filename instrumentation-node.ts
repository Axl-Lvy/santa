import { ConfigError, getConfig } from "@/lib/config";
import { getDb } from "@/lib/db";

// Fail fast on bad config, then migrate.
try {
  getConfig();
} catch (error) {
  if (error instanceof ConfigError) {
    console.error(`santa: invalid configuration: ${error.message}`);
    process.exit(1);
  }
  throw error;
}
getDb();

const { startDigestScheduler } = await import("@/lib/mail/digest");
startDigestScheduler();
