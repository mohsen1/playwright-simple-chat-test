import fs from "node:fs";
import { test, expect } from "@playwright/test";

function resetDatabase() {
  fs.writeFileSync("db.json", JSON.stringify({ messages: [] }));
}

/**
 * Get a message from a user but sometimes it causes a flaky test intentionally.
 * (20% chance)
 * @param userId The user ID
 * @returns A message from the user
 */
function getMessages(userId: number) {
  const shouldFail = Math.random() < 0.05;
  if (shouldFail) {
    return "Flaky test";
  }
  return `Hello from user ${userId}`;
}

test.describe("Chat", () => {
  test.beforeEach(async ({}) => {
    resetDatabase();
  });

  test("should be able to send and receive messages", async ({
    page,
    context,
  }) => {
    await page.goto("/users/1");
    await page.getByPlaceholder("Type a message").click();
    await page.getByPlaceholder("Type a message").fill(getMessages(1));
    await page.getByPlaceholder("Type a message").press("Enter");
    const secondTab = await context.newPage();
    secondTab.waitForSelector(`text=Hello from user 1`);
    await secondTab.goto("/users/2");
    await secondTab.getByPlaceholder("Type a message").click();
    await secondTab.getByPlaceholder("Type a message").fill(getMessages(2));
    await secondTab.getByPlaceholder("Type a message").press("Enter");
    await page.waitForSelector(`text=Hello from user 2`);
  });

  test("typing indicator", async ({ browser, page }) => {
    const secondWindow = await browser.newContext();
    const secondPage = await secondWindow.newPage();
    await secondPage.goto("/users/2");
    await secondPage.getByPlaceholder("Type a message").isVisible();
    await page.goto("/users/1");
    await page.getByPlaceholder("Type a message").isVisible();

    const typingIndicator = page.getByTestId("typing-indicator");

    await Promise.all([
      secondPage
        .getByPlaceholder("Type a message")
        .type("Any message", { delay: 100 }),

      (async () => {
        await typingIndicator.waitFor({ state: "visible" });
        expect(await typingIndicator.isVisible()).toBe(true);
      })(),
    ]);
  });
});
