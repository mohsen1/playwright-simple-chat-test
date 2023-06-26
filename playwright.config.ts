import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "src/e2e",
  testMatch: "**/*.test.ts",
  webServer: {
    command: "yarn run start",
    port: 3000,
  },
});
