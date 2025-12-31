import { test, expect } from "@playwright/test";

test("app loads and shows login page", async ({ page }) => {
  await page.goto("http://localhost:5173");
  
  // Check if login page elements are present
  await expect(page.locator("h1")).toContainText("OneEdge");
  await expect(page.locator("text=OneOrigin's Unified AI Platform")).toBeVisible();
  await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
  await expect(page.getByPlaceholder("Enter your email")).toBeVisible();
});

test("navigation works after authentication", async ({ page }) => {
  // Skip OAuth for testing, go directly to authenticated state
  await page.goto("http://localhost:5173");
  
  // Mock authentication by setting localStorage
  await page.evaluate(() => {
    localStorage.setItem("oneedge_auth_token", "test-token");
    localStorage.setItem("oneai_user", JSON.stringify({
      email: "test@example.com",
      name: "Test User"
    }));
  });
  
  await page.reload();
  
  // Should now show the main app interface
  await expect(page.locator("nav")).toBeVisible();
  await expect(page.getByRole("button", { name: /chat/i })).toBeVisible();
});
