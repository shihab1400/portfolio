import { expect, test } from '@playwright/test';

const PUBLISHED = ['portfolio', 'chertnodes', 'protectx', 'kahoot-answers-viewer'];

test('homepage shows exactly three featured projects', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#projects article')).toHaveCount(3);
});

test('projects page lists every published project and no drafts', async ({ page }) => {
  await page.goto('/projects/');
  const links = page.locator('[data-projects-grid] article h2 a');
  await expect(links).toHaveCount(PUBLISHED.length);
  const hrefs = await links.evaluateAll((els) => els.map((el) => el.getAttribute('href')));
  expect(hrefs.sort()).toEqual(PUBLISHED.map((slug) => `/projects/${slug}/`).sort());
  await expect(page.getByText('Weather Dashboard')).toHaveCount(0);
});

test('category filter narrows the list', async ({ page }) => {
  await page.goto('/projects/');
  const items = page.locator('[data-projects-grid] > li:visible');
  await page.getByRole('button', { name: 'bot', exact: true }).click();
  await expect(page.getByRole('button', { name: 'bot', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(items).toHaveCount(1);
  await expect(page.locator('[data-filter-status]')).toHaveText('Showing 1 project.');
  await page.getByRole('button', { name: 'all', exact: true }).click();
  await expect(items).toHaveCount(PUBLISHED.length);
});

test('each card opens its own details page with unique metadata', async ({ page }) => {
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  for (const slug of PUBLISHED) {
    await page.goto('/projects/');
    await page.locator('article', { has: page.locator(`a[href="/projects/${slug}/"]`) }).click();
    await expect(page).toHaveURL(new RegExp(`/projects/${slug}/$`));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'All projects' }).first()).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: 'Contact me' })).toHaveAttribute(
      'href',
      '/#contacts',
    );

    titles.add(await page.title());
    descriptions.add((await page.locator('meta[name="description"]').getAttribute('content'))!);
    expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toMatch(
      new RegExp(`/projects/${slug}/$`),
    );
    const jsonLd = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
    expect(jsonLd['@type']).toBe('CreativeWork');
  }
  expect(titles.size).toBe(PUBLISHED.length);
  expect(descriptions.size).toBe(PUBLISHED.length);
});

test('optional live/repository links are omitted when not provided', async ({ page }) => {
  await page.goto('/projects/protectx/');
  await expect(page.getByRole('link', { name: /Live site/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Source code/ })).toHaveCount(0);
});

test('unknown and draft project slugs return 404', async ({ page }) => {
  for (const path of ['/projects/does-not-exist/', '/projects/weather-dashboard/']) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1, name: '404' })).toBeVisible();
  }
});
