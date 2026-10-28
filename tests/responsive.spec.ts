import { expect, test } from '@playwright/test';
import { horizontalOverflow, isMobileProject } from './helpers';

const WIDTHS = [320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920];
const PAGES = ['/', '/about/', '/projects/', '/projects/ainkhoj/', '/404'];

test.describe('responsive layout', () => {
  test.beforeEach(({}, testInfo) => test.skip(isMobileProject(testInfo), 'desktop engines resize freely'));

  for (const width of WIDTHS) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of PAGES) {
        await page.goto(path);
        expect(await horizontalOverflow(page), `${path} at ${width}px`).toBeLessThanOrEqual(0);
      }
    });
  }

  test('social sidebar only appears on wide screens', async ({ page }) => {
    const sidebar = page.getByRole('complementary', { name: 'Social profiles' });
    const cases = [
      [375, false],
      [768, false],
      [1024, false],
      [1280, true],
      [1920, true],
    ] as const;
    for (const [width, visible] of cases) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      if (visible) await expect(sidebar).toBeVisible();
      else await expect(sidebar).toBeHidden();
    }
  });

  test('hamburger replaces the link list below 768px', async ({ page }) => {
    await page.setViewportSize({ width: 767, height: 900 });
    await page.goto('/');
    await expect(page.locator('[data-menu-toggle]')).toBeVisible();
    await expect(page.locator('#nav-menu')).toBeHidden();
    await page.setViewportSize({ width: 768, height: 900 });
    await expect(page.locator('[data-menu-toggle]')).toBeHidden();
    await expect(page.locator('#nav-menu')).toBeVisible();
  });
});

test('no horizontal overflow on this device', async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);
    expect(await horizontalOverflow(page), path).toBeLessThanOrEqual(0);
  }
});

test('pages have one h1, image alt text, core metadata and no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  for (const path of PAGES.slice(0, 4)) {
    await page.goto(path);
    // Counted via the DOM API: Playwright locators would also see the dev toolbar's shadow DOM.
    expect(await page.evaluate(() => document.querySelectorAll('h1').length), path).toBe(1);
    await expect(page.locator('img:not([alt])')).toHaveCount(0);
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
  }
  expect(errors).toEqual([]);
});
