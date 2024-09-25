import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "src/e2e",
  testMatch: "**/*.test.ts",
  reporter: [["line"], ["buildkite-test-collector/playwright/reporter"]],
  webServer: {
    command: "yarn run start",
    port: 3000,
  },
  use: {
    trace: "on",
  },
});
