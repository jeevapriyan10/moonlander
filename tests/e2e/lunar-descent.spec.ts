import { test, expect } from "@playwright/test";

test.describe("Lunar Powered Descent & Replay Experience", () => {
  test("loads replay vault and verifies trajectory canvas and telemetry HUD", async ({ page }) => {
    await page.goto("/replay");
    await expect(page.locator("text=DESCENT TELEMETRY RECORDER").first()).toBeVisible();

    // Verify benchmark selector buttons
    await expect(page.locator("text=Apollo 11").first()).toBeVisible();
    await expect(page.locator("text=Chandrayaan-3").first()).toBeVisible();
    await expect(page.locator("text=Chang'e 4").first()).toBeVisible();

    // Verify 2D trajectory canvas is rendered
    const canvas = page.locator("canvas");
    await expect(canvas.first()).toBeVisible();

    // Verify flight telemetry gauges
    await expect(page.locator("text=Vertical (Vy)").first()).toBeVisible();
    await expect(page.locator("text=Horizontal (Vx)").first()).toBeVisible();
    await expect(page.locator("text=Propellant Left").first()).toBeVisible();
  });

  test("can switch between historic benchmark landing replays", async ({ page }) => {
    await page.goto("/replay");
    const chandrayaanBtn = page.locator("button:has-text('Chandrayaan-3')").first();
    await chandrayaanBtn.click();
    await expect(page.locator("text=Target Safe Zone").first()).toBeVisible();
  });
});
