import { test, expect } from "@playwright/test";

test.describe("Full Campaign & Academy Flow", () => {
  test("user can navigate to Academy, browse curriculum, and inspect a lesson", async ({ page }) => {
    await page.goto("/academy");
    await expect(page.locator("text=SPACE ACADEMY").first()).toBeVisible();

    // Verify lessons are listed
    await expect(page.locator("text=Lesson 1: The Rocket Equation").first()).toBeVisible();
    await expect(page.locator("text=Tsiolkovsky").first()).toBeVisible();

    // Click on Lesson 1
    const lessonCard = page.locator("text=Lesson 1: The Rocket Equation").first();
    await lessonCard.click();
    await expect(page.locator("text=Specific Impulse").first()).toBeVisible();
  });

  test("user can open Campaign, select Chapter 1, and access mission brief", async ({ page }) => {
    await page.goto("/campaign");
    await expect(page.locator("text=MERIDIAN SPACE AUTHORITY").first()).toBeVisible();

    // Chapter 1
    const ch1 = page.locator("text=CHAPTER 01").first();
    await expect(ch1).toBeVisible();
    await ch1.click();

    // Verify Mission Briefing dialogue
    await expect(page.locator("text=MISSION BRIEFING").first()).toBeVisible();
    await expect(page.locator("text=LAUNCH CHAPTER MISSION").first()).toBeVisible();
  });
});
