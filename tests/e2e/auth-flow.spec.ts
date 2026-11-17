import { test, expect } from "@playwright/test";

test.describe("Authentication & Cloud Sync Protocol", () => {
  test("guest mode displays Guest indicator and opens pure email auth modal", async ({ page }) => {
    await page.goto("/mission/earth-watch?stage=design");

    // Guest button in topbar
    const authBtn = page.locator("button:has-text('Guest')").first();
    await expect(authBtn).toBeVisible();
    await authBtn.click();

    // Verify Auth Modal appears with pure email options
    await expect(page.locator("text=AUTHENTICATION").first()).toBeVisible();
    await expect(page.locator("input[type='email']").first()).toBeVisible();

    // Verify NO Google or GitHub OAuth buttons (strictly email only)
    await expect(page.locator("text=Google")).toHaveCount(0);
    await expect(page.locator("text=GitHub")).toHaveCount(0);
  });
});
