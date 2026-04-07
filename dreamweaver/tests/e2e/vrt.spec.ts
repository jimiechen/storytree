import { test, expect } from '@playwright/test';

// Configuration for our VRT matrix
const MATRIX = [
  { locale: 'zh-CN', theme: 'light' },
  { locale: 'zh-CN', theme: 'dark' },
  { locale: 'en-US', theme: 'light' },
  { locale: 'en-US', theme: 'dark' },
];

const ROUTES = [
  { name: 'Characters', path: '/workbench/test-project-id/characters' },
  { name: 'Outline', path: '/workbench/test-project-id/outline' },
  // Exclude branches because react-flow rendering might have dynamic positioning issues in screenshots
];

test.describe('Visual Regression Testing', () => {
  // Use a fixed viewport for consistent screenshots
  test.use({ viewport: { width: 1440, height: 900 } });

  // Setup: Ensure we have a consistent state
  test.beforeEach(async ({ page }) => {
    // Wait for Next.js router to be ready
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
  });

  for (const { locale, theme } of MATRIX) {
    for (const route of ROUTES) {
      test(`VRT: ${route.name} - ${locale} - ${theme}`, async ({ page }) => {
        // Set the theme in localStorage before navigating
        await page.addInitScript((themeSetting) => {
          localStorage.setItem('theme', themeSetting);
        }, theme);

        // Navigate to the localized route
        const url = `/${locale}${route.path}`;
        await page.goto(url, { waitUntil: 'networkidle' });

        // Wait for potential dynamic content (like characters loading)
        // Wait for the main container or specific test-id
        if (route.name === 'Characters') {
          await page.waitForSelector('[data-testid="characters-page"]', { state: 'visible' });
          // Wait for cards to render if any, or empty state
          await page.waitForTimeout(1000); 
        } else if (route.name === 'Outline') {
          // Wait for outline to load
          await page.waitForTimeout(1000);
        }

        // Take a full page screenshot and compare
        // The snapshot name is automatically generated based on the test name
        await expect(page).toHaveScreenshot(`${route.name.toLowerCase()}-${locale}-${theme}.png`, {
          fullPage: true,
          // Mask out elements that might change (like dynamic timestamps or user avatars)
          mask: [page.locator('img[alt="Profile"]')]
        });
      });
    }
  }
});
