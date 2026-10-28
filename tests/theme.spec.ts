import { expect, test, type Page } from '@playwright/test';
import { isMobileProject } from './helpers';

const themeOf = (page: Page) => page.evaluate(() => document.documentElement.dataset.theme);

async function toggleTheme(page: Page, mobile: boolean) {
  if (mobile) await page.locator('[data-menu-toggle]').click();
  await page.getByRole('button', { name: /Switch to (light|dark) theme/ }).click();
}

test('defaults to dark and persists the chosen theme across pages and reloads', async ({ page }, testInfo) => {
  const mobile = isMobileProject(testInfo);
  await page.goto('/');
  expect(await themeOf(page)).toBe('dark');
  const bgDark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

  await toggleTheme(page, mobile);
  expect(await themeOf(page)).toBe('light');
  await expect(page.getByRole('button', { name: 'Switch to dark theme' })).toBeAttached();
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe(bgDark);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#F6F6F8');

  await page.reload();
  expect(await themeOf(page)).toBe('light');
  await page.goto('/projects/ainkhoj/');
  expect(await themeOf(page)).toBe('light');

  await toggleTheme(page, mobile);
  await page.goto('/about/');
  expect(await themeOf(page)).toBe('dark');
});

test('saved theme is applied before first paint (no flash)', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'light');
    // Record the theme the moment <body> is created, before any deferred script runs.
    new MutationObserver((_, observer) => {
      if (document.body) {
        document.documentElement.setAttribute('data-first-theme', document.documentElement.dataset.theme ?? '');
        observer.disconnect();
      }
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-first-theme', 'light');
});
