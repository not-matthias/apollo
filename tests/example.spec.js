const { test, expect } = require("@playwright/test");

test("/", async ({ page }) => {
  await page.goto("http://localhost:1111");
  await expect(page).toHaveScreenshot();
});
