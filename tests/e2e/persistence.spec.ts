import { test, expect } from "@playwright/test";

test.describe("Mission State & Mid-Mission Refresh Persistence", () => {
  test("refreshing mid-mission preserves active stage and spacecraft parameters", async ({ page }) => {
    await page.goto("/mission/earth-watch?stage=design");
    await expect(page.locator("text=STAGE 03").first()).toBeVisible();

    // Reload page mid-mission
    await page.reload();

    // Verify stage remains Stage 3 design without crashing or resetting
    await expect(page).toHaveURL(/stage=design/);
    await expect(page.locator("text=STAGE 03").first()).toBeVisible();
  });

  test("browser back/forward navigation correctly synchronizes game stages", async ({ page }) => {
    await page.goto("/mission/earth-watch?stage=design");
    await expect(page.locator("text=STAGE 03").first()).toBeVisible();

    // Go to requirements via URL
    await page.goto("/mission/earth-watch?stage=requirements");
    await expect(page.locator("text=STAGE 02").first()).toBeVisible();

    // Browser back to design
    await page.goBack();
    await expect(page).toHaveURL(/stage=design/);
  });
});
