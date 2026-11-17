import { test, expect } from "@playwright/test";

test.describe("PWA Service Worker & Manifest Validation", () => {
  test("manifest.json is valid and served with correct attributes", async ({ request }) => {
    const response = await request.get("/manifest.json");
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest.short_name).toBe("MoonLander");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test("service worker script sw.js is accessible and versioned", async ({ request }) => {
    const response = await request.get("/sw.js");
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain("moonlander-cache");
    expect(text).toContain("self.addEventListener");
  });
});
