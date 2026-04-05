import { test } from "@playwright/test";

test("scroll to treatments section", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    document.querySelector("#treatments")?.scrollIntoView();
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "e2e-screenshots/10-home-scrolled.png" });
});
