import { test } from "@playwright/test";

test.describe("Chat", () => {
  test("typing indicator", async ({ browser, page }) => {
    const secondWindow = await browser.newContext();
    const secondPage = await secondWindow.newPage();

    await Promise.all([
      async () => {
        await secondPage.goto("/users/2");
        await secondPage.getByPlaceholder("Type a message").isVisible();
        await secondPage
          .getByPlaceholder("Type a message")
          .type("Hello from user 2", { delay: 100 });
      },
      async () => {
        await page.goto("/users/1");
        await page.getByPlaceholder("Type a message").isVisible();
        const typingIndicator = page.getByTestId("typing-indicator");
        await typingIndicator.isVisible();
      },
    ]);
  });
});
