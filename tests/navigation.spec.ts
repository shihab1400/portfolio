import { expect, test } from '@playwright/test';
import { isMobileProject } from './helpers';

test.describe('desktop navigation', () => {
  test.beforeEach(({}, testInfo) => test.skip(isMobileProject(testInfo), 'desktop layout only'));

  test('navbar stays pinned to the top while scrolling', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo({ top: 3000, behavior: 'instant' }));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
    const header = page.locator('header.site-header');
    expect((await header.boundingBox())?.y).toBe(0);
    await expect(header).toBeInViewport();
  });

  for (const section of ['projects', 'about-me', 'contacts', 'home']) {
    test(`nav link scrolls to #${section} without hiding it under the header`, async ({ page }) => {
      await page.goto('/');
      if (section === 'home') await page.evaluate(() => window.scrollTo({ top: 2000, behavior: 'instant' }));
      await page.getByRole('navigation', { name: 'Main' }).locator(`a[href="/#${section}"]`).click();
      await expect(page).toHaveURL(new RegExp(`/#${section}$`));
      // Sections cancel their top padding with a negative scroll-margin, so the padding may
      // scroll under the navbar by design; the section's heading must stay visible below it.
      const headingId = await page.locator(`#${section}`).getAttribute('aria-labelledby');
      const heading = page.locator(`#${headingId}`);
      await expect(heading).toBeInViewport();
      await expect
        .poll(async () => {
          const headerHeight = (await page.locator('header.site-header').boundingBox())!.height;
          return (await heading.boundingBox())!.y >= headerHeight - 1;
        })
        .toBe(true);
    });
  }

  test('nav links on inner pages go to homepage sections', async ({ page }) => {
    await page.goto('/about/');
    await expect(page.locator('a[aria-current="page"]')).toHaveText('#about-me');
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'projects' }).click();
    await expect(page).toHaveURL(/\/#projects$/);
    await expect(page.locator('#projects')).toBeInViewport();
  });

  test('View all and Read more open their pages', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'View all projects' }).click();
    await expect(page).toHaveURL(/\/projects\/$/);
    await expect(page.getByRole('heading', { level: 1, name: 'projects' })).toBeVisible();

    await page.goto('/');
    await page.getByRole('link', { name: 'Read more' }).click();
    await expect(page).toHaveURL(/\/about\/$/);
  });

  test('skip link is the first focusable element', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Safari only Tabs to links when that setting is on');
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });
});

test.describe('mobile menu', () => {
  test.beforeEach(({}, testInfo) => test.skip(!isMobileProject(testInfo), 'mobile layout only'));

  test('hamburger opens, fits the screen, and closes on link selection and Escape', async ({ page }) => {
    await page.goto('/');
    const toggle = page.locator('[data-menu-toggle]');
    const menu = page.locator('#nav-menu');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAccessibleName('Open menu');
    await expect(menu).toBeHidden();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toHaveAccessibleName('Close menu');
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('button', { name: /Switch to (light|dark) theme/ })).toBeVisible();

    const box = (await menu.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width);

    await menu.getByRole('link', { name: 'contacts' }).click();
    await expect(menu).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page).toHaveURL(/#contacts$/);
    await expect(page.locator('#contacts')).toBeInViewport();

    await toggle.click();
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(toggle).toBeFocused();
  });
});

test('no broken internal links', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'crawl once');
  const queue = ['/'];
  const seen = new Set<string>();
  while (queue.length) {
    const path = queue.shift()!;
    if (seen.has(path)) continue;
    seen.add(path);
    const response = await page.goto(path);
    expect(response?.status(), `status of ${path}`).toBe(200);
    const paths = await page.$$eval('a[href^="/"]:not([download])', (links) =>
      links.map((a) => new URL((a as HTMLAnchorElement).href).pathname),
    );
    queue.push(...paths.filter((p) => !seen.has(p)));
    // Download links (e.g. the CV) would trigger a download in page.goto, so fetch them instead.
    const downloads = await page.$$eval('a[href^="/"][download]', (links) =>
      links.map((a) => new URL((a as HTMLAnchorElement).href).pathname),
    );
    for (const file of downloads.filter((p) => !seen.has(p))) {
      seen.add(file);
      expect((await page.request.get(file)).status(), `status of ${file}`).toBe(200);
    }
  }
  expect(seen.size).toBeGreaterThanOrEqual(7);
});
