import { test as baseTest, TestInfo } from "@playwright/test";

interface ExtendedFixtures {
  requestInterceptor: () => Promise<void>;
}

export interface NetworkRequest {
  method: string;
  url: string;
  status: number;
  startTime: number;
  endTime: number;
}

const test = baseTest.extend<ExtendedFixtures>({
  // Add networkRequests to test metadata after the test is complete
  requestInterceptor: [
    async ({ page }, use, testInfo) => {
      const networkRequests: NetworkRequest[] = [];
      await page.route("**/*", async (route) => {
        const startTime = Date.now();
        await route.continue();
        const endTime = Date.now();
        const response = await route.request().response();
        const networkRequest: NetworkRequest = {
          method: route.request().method(),
          url: route.request().url(),
          status: response?.status() ?? 0,
          startTime,
          endTime,
        };
        networkRequests.push(networkRequest);
      });
      await use(async () => {});
      testInfo.attachments.push({
        name: "network-requests",
        contentType: "application/json",
        body: Buffer.from(JSON.stringify(networkRequests)),
      });
    },
    { scope: "test", auto: true },
  ],
});

export { test };
export { expect } from "@playwright/test";
