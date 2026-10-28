import { expect, test } from '@playwright/test';
import { publications } from '../src/data/publications';

const [paper] = publications;

test('about page table of contents links to the publications block', async ({ page }) => {
  await page.goto('/about/');
  await page.getByRole('navigation', { name: 'On this page' }).getByRole('link', { name: 'publications' }).click();
  await expect(page).toHaveURL(/#publications$/);
  await expect(page.locator('#publications')).toBeInViewport();
  const link = page.getByRole('link', { name: paper.title });
  await expect(link).toHaveAttribute('href', paper.url);
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', /noopener/);
});
