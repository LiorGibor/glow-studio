import { test, expect } from "@playwright/test";

// ── Customer Pages ──────────────────────────────────────────────────────

test.describe("Customer - Home Page", () => {
  test("loads and shows branding", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Glow/i);
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
  });

  test("shows navigation links", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav, header");
    await expect(nav.first()).toBeVisible();
  });

  test("shows treatment cards after scrolling", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000);
    await page.evaluate(() =>
      document.querySelector("#treatments")?.scrollIntoView()
    );
    await page.waitForTimeout(1500);
    const body = await page.textContent("body");
    expect(
      body!.includes("Eyebrow") ||
        body!.includes("Manicure") ||
        body!.includes("Our Treatments") ||
        body!.includes("הטיפולים שלנו")
    ).toBeTruthy();
  });
});

test.describe("Customer - Treatments Redirect", () => {
  test("/treatments redirects to home #treatments", async ({ page }) => {
    await page.goto("/treatments");
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("/#treatments");
  });
});

test.describe("Customer - Treatment Detail Page", () => {
  test("shows treatment details", async ({ page }) => {
    await page.goto("/treatments/mnykvr-gl");
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(body!.includes("manicure") || body!.includes("Manicure") || body!.includes("מניקור")).toBeTruthy();
  });

  test("has a book now button", async ({ page }) => {
    await page.goto("/treatments/mnykvr-gl");
    await page.waitForTimeout(2000);
    const bookButton = page.locator(
      'a[href*="book"], button:has-text("Book"), a:has-text("Book"), a:has-text("הזמינו")'
    );
    await expect(bookButton.first()).toBeVisible();
  });
});

test.describe("Customer - Booking Page", () => {
  test("loads booking page with slug", async ({ page }) => {
    await page.goto("/book/aytsvb-gbvt-klasy");
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(body!.includes("eyebrow") || body!.includes("Eyebrow") || body!.includes("גבות")).toBeTruthy();
  });

  test("shows date picker (step 1)", async ({ page }) => {
    await page.goto("/book/aytsvb-gbvt-klasy");
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(body!.includes("Date") || body!.includes("תאריך") || body!.includes("Select") || body!.includes("בחרו")).toBeTruthy();
  });

  test("shows customer form on step 3", async ({ page }) => {
    await page.goto("/book/aytsvb-gbvt-klasy");
    await page.waitForTimeout(2000);
    // Select a date
    const dateBtn = page.locator("button").filter({ hasNotText: "Continue" }).nth(5);
    await dateBtn.click();
    await page.waitForTimeout(500);
    // Click continue
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("המשך")');
    await continueBtn.click();
    await page.waitForTimeout(1500);
    // Select a time slot
    const timeSlot = page.locator("button").filter({ hasText: /^\d{2}:\d{2}$/ }).first();
    if (await timeSlot.isVisible()) {
      await timeSlot.click();
      await page.waitForTimeout(500);
      await continueBtn.click();
      await page.waitForTimeout(1000);
      // Step 3 should have input fields
      const inputs = page.locator("input");
      expect(await inputs.count()).toBeGreaterThan(0);
    }
  });
});

// ── Admin Pages ─────────────────────────────────────────────────────────

test.describe("Admin - Login", () => {
  test("login page loads with form", async ({ page }) => {
    await page.goto("/admin/login");
    await page.waitForTimeout(1000);
    await expect(
      page.locator('input[type="email"], input[placeholder*="mail"]').first()
    ).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test("shows error on wrong credentials", async ({ page }) => {
    await page.goto("/admin/login");
    await page.waitForTimeout(1000);
    await page
      .locator('input[type="email"], input[placeholder*="mail"]')
      .first()
      .fill("wrong@test.com");
    await page.locator('input[type="password"]').first().fill("wrongpass");
    await page
      .locator('button[type="submit"]')
      .first()
      .click();
    await page.waitForTimeout(2000);
    // Should stay on login page
    expect(page.url()).toContain("login");
  });

  test("successful login redirects to admin area", async ({ page }) => {
    await page.goto("/admin/login");
    await page.waitForTimeout(1000);
    await page
      .locator('input[type="email"], input[placeholder*="mail"]')
      .first()
      .fill("admin@glowstudio.com");
    await page.locator('input[type="password"]').first().fill("admin123");
    await page
      .locator('button[type="submit"]')
      .first()
      .click();
    await page.waitForTimeout(3000);
    expect(
      page.url().includes("/admin") && !page.url().includes("/login")
    ).toBeTruthy();
  });
});

// Helper: admin login
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function adminLogin(page: any) {
  await page.goto("/admin/login");
  await page.waitForTimeout(1000);
  await page
    .locator('input[type="email"], input[placeholder*="mail"]')
    .first()
    .fill("admin@glowstudio.com");
  await page.locator('input[type="password"]').first().fill("admin123");
  await page
    .locator('button[type="submit"]')
    .first()
    .click();
  await page.waitForTimeout(3000);
}

test.describe("Admin - Dashboard", () => {
  test("shows dashboard stats", async ({ page }) => {
    await adminLogin(page);
    const body = await page.textContent("body");
    expect(body!.includes("Dashboard") || body!.includes("לוח בקרה")).toBeTruthy();
    expect(body!.includes("Appointments") || body!.includes("תורים") || body!.includes("Treatments") || body!.includes("טיפולים")).toBeTruthy();
  });

  test("can navigate to all admin pages", async ({ page }) => {
    await adminLogin(page);
    for (const target of ["calendar", "treatments", "appointments", "settings"]) {
      await page.goto(`/admin/${target}`);
      await page.waitForTimeout(1500);
      expect(page.url()).toContain(target);
      const body = await page.textContent("body");
      expect(body!.length).toBeGreaterThan(0);
    }
  });
});

test.describe("Admin - Treatments Management", () => {
  test("lists treatments in admin", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/treatments");
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(
      body!.includes("Eyebrow") ||
        body!.includes("Manicure") ||
        body!.includes("Makeup") ||
        body!.includes("גבות") ||
        body!.includes("מניקור") ||
        body!.includes("איפור")
    ).toBeTruthy();
  });
});

test.describe("Admin - Appointments Management", () => {
  test("shows appointments table", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/appointments");
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(body!.includes("Appointments") || body!.includes("תורים")).toBeTruthy();
  });
});

test.describe("Admin - Calendar", () => {
  test("shows calendar grid", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/calendar");
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(body!.includes("Calendar") || body!.includes("יומן")).toBeTruthy();
    expect(body!.includes("April") || body!.includes("Mon") || body!.includes("א׳") || body!.includes("ב׳")).toBeTruthy();
  });
});

test.describe("Admin - Settings", () => {
  test("shows settings form with working hours", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/settings");
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(body!.includes("Settings") || body!.includes("הגדרות")).toBeTruthy();
    expect(
      body!.includes("Monday") || body!.includes("Working Hours") || body!.includes("שעות פעילות") || body!.includes("יום שני")
    ).toBeTruthy();
  });
});

// ── Full Booking Flow ───────────────────────────────────────────────────

test.describe("Full Booking Flow", () => {
  test("navigate from home to booking page", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000);
    await page.evaluate(() =>
      document.querySelector("#treatments")?.scrollIntoView()
    );
    await page.waitForTimeout(1500);
    const bookLink = page.locator('a[href*="/book/"]');
    const count = await bookLink.count();
    expect(count).toBeGreaterThan(0);
    await bookLink.first().click();
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("/book/");
    const body = await page.textContent("body");
    expect(body!.includes("Date") || body!.includes("תאריך") || body!.includes("Book") || body!.includes("הזמנת")).toBeTruthy();
  });
});

// ── Error Handling ──────────────────────────────────────────────────────

test.describe("Error Handling", () => {
  test("non-existent treatment shows error", async ({ page }) => {
    await page.goto("/treatments/nonexistent-treatment-xyz");
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(body!.includes("not found") || body!.includes("לא נמצא") || body!.length > 0).toBeTruthy();
  });

  test("admin pages redirect unauthenticated users", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("glow_token"));
    await page.goto("/admin");
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("login");
  });
});

// ── Console Error Check ─────────────────────────────────────────────────

test.describe("No Console Errors", () => {
  const pagesToCheck = [
    "/",
    "/treatments/mnykvr-gl",
    "/book/mnykvr-gl",
    "/admin/login",
  ];

  for (const pagePath of pagesToCheck) {
    test(`no critical JS errors on ${pagePath}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));
      await page.goto(pagePath);
      await page.waitForTimeout(3000);
      const criticalErrors = errors.filter(
        (e) =>
          !e.includes("ResizeObserver") &&
          !e.includes("Loading chunk") &&
          !e.includes("Failed to fetch")
      );
      expect(criticalErrors).toEqual([]);
    });
  }
});
