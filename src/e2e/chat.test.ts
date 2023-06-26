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
});
