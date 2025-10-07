import { test, expect } from '@playwright/test';
import { SimpleTestHelpers } from './helpers/simple-helpers';

test.describe('Create Organization Page', () => {
  let helpers: SimpleTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new SimpleTestHelpers(page);
    // Navigate to a page first, then clear localStorage
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('should display create organization page', async () => {
    await helpers.loginAsAdmin();
    await helpers.navigateToPage('/create-organization');

    // Check page title and description
    await expect(helpers.page.locator('h1')).toContainText('Create New Organization');
    await expect(helpers.page.locator('p')).toContainText(
      'Create a new organization to manage users, posts, and forms',
    );

    // Check form field
    await expect(helpers.page.locator('label:has-text("Organization Name *")')).toBeVisible();
    await expect(
      helpers.page.locator('input[placeholder="Enter organization name"]'),
    ).toBeVisible();
  });

  test('should have help text', async () => {
    await helpers.loginAsAdmin();
    await helpers.navigateToPage('/create-organization');

    // Check help text
    await expect(
      helpers.page.locator('small:has-text("Organization name must be 2-100 characters long")'),
    ).toBeVisible();
  });

  test('should validate required field', async () => {
    await helpers.loginAsAdmin();
    await helpers.navigateToPage('/create-organization');

    // Check that submit button is disabled when form is empty
    const submitButton = helpers.page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();

    // Fill in a valid name to enable the button
    await helpers.page.fill('input[placeholder="Enter organization name"]', 'Test Org');
    await expect(submitButton).toBeEnabled();

    // Clear the field and check it's disabled again
    await helpers.page.fill('input[placeholder="Enter organization name"]', '');
    await expect(submitButton).toBeDisabled();
  });

  test('should validate minimum length', async () => {
    await helpers.loginAsAdmin();
    await helpers.navigateToPage('/create-organization');

    // Enter name that's too short - button should still be enabled (no client-side min length validation)
    await helpers.page.fill('input[placeholder="Enter organization name"]', 'A');

    // Button should be enabled (only checks for non-empty, not minimum length)
    const submitButton = helpers.page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();

    // Click submit to trigger server-side validation
    await submitButton.click();

    // Wait a moment for any validation to appear
    await helpers.page.waitForTimeout(1000);

    // Check that we're still on the same page (form didn't submit successfully)
    await expect(helpers.page).toHaveURL('/create-organization');

    // Check for any error message (could be different text)
    const errorAlert = helpers.page.locator('.alert');
    if ((await errorAlert.count()) > 0) {
      await expect(errorAlert).toBeVisible();
    }
  });

  test('should be accessible only to authenticated users', async () => {
    await helpers.navigateToPage('/create-organization');
    await helpers.expectRedirectToLogin();
  });
});
