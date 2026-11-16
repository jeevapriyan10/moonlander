import { test, expect } from "@playwright/test";

test.describe("MoonLander Smoke Test Suite", () => {
  test("title page loads with MoonLander wordmark and tagline", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/MOONLANDER/i);
    await expect(page.locator("text=MOONLANDER").first()).toBeVisible();
    await expect(page.locator("text=Every mission begins with a decision").first()).toBeVisible();
  });

  test("can navigate from title to scenario selection", async ({ page }) => {
    await page.goto("/");
    await page.click("text=NEW MISSION");
    await expect(page).toHaveURL(/\/mission\/new/);
    await expect(page.locator("text=SELECT MISSION CHARTER")).toBeVisible();
    await expect(page.locator("text=Earth Watch")).toBeVisible();
  });

  test("can enter mission workspace with URL stage synchronization", async ({ page }) => {
    await page.goto("/mission/new");
    await page.click("text=START MISSION CHARTER");
    await expect(page).toHaveURL(/\/mission\/.*stage=objective/);
    await expect(page.locator("text=STAGE 01")).toBeVisible();

    // Advance to Requirements (Stage 2)
    const proceedBtn = page.locator("text=PROCEED TO SYSTEM REQUIREMENTS");
    if (await proceedBtn.isVisible()) {
      await proceedBtn.click();
      await expect(page).toHaveURL(/stage=requirements/);
      await expect(page.locator("text=STAGE 02")).toBeVisible();
    }
  });

  test("sandbox mode opens directly without looping", async ({ page }) => {
    await page.goto("/sandbox");
    await expect(page).toHaveURL(/\/mission\/sandbox.*stage=design/);
    await expect(page.locator("text=SANDBOX")).toBeVisible();
  });

  test("3D viewport renders canvas with Three.js WebGL context", async ({ page }) => {
    await page.goto("/mission/earth-watch?stage=design");
    // Verify WebGL Canvas element is rendered
    const canvas = page.locator("canvas");
    await expect(canvas.first()).toBeVisible({ timeout: 10000 });
  });

  test("can switch between Spacecraft, Trajectory, and Solar System views", async ({ page }) => {
    await page.goto("/mission/earth-watch?stage=design");
    
    // Switch to Trajectory mode
    const trajectoryBtn = page.locator("button:has-text('Trajectory')");
    if (await trajectoryBtn.isVisible()) {
      await trajectoryBtn.click();
      await expect(page.locator("canvas").first()).toBeVisible();
    }

    // Switch to Solar System mode
    const solarSystemBtn = page.locator("button:has-text('Solar System')");
    if (await solarSystemBtn.isVisible()) {
      await solarSystemBtn.click();
      await expect(page.locator("canvas").first()).toBeVisible();
    }
  });

  test("no horizontal scroll on mobile viewport", async ({ page }) => {
    await page.goto("/");
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // allow sub-pixel rounding
  });
});
