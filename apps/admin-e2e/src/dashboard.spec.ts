import { test, expect } from '@playwright/test';
import { SimpleTestHelpers } from './helpers/simple-helpers';

test.describe('Admin Dashboard', () => {
  let helpers: SimpleTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new SimpleTestHelpers(page);
    // Navigate to a page first, then clear localStorage
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('should display dashboard after login', async () => {
    await helpers.loginAsAdmin();
    await helpers.expectOnDashboard();

    // Check main content
    await expect(helpers.page.locator('h1')).toContainText('Admin Dashboard');
    await expect(helpers.page.locator('p')).toContainText('Welcome to the Admin Panel');
  });

  test('should have navigation links', async () => {
    await helpers.loginAsAdmin();
    await helpers.expectOnDashboard();

    // Check for navigation links - use more specific selectors
    await expect(helpers.page.locator('ul a[href="/create-user"]')).toBeVisible();
    await expect(helpers.page.locator('ul a[href="/create-organization"]')).toBeVisible();
  });

  test('should redirect unauthenticated users to login', async () => {
    await helpers.navigateToPage('/');
    await helpers.expectRedirectToLogin();
  });
});
