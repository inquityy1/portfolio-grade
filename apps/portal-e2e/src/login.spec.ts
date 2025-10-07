import { test, expect } from '@playwright/test';
import { SimpleTestHelpers } from './helpers/simple-helpers';

test.describe('Portal Login', () => {
  let helpers: SimpleTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new SimpleTestHelpers(page);
    await helpers.goToLogin();
    await page.evaluate(() => localStorage.clear());
  });

  test('should display login form', async () => {
    await expect(helpers.page.locator('h1')).toContainText('Portal Login');
    await expect(helpers.page.locator('input[placeholder="email"]')).toBeVisible();
    await expect(helpers.page.locator('input[placeholder="password"]')).toBeVisible();
    await expect(helpers.page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should have pre-filled admin credentials', async () => {
    await expect(helpers.page.locator('input[placeholder="email"]')).toHaveValue(
      'adminA@example.com',
    );
    await expect(helpers.page.locator('input[placeholder="password"]')).toHaveValue('admin123');
  });

  test('should login successfully with valid credentials', async () => {
    await helpers.loginAsAdmin();
    await helpers.expectOnHomePage();
  });
});
