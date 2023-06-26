import fs from "node:fs";
import { test } from "@playwright/test";

function resetDatabase() {
  fs.writeFileSync("db.json", JSON.stringify({ messages: [] }));
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
    await page.getByPlaceholder("Type a message").fill("Hello world!");
    await page.getByPlaceholder("Type a message").press("Enter");
    const secondTab = await context.newPage();
    secondTab.waitForSelector("text=Hello world!");
    await secondTab.goto("/users/2");
    await secondTab.getByPlaceholder("Type a message").click();
    await secondTab
      .getByPlaceholder("Type a message")
      .fill("Hello from user 2");
    await secondTab.getByPlaceholder("Type a message").press("Enter");
    await page.waitForSelector("text=Hello from user 2");
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
        .type("Hello from user 2", { delay: 100 }),

      typingIndicator.isVisible(),
    ]);
  });
});
