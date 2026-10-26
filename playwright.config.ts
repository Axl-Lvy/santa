import { tmpdir } from "node:os";
import { join } from "node:path";

import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
// Outside the project: the dev server watches the project tree and reloads on file writes.
const DATABASE_PATH = join(tmpdir(), `santa-e2e-${Date.now()}`, "e2e.db");

// One event per run: the pre-draw flow runs on a Pixel, then the draw flow continues on an iPhone.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "pre-draw", testMatch: /pre-draw\.spec\.ts/, use: { ...devices["Pixel 7"] } },
    { name: "draw", testMatch: /draw\.spec\.ts/, testIgnore: /pre-draw/, dependencies: ["pre-draw"], use: { ...devices["iPhone 13"] } },
  ],
  webServer: {
    command: `next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DEV_IDENTITY_EMAIL: "axel@test.fr",
      ADMIN_EMAIL: "axel@test.fr",
      DATABASE_PATH,
      SANTA_DATA_KEY: "00".repeat(32),
      APP_URL: `http://localhost:${PORT}`,
    },
  },
});
