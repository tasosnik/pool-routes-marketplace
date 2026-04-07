import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/');
  });

  test('should redirect unauthenticated user to login page', async ({ page }) => {
    // If user is not logged in, should redirect to login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1, h2')).toContainText(['Login', 'Sign In']);
  });

  test('should show login form elements', async ({ page }) => {
    await page.goto('/login');

    // Check that login form exists
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for invalid login', async ({ page }) => {
    await page.goto('/login');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=required')).toBeVisible();
  });

  test('should allow user to navigate to registration', async ({ page }) => {
    await page.goto('/login');

    // Look for link/button to registration
    await page.click('text=Sign up');
    await expect(page).toHaveURL(/\/register/);
  });

  test('should show registration form elements', async ({ page }) => {
    await page.goto('/register');

    // Check that registration form exists
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login with demo credentials', async ({ page }) => {
    await page.goto('/login');

    // Use demo credentials from seed data
    await page.fill('input[type="email"]', 'john.smith@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard after successful login
    await expect(page).toHaveURL(/\/dashboard/);

    // Should show user is logged in (e.g., user menu or welcome message)
    await expect(page.locator('text=John')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'john.smith@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Then logout
    await page.click('button[data-testid="user-menu"]').catch(() => {
      // If testid doesn't exist, try text-based approach
      return page.click('text=Menu');
    });
    await page.click('text=Logout');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should persist login across page reloads', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'john.smith@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Reload page
    await page.reload();

    // Should still be logged in
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=John')).toBeVisible();
  });
});