import { test, expect } from "@playwright/test";

test.describe("Bug Fix Verification", () => {
  test("/treatments redirects to home page treatments section", async ({ page }) => {
    await page.goto("/treatments");
    await page.waitForTimeout(2000);
    // Should redirect to / with #treatments hash
    expect(page.url()).toContain("/#treatments");
    // Should show treatment content
    const body = await page.textContent("body");
    expect(
      body!.includes("Eyebrow") ||
        body!.includes("Manicure") ||
        body!.includes("Our Treatments") ||
        body!.includes("הטיפולים שלנו")
    ).toBeTruthy();
  });

  test("home page renders treatments section", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(body!.includes("Our Treatments") || body!.includes("הטיפולים שלנו")).toBeTruthy();
    expect(
      body!.includes("Eyebrow") || body!.includes("Manicure")
    ).toBeTruthy();
  });

  test("booking page works with slug", async ({ page }) => {
    await page.goto("/book/classic-eyebrow-shaping");
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(body!.toLowerCase()).toContain("eyebrow");
    expect(body!.includes("Date") || body!.includes("תאריך")).toBeTruthy();
  });

  test("treatment detail page works", async ({ page }) => {
    await page.goto("/treatments/gel-manicure");
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(body!.toLowerCase()).toContain("manicure");
    expect(body!.includes("Book") || body!.includes("הזמינו")).toBeTruthy();
  });

  test("admin login and dashboard works", async ({ page }) => {
    await page.goto("/admin/login");
    await page.waitForTimeout(1000);
    const emailInput = page.locator('input[type="email"], input[placeholder*="mail"]');
    const passwordInput = page.locator('input[type="password"]');
    await emailInput.first().fill("admin@glowstudio.com");
    await passwordInput.first().fill("admin123");
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.first().click();
    await page.waitForTimeout(3000);
    expect(page.url()).toContain("/admin");
    expect(page.url()).not.toContain("login");
    // Dashboard should show stats
    const body = await page.textContent("body");
    expect(body!.includes("Dashboard") || body!.includes("לוח בקרה")).toBeTruthy();
  });

  test("complete booking flow with slugs", async ({ page }) => {
    // Go to home
    await page.goto("/");
    await page.waitForTimeout(2000);

    // Click "Book Now" on a treatment card
    const bookLink = page.locator('a[href*="/book/"]');
    const bookCount = await bookLink.count();
    expect(bookCount).toBeGreaterThan(0);
    await bookLink.first().click();
    await page.waitForTimeout(2000);

    // Should be on booking page with treatment loaded
    expect(page.url()).toContain("/book/");
    const body = await page.textContent("body");
    // Should show the booking wizard (step 1: date selection)
    expect(body!.includes("Date") || body!.includes("תאריך") || body!.includes("Select") || body!.includes("בחרו")).toBeTruthy();
  });

  test("no console errors on key pages", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    // Navigate through key pages
    await page.goto("/");
    await page.waitForTimeout(2000);
    await page.goto("/treatments/gel-manicure");
    await page.waitForTimeout(2000);
    await page.goto("/book/gel-manicure");
    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(
      (e) => !e.includes("ResizeObserver") && !e.includes("Failed to fetch")
    );
    expect(criticalErrors).toEqual([]);
  });

  test("admin treatments page loads without slug type error", async ({ page }) => {
    // Login first
    await page.goto("/admin/login");
    await page.waitForTimeout(1000);
    const emailInput = page.locator('input[type="email"], input[placeholder*="mail"]');
    const passwordInput = page.locator('input[type="password"]');
    await emailInput.first().fill("admin@glowstudio.com");
    await passwordInput.first().fill("admin123");
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.first().click();
    await page.waitForTimeout(3000);

    // Go to treatments management
    await page.goto("/admin/treatments");
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(
      body!.includes("Eyebrow") || body!.includes("Treatments") || body!.includes("טיפולים")
    ).toBeTruthy();
  });
});
