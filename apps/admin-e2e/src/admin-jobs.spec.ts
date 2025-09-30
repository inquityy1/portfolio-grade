import { test, expect } from '@playwright/test';
import { SimpleTestHelpers } from './helpers/simple-helpers';

test.describe('Admin Jobs Page', () => {
    let helpers: SimpleTestHelpers;

    test.beforeEach(async ({ page }) => {
        helpers = new SimpleTestHelpers(page);
        // Navigate to a page first, then clear localStorage
        await page.goto('/login');
        await page.evaluate(() => {
            localStorage.clear();
        });
    });

    test('should display admin jobs page', async () => {
        await helpers.loginAsAdmin();
        await helpers.navigateToPage('/admin-jobs');

        // Check page title and description
        await expect(helpers.page.locator('h1')).toContainText('Admin Jobs');
        await expect(helpers.page.locator('p').first()).toContainText('Manage background jobs and view system statistics');

        // Check sections
        await expect(helpers.page.locator('h2:has-text("Tag Statistics")')).toBeVisible();
        await expect(helpers.page.locator('h2:has-text("Post Preview Jobs")')).toBeVisible();
    });

    test('should have refresh button for tag stats', async () => {
        await helpers.loginAsAdmin();
        await helpers.navigateToPage('/admin-jobs');

        await expect(helpers.page.locator('button:has-text("Refresh Tag Stats")')).toBeVisible();
    });

    test('should be accessible only to authenticated users', async () => {
        await helpers.navigateToPage('/admin-jobs');
        await helpers.expectRedirectToLogin();
    });
});
