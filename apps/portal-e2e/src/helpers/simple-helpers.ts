import { Page, expect } from '@playwright/test';

export class SimpleTestHelpers {
  constructor(public page: Page) {}

  async goToLogin() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(500); // Small delay for visibility
  }

  async loginAsAdmin(email = 'adminA@example.com', password = 'admin123') {
    await this.goToLogin();

    await this.page.fill('input[placeholder="email"]', email);
    await this.page.waitForTimeout(300); // Delay between actions
    await this.page.fill('input[placeholder="password"]', password);
    await this.page.waitForTimeout(300); // Delay before click
    await this.page.click('button[type="submit"]');

    // Wait for successful login redirect
    await this.page.waitForURL('/');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(500); // Delay after login
  }

  async expectOnHomePage() {
    await expect(this.page).toHaveURL('/');
    await expect(this.page.locator('h1')).toContainText('Portal Dashboard');
  }

  async expectRedirectToLogin() {
    await expect(this.page).toHaveURL(/.*\/login/);
  }

  async navigateToPage(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(300); // Small delay for visibility
  }

  async navigateToForms() {
    await this.page.goto('/forms');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(300);
  }

  async navigateToPosts() {
    await this.page.goto('/posts');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(300);
  }
}
