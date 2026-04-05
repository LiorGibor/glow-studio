import { test } from "@playwright/test";

test.describe("Visual Check - All Pages", () => {
  test("home page screenshot", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "e2e-screenshots/01-home.png", fullPage: true });
  });

  test("treatment detail screenshot", async ({ page }) => {
    await page.goto("/treatments/gel-manicure");
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "e2e-screenshots/02-treatment-detail.png", fullPage: true });
  });

  test("booking page screenshot", async ({ page }) => {
    await page.goto("/book/classic-eyebrow-shaping");
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "e2e-screenshots/03-booking-step1.png", fullPage: true });
  });

  test("admin login screenshot", async ({ page }) => {
    await page.goto("/admin/login");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "e2e-screenshots/04-admin-login.png", fullPage: true });
  });

  test("admin dashboard screenshot", async ({ page }) => {
    await page.goto("/admin/login");
    await page.waitForTimeout(1000);
    await page.locator('input[type="email"], input[placeholder*="mail"]').first().fill("admin@glowstudio.com");
    await page.locator('input[type="password"]').first().fill("admin123");
    await page.locator('button[type="submit"], button:has-text("Sign")').first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "e2e-screenshots/05-admin-dashboard.png", fullPage: true });
  });

  test("admin treatments screenshot", async ({ page }) => {
    await page.goto("/admin/login");
    await page.waitForTimeout(1000);
    await page.locator('input[type="email"], input[placeholder*="mail"]').first().fill("admin@glowstudio.com");
    await page.locator('input[type="password"]').first().fill("admin123");
    await page.locator('button[type="submit"], button:has-text("Sign")').first().click();
    await page.waitForTimeout(3000);
    await page.goto("/admin/treatments");
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "e2e-screenshots/06-admin-treatments.png", fullPage: true });
  });

  test("admin appointments screenshot", async ({ page }) => {
    await page.goto("/admin/login");
    await page.waitForTimeout(1000);
    await page.locator('input[type="email"], input[placeholder*="mail"]').first().fill("admin@glowstudio.com");
    await page.locator('input[type="password"]').first().fill("admin123");
    await page.locator('button[type="submit"], button:has-text("Sign")').first().click();
    await page.waitForTimeout(3000);
    await page.goto("/admin/appointments");
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "e2e-screenshots/07-admin-appointments.png", fullPage: true });
  });

  test("admin calendar screenshot", async ({ page }) => {
    await page.goto("/admin/login");
    await page.waitForTimeout(1000);
    await page.locator('input[type="email"], input[placeholder*="mail"]').first().fill("admin@glowstudio.com");
    await page.locator('input[type="password"]').first().fill("admin123");
    await page.locator('button[type="submit"], button:has-text("Sign")').first().click();
    await page.waitForTimeout(3000);
    await page.goto("/admin/calendar");
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "e2e-screenshots/08-admin-calendar.png", fullPage: true });
  });

  test("admin settings screenshot", async ({ page }) => {
    await page.goto("/admin/login");
    await page.waitForTimeout(1000);
    await page.locator('input[type="email"], input[placeholder*="mail"]').first().fill("admin@glowstudio.com");
    await page.locator('input[type="password"]').first().fill("admin123");
    await page.locator('button[type="submit"], button:has-text("Sign")').first().click();
    await page.waitForTimeout(3000);
    await page.goto("/admin/settings");
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "e2e-screenshots/09-admin-settings.png", fullPage: true });
  });
});
