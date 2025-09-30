import { test, expect } from '@playwright/test';

test('basic test to verify setup', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Admin/);
});
