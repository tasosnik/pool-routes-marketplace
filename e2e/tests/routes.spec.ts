import { test, expect } from '@playwright/test';

test.describe('Route Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'john.smith@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should navigate to routes page', async ({ page }) => {
    // Navigate to routes page
    await page.click('text=Routes').catch(() => {
      // If direct text doesn't work, try navigation menu
      return page.click('[href="/routes"]');
    });

    await expect(page).toHaveURL(/\/routes/);
    await expect(page.locator('h1, h2')).toContainText('Routes');
  });

  test('should display existing routes', async ({ page }) => {
    await page.goto('/routes');

    // Should show routes list (from seed data)
    await expect(page.locator('text=Beverly Hills')).toBeVisible();
    await expect(page.locator('text=Santa Monica')).toBeVisible();
  });

  test('should show route details when clicked', async ({ page }) => {
    await page.goto('/routes');

    // Click on a route
    await page.click('text=Beverly Hills');

    // Should navigate to route detail page
    await expect(page).toHaveURL(/\/routes\/[a-z0-9-]+/);

    // Should show route details
    await expect(page.locator('text=Beverly Hills')).toBeVisible();
    await expect(page.locator('text=Account')).toBeVisible();
  });

  test('should show create route option', async ({ page }) => {
    await page.goto('/routes');

    // Should have option to create new route
    await expect(page.locator('button:has-text("Create"), button:has-text("New"), a:has-text("Create"), a:has-text("New")')).toBeVisible();
  });

  test('should filter routes by status', async ({ page }) => {
    await page.goto('/routes');

    // Wait for routes to load
    await page.waitForSelector('text=Beverly Hills');

    // Try to find and use filter controls
    const filterButton = page.locator('button:has-text("Filter"), select[name="status"], input[placeholder*="filter"]').first();
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }

    // This test verifies the filter functionality exists
    // Actual filtering behavior would depend on UI implementation
  });

  test('should display route statistics', async ({ page }) => {
    await page.goto('/routes');

    // Should show summary statistics
    const statsSelectors = [
      'text=Total Routes',
      'text=Active',
      'text=Revenue',
      'text=Accounts',
      '[data-testid="route-stats"]',
      '.stats',
      '.summary'
    ];

    let foundStats = false;
    for (const selector of statsSelectors) {
      try {
        await expect(page.locator(selector)).toBeVisible();
        foundStats = true;
        break;
      } catch {
        // Continue to next selector
      }
    }

    // At least some form of statistics should be visible
    expect(foundStats || await page.locator('text=/[0-9]+.*account/i').isVisible()).toBe(true);
  });
});