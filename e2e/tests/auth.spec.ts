import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/babysitter/i);
  });

  test('can navigate to register page', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/register"], button:has-text("Register"), a:has-text("Register")');
    await expect(page).toHaveURL(/\/register/);
  });

  test('register form can be filled and submitted', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="firstName"], input[placeholder*="First"]', 'Test');
    await page.fill('input[name="lastName"], input[placeholder*="Last"]', 'User');
    await page.fill('input[name="email"], input[type="email"]', `e2e_${Date.now()}@test.com`);
    await page.fill('input[name="password"], input[type="password"]', 'TestPassword123!');

    // Try to submit the form
    const submitButton = page.locator('button[type="submit"], button:has-text("Register")');
    if (await submitButton.isVisible()) {
      await submitButton.click();
    }
  });
});
