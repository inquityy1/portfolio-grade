import { test, expect } from '@playwright/test';
import { SimpleTestHelpers } from './helpers/simple-helpers';

test.describe('Portal Posts Page', () => {
  let helpers: SimpleTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new SimpleTestHelpers(page);
    await helpers.goToLogin();
    await page.evaluate(() => localStorage.clear());
    await helpers.loginAsAdmin();
    await helpers.navigateToPosts();
  });

  test('should display posts page', async () => {
    await expect(helpers.page.locator('h1')).toContainText('Posts');
  });

  test('should have tag filter dropdown', async () => {
    await expect(helpers.page.locator('label:has-text("Filter")')).toBeVisible();
    await expect(helpers.page.locator('select')).toBeVisible();
    // Check that the select contains the expected option (options are hidden by default)
    await expect(helpers.page.locator('select option[value=""]')).toHaveText('All posts');
  });

  test('should show create new post button for editors', async () => {
    // Check if create button is visible (depends on user role)
    const createButton = helpers.page.locator('button:has-text("Create new post")');
    await expect(createButton).toBeVisible();
  });

  test('should show restore comment button for editors', async () => {
    // Check if restore button is visible (depends on user role)
    const restoreButton = helpers.page.locator('button:has-text("Restore comment")');
    await expect(restoreButton).toBeVisible();
  });

  test('should display posts or empty state', async () => {
    // Check for either posts or empty state message
    const postsSection = helpers.page.locator('section');
    const emptyState = helpers.page.locator('text=No posts yet.');

    // One of these should be visible
    const hasPosts = await postsSection.isVisible();
    const isEmpty = await emptyState.isVisible();

    expect(hasPosts || isEmpty).toBeTruthy();
  });

  test('should be accessible only to authenticated users', async () => {
    // Clear auth and try to access
    await helpers.page.evaluate(() => localStorage.clear());
    await helpers.navigateToPosts();
    await helpers.expectRedirectToLogin();
  });
});
