import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "src/e2e",
  testMatch: "**/*.test.ts",
  reporter: [
    process.env.BUILDKITE_TEST_ANALYTICS_TOKEN
      ? ["line"]
      : ["html", { open: "never" }],
    // ["./reporter.js"],
    ["./SpanReporter.ts"],
  ],
  webServer: {
    command: "yarn run start",
    port: 3000,
  },
  use: {
    trace: "on",
  },
});
