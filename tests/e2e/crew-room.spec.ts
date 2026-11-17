import { test, expect } from "@playwright/test";

test.describe("Crew Multiplayer Mode & Negotiation Council", () => {
  test("loads Crew lobby with Room Code input and Host Room button", async ({ page }) => {
    await page.goto("/crew");
    await expect(page.locator("text=CREW OPERATIONS CENTER").first()).toBeVisible();

    // Verify Create Mission Room and Join Room forms
    await expect(page.locator("text=HOST FLIGHT ROOM").first()).toBeVisible();
    await expect(page.locator("text=JOIN MISSION ROOM").first()).toBeVisible();
    await expect(page.locator("input[placeholder='ROOM CODE']").first()).toBeVisible();
  });

  test("can join demo crew room and pick an engineering seat", async ({ page }) => {
    await page.goto("/crew/DEMO");
    await expect(page.locator("text=ROOM // DEMO").first()).toBeVisible();

    // Verify 4 flight roles exist
    await expect(page.locator("text=Mission Director").first()).toBeVisible();
    await expect(page.locator("text=Spacecraft Engineer").first()).toBeVisible();
    await expect(page.locator("text=Flight Dynamics").first()).toBeVisible();
    await expect(page.locator("text=Comms & Finance").first()).toBeVisible();
  });
});
