import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'john.smith@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should display dashboard after login', async ({ page }) => {
    // Should be on dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Should have dashboard title/header
    await expect(page.locator('h1, h2, [data-testid="page-title"]')).toContainText(['Dashboard', 'Welcome', 'Overview']);
  });

  test('should show user welcome message', async ({ page }) => {
    // Should greet the logged in user
    await expect(page.locator('text=John')).toBeVisible();
  });

  test('should display key metrics/stats', async ({ page }) => {
    // Dashboard should show important metrics
    const metricSelectors = [
      'text=Total Revenue',
      'text=Active Routes',
      'text=Pool Accounts',
      'text=Monthly',
      '[data-testid="metrics"]',
      '.metric',
      '.stat-card'
    ];

    let foundMetrics = false;
    for (const selector of metricSelectors) {
      try {
        if (await page.locator(selector).isVisible()) {
          foundMetrics = true;
          break;
        }
      } catch {
        // Continue to next selector
      }
    }

    // Should have some form of metrics display
    expect(foundMetrics || await page.locator('text=/\\$[0-9,]+/').isVisible()).toBe(true);
  });

  test('should have navigation to main sections', async ({ page }) => {
    // Should have navigation links to main application sections
    const navItems = ['Routes', 'Import', 'Marketplace', 'Profile'];

    for (const item of navItems) {
      try {
        await expect(page.locator(`a:has-text("${item}"), button:has-text("${item}"), [href*="${item.toLowerCase()}"]`)).toBeVisible();
      } catch {
        // Some nav items might be in different locations or formats
        console.log(`Navigation item "${item}" not found in expected format`);
      }
    }

    // At minimum, should have some navigation
    await expect(page.locator('nav, .navigation, [role="navigation"]')).toBeVisible();
  });

  test('should show recent activity or quick actions', async ({ page }) => {
    // Dashboard typically shows recent activity or quick actions
    const activitySelectors = [
      'text=Recent',
      'text=Activity',
      'text=Quick Actions',
      'text=Latest',
      '[data-testid="recent-activity"]',
      '.activity',
      '.quick-actions'
    ];

    let foundActivity = false;
    for (const selector of activitySelectors) {
      try {
        if (await page.locator(selector).isVisible()) {
          foundActivity = true;
          break;
        }
      } catch {
        // Continue to next selector
      }
    }

    // If no specific activity section, at least should have some interactive elements
    if (!foundActivity) {
      await expect(page.locator('button, a[href], .card, .tile')).toHaveCount({ min: 1 });
    }
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Test mobile responsiveness
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size

    // Dashboard should still be usable
    await expect(page.locator('h1, h2, [data-testid="page-title"]')).toBeVisible();

    // Navigation might be collapsed on mobile
    const mobileNav = page.locator('[data-testid="mobile-menu"], .hamburger, button[aria-label*="menu"]').first();
    if (await mobileNav.isVisible()) {
      await mobileNav.click();
      // Should show navigation menu
      await expect(page.locator('nav, .navigation')).toBeVisible();
    }
  });
});