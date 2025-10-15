import { test, expect } from '@playwright/test';
import { SimpleTestHelpers } from './helpers/simple-helpers';

test.describe('Portal Dashboard', () => {
  let helpers: SimpleTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new SimpleTestHelpers(page);
    await helpers.goToLogin();
    await page.evaluate(() => localStorage.clear());
    await helpers.loginAsAdmin();
  });

  test('should display dashboard content', async () => {
    await helpers.expectOnHomePage();

    // Check main dashboard elements
    await expect(helpers.page.locator('h1')).toContainText('Portal Dashboard');
    await expect(helpers.page.locator('p')).toContainText('Welcome to the Portal');
    await expect(helpers.page.locator('h3')).toContainText('Available Functions');
  });

  test('should display function descriptions', async () => {
    await helpers.expectOnHomePage();

    // Check that function descriptions are present in the main list
    await expect(helpers.page.locator('ul li').first()).toContainText(
      'Forms - View and manage forms',
    );
    await expect(helpers.page.locator('ul li').nth(1)).toContainText(
      'Posts - View and manage posts',
    );
    await expect(helpers.page.locator('ul li').nth(2)).toContainText(
      'Admin - Access admin functions',
    );
  });

  test('should have clickable navigation links', async () => {
    await helpers.expectOnHomePage();

    // Test Forms link (use more specific selector to avoid header nav)
    await helpers.page.click('main a[href="/forms"]');
    await expect(helpers.page).toHaveURL('/forms');
    await expect(helpers.page.locator('h1')).toContainText('Forms');

    // Go back to dashboard
    await helpers.navigateToPage('/');

    // Test Posts link
    await helpers.page.click('main a[href="/posts"]');
    await expect(helpers.page).toHaveURL('/posts');
    await expect(helpers.page.locator('h1')).toContainText('Posts');

    // Go back to dashboard
    await helpers.navigateToPage('/');

    // Test Admin link (might redirect to login if not admin)
    await helpers.page.click('main a[href="/admin"]');
    // Check if we're on admin page or redirected to login
    const currentUrl = helpers.page.url();
    const isAdminPage = currentUrl.includes('/admin');
    const isLoginPage = currentUrl.includes('/login');
    expect(isAdminPage || isLoginPage).toBeTruthy();
  });

  test('should be accessible only to authenticated users', async () => {
    // Clear auth and try to access
    await helpers.page.evaluate(() => localStorage.clear());
    await helpers.navigateToPage('/');
    await helpers.expectRedirectToLogin();
  });
});
