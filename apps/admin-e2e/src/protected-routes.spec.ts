import { test, expect } from '@playwright/test';
import { SimpleTestHelpers } from './helpers/simple-helpers';

test.describe('Protected Routes', () => {
  let helpers: SimpleTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new SimpleTestHelpers(page);
    // Navigate to a page first, then clear localStorage
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('should redirect unauthenticated users to login', async () => {
    const protectedRoutes = [
      '/',
      '/admin-jobs',
      '/audit-logs',
      '/create-user',
      '/create-organization',
    ];

    for (const route of protectedRoutes) {
      await helpers.navigateToPage(route);
      await helpers.expectRedirectToLogin();
    }
  });

  test('should allow authenticated users to access protected routes', async () => {
    await helpers.loginAsAdmin();

    const protectedRoutes = [
      { path: '/', expectedTitle: 'Admin Dashboard' },
      { path: '/admin-jobs', expectedTitle: 'Admin Jobs' },
      { path: '/audit-logs', expectedTitle: 'Audit Logs' },
      { path: '/create-user', expectedTitle: 'Create User' },
      { path: '/create-organization', expectedTitle: 'Create Organization' },
    ];

    for (const route of protectedRoutes) {
      await helpers.navigateToPage(route.path);
      await expect(helpers.page).toHaveURL(route.path);
      await expect(helpers.page.locator('h1')).toBeVisible();
    }
  });
});
