import { test, expect } from '@playwright/test';
import { SimpleTestHelpers } from './helpers/simple-helpers';

test.describe('Admin Login', () => {
  let helpers: SimpleTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new SimpleTestHelpers(page);
    // Navigate to a page first, then clear localStorage
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('should display login form', async () => {
    await helpers.goToLogin();

    await expect(helpers.page.locator('h1')).toContainText('Admin Login');
    await expect(helpers.page.locator('input[placeholder="email"]')).toBeVisible();
    await expect(helpers.page.locator('input[placeholder="password"]')).toBeVisible();
    await expect(helpers.page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should have pre-filled admin credentials', async () => {
    await helpers.goToLogin();

    await expect(helpers.page.locator('input[placeholder="email"]')).toHaveValue(
      'adminA@example.com',
    );
    await expect(helpers.page.locator('input[placeholder="password"]')).toHaveValue('admin123');
  });

  test('should login successfully with valid credentials', async () => {
    await helpers.loginAsAdmin();
    await helpers.expectOnDashboard();
  });
});
