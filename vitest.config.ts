import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defaultExclude, defineConfig } from "vitest/config";

const nodeTests = ["lib/**/*.test.ts", "tests/**/*.test.ts", "app/api/**/*.test.ts"];

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    exclude: [...defaultExclude, "e2e/**", "**/.claude/**"],
    projects: [
      {
        extends: true,
        test: { name: "node", environment: "node", include: nodeTests },
      },
      {
        extends: true,
        test: {
          name: "jsdom",
          environment: "jsdom",
          include: ["**/*.test.{ts,tsx}"],
          exclude: [...defaultExclude, "e2e/**", "**/.claude/**", ...nodeTests],
        },
      },
    ],
  },
});
