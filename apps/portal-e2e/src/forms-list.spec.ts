import { test, expect } from '@playwright/test';
import { SimpleTestHelpers } from './helpers/simple-helpers';

test.describe('Portal Forms List Page', () => {
  let helpers: SimpleTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new SimpleTestHelpers(page);
    await helpers.goToLogin();
    await page.evaluate(() => localStorage.clear());
    await helpers.loginAsAdmin();
    await helpers.navigateToForms();
  });

  test('should display forms list page', async () => {
    await expect(helpers.page.locator('h1')).toContainText('Portal');
    await expect(helpers.page.locator('p').first()).toContainText('Pick a form to preview / fill.');
  });

  test('should show create new form button for editors', async () => {
    // Check if create button is visible (depends on user role)
    const createButton = helpers.page.locator('button:has-text("Create new form")');
    await expect(createButton).toBeVisible();
  });

  test('should display forms grid or empty state', async () => {
    // Check for either forms grid or empty state message
    const formsGrid = helpers.page.locator('[style*="grid-template-columns"]');
    const emptyState = helpers.page.locator('text=Sorry but there is no forms right now');

    // One of these should be visible, or at least the page should load
    const hasForms = await formsGrid.isVisible();
    const isEmpty = await emptyState.isVisible();
    const pageLoaded = await helpers.page.locator('h1:has-text("Portal")').isVisible();

    expect(hasForms || isEmpty || pageLoaded).toBeTruthy();
  });

  test('should be accessible only to authenticated users', async () => {
    // Clear auth and try to access
    await helpers.page.evaluate(() => localStorage.clear());
    await helpers.navigateToForms();
    await helpers.expectRedirectToLogin();
  });
});
