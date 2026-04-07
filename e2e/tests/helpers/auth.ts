import { Page, expect } from '@playwright/test';

/**
 * Demo user credentials from the seed data
 */
export const DEMO_USERS = {
  admin: {
    email: 'admin@poolroute.com',
    password: 'password123',
    role: 'admin'
  },
  operator: {
    email: 'john.smith@example.com',
    password: 'password123',
    role: 'operator'
  },
  seller: {
    email: 'mike.wilson@example.com',
    password: 'password123',
    role: 'seller'
  },
  buyer: {
    email: 'lisa.brown@example.com',
    password: 'password123',
    role: 'buyer'
  }
};

/**
 * Login helper function
 */
export async function login(page: Page, userType: keyof typeof DEMO_USERS = 'operator') {
  const user = DEMO_USERS[userType];

  await page.goto('/login');
  await page.fill('input[type="email"], input[name="email"]', user.email);
  await page.fill('input[type="password"], input[name="password"]', user.password);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await expect(page).toHaveURL(/\/dashboard/);
}

/**
 * Logout helper function
 */
export async function logout(page: Page) {
  // Try multiple selectors for logout
  const logoutSelectors = [
    'button[data-testid="logout"]',
    'button:has-text("Logout")',
    'button:has-text("Sign Out")',
    'a:has-text("Logout")',
    '[data-testid="user-menu"] + * button:has-text("Logout")'
  ];

  // First try to open user menu if it exists
  const userMenuSelectors = [
    '[data-testid="user-menu"]',
    'button[aria-label*="user"]',
    '.user-menu',
    'button:has-text("John")',
    'button:has-text("Profile")'
  ];

  for (const selector of userMenuSelectors) {
    try {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        break;
      }
    } catch {
      // Continue to next selector
    }
  }

  // Now try to find logout button
  for (const selector of logoutSelectors) {
    try {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        break;
      }
    } catch {
      // Continue to next selector
    }
  }

  // Verify logout by checking we're redirected to login
  await expect(page).toHaveURL(/\/login/);
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    // Check if we're on a protected page (not login/register)
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/register')) {
      return false;
    }

    // Look for user-specific elements that indicate logged in state
    const loggedInIndicators = [
      'text=Dashboard',
      'button:has-text("Logout")',
      '[data-testid="user-menu"]',
      'text=John', // Demo user name
      'nav a[href="/routes"]'
    ];

    for (const selector of loggedInIndicators) {
      if (await page.locator(selector).isVisible()) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}