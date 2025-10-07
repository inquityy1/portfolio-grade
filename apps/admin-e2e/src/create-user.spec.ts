import { test, expect } from '@playwright/test';
import { SimpleTestHelpers } from './helpers/simple-helpers';

test.describe('Create User Page', () => {
  let helpers: SimpleTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new SimpleTestHelpers(page);
    // Navigate to a page first, then clear localStorage
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('should display create user page', async () => {
    await helpers.loginAsAdmin();
    await helpers.navigateToPage('/create-user');

    // Check page title and description
    await expect(helpers.page.locator('h1')).toContainText('Create New User');
    await expect(helpers.page.locator('p')).toContainText(
      'Add a new user to your organization with appropriate role permissions',
    );

    // Check form fields
    await expect(helpers.page.locator('label:has-text("Email Address *")')).toBeVisible();
    await expect(helpers.page.locator('label:has-text("Full Name *")')).toBeVisible();
    await expect(helpers.page.locator('label:has-text("Password *")')).toBeVisible();
    await expect(helpers.page.locator('label:has-text("Role *")')).toBeVisible();
    await expect(helpers.page.locator('label:has-text("Organization *")')).toBeVisible();
  });

  test('should have role options', async () => {
    await helpers.loginAsAdmin();
    await helpers.navigateToPage('/create-user');

    // Check role options - use a simpler selector
    const roleSelect = helpers.page.locator('select').first();
    await expect(roleSelect).toBeVisible();

    // Check that the select contains the expected options
    await expect(roleSelect.locator('option[value="Viewer"]')).toHaveText(
      'Viewer - Can view content only',
    );
    await expect(roleSelect.locator('option[value="Editor"]')).toHaveText(
      'Editor - Can create and edit content',
    );
    await expect(roleSelect.locator('option[value="OrgAdmin"]')).toHaveText(
      'OrgAdmin - Full administrative access',
    );
  });

  test('should validate required fields', async () => {
    await helpers.loginAsAdmin();
    await helpers.navigateToPage('/create-user');

    // Try to submit empty form - button should be enabled but form shouldn't submit
    const submitButton = helpers.page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();

    // Click submit to trigger validation
    await submitButton.click();

    // Wait a moment for any validation to appear
    await helpers.page.waitForTimeout(1000);

    // Check that we're still on the same page (form didn't submit successfully)
    await expect(helpers.page).toHaveURL('/create-user');

    // Check for any error message (could be different text)
    const errorAlert = helpers.page.locator('.alert');
    if ((await errorAlert.count()) > 0) {
      await expect(errorAlert).toBeVisible();
    }
  });

  test('should be accessible only to authenticated users', async () => {
    await helpers.navigateToPage('/create-user');
    await helpers.expectRedirectToLogin();
  });
});
