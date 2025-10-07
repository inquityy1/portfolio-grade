import { test, expect } from '@playwright/test';
import { SimpleTestHelpers } from './helpers/simple-helpers';

test.describe('Portal Protected Routes', () => {
  let helpers: SimpleTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new SimpleTestHelpers(page);
    await helpers.goToLogin();
    await page.evaluate(() => localStorage.clear());
  });

  test('should redirect unauthenticated users to login', async () => {
    await helpers.navigateToPage('/forms');
    await helpers.expectRedirectToLogin();

    await helpers.navigateToPage('/posts');
    await helpers.expectRedirectToLogin();

    await helpers.navigateToPage('/forms/new');
    await helpers.expectRedirectToLogin();
  });

  test('should allow authenticated users to access protected routes', async () => {
    await helpers.loginAsAdmin();

    // Test forms page
    await helpers.navigateToForms();
    await expect(helpers.page).toHaveURL('/forms');
    await expect(helpers.page.locator('h1')).toContainText('Portal');

    // Test posts page
    await helpers.navigateToPosts();
    await expect(helpers.page).toHaveURL('/posts');
    await expect(helpers.page.locator('h1')).toContainText('Posts');
  });
});
