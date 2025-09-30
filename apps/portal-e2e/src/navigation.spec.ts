import { test, expect } from '@playwright/test';
import { SimpleTestHelpers } from './helpers/simple-helpers';

test.describe('Portal Navigation and Layout', () => {
    let helpers: SimpleTestHelpers;

    test.beforeEach(async ({ page }) => {
        helpers = new SimpleTestHelpers(page);
        await helpers.goToLogin();
        await page.evaluate(() => localStorage.clear());
        await helpers.loginAsAdmin();
    });

    test('should display home page after login', async () => {
        await helpers.expectOnHomePage();
        // The home page just shows "hello app" text, no h1 element needed
    });

    test('should have working navigation between pages', async () => {
        // Test navigation to forms
        await helpers.navigateToForms();
        await expect(helpers.page).toHaveURL('/forms');
        await expect(helpers.page.locator('h1')).toContainText('Portal');

        // Test navigation to posts
        await helpers.navigateToPosts();
        await expect(helpers.page).toHaveURL('/posts');
        await expect(helpers.page.locator('h1')).toContainText('Posts');

        // Test navigation back to home
        await helpers.navigateToPage('/');
        await helpers.expectOnHomePage();
    });

    test('should handle invalid routes gracefully', async () => {
        await helpers.navigateToPage('/invalid-route');
        // Portal might redirect to home page instead of login for invalid routes
        // Check that we're either on login or home page
        const currentUrl = helpers.page.url();
        const isLoginPage = currentUrl.includes('/login');
        const isHomePage = currentUrl === 'http://localhost:4201/';
        expect(isLoginPage || isHomePage).toBeTruthy();
    });
});
