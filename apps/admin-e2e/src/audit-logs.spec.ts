import { test, expect } from '@playwright/test';
import { SimpleTestHelpers } from './helpers/simple-helpers';

test.describe('Audit Logs Page', () => {
  let helpers: SimpleTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new SimpleTestHelpers(page);
    // Navigate to a page first, then clear localStorage
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('should display audit logs page', async () => {
    await helpers.loginAsAdmin();
    await helpers.navigateToPage('/audit-logs');

    // Check page title and description
    await expect(helpers.page.locator('h1')).toContainText('Audit Logs');
    await expect(helpers.page.locator('p')).toContainText(
      'View system activity and user actions across your organization',
    );

    // Check table is visible
    await expect(helpers.page.locator('table')).toBeVisible();
  });

  test('should show audit log entries', async () => {
    await helpers.loginAsAdmin();
    await helpers.navigateToPage('/audit-logs');

    // Wait for table to load
    await expect(helpers.page.locator('table')).toBeVisible();

    // Check for table headers - fix CSS selector syntax
    await expect(helpers.page.locator('th:has-text("Timestamp")')).toBeVisible();
    await expect(helpers.page.locator('th:has-text("User")')).toBeVisible();
    await expect(helpers.page.locator('th:has-text("Action")')).toBeVisible();
    await expect(helpers.page.locator('th').filter({ hasText: 'Resource' }).first()).toBeVisible();
  });

  test('should be accessible only to authenticated users', async () => {
    await helpers.navigateToPage('/audit-logs');
    await helpers.expectRedirectToLogin();
  });
});
