import type { Page, TestInfo } from '@playwright/test';

export const isMobileProject = (testInfo: TestInfo) => testInfo.project.name.startsWith('mobile');

/** Pixels of content overflowing the viewport horizontally (0 = no horizontal scroll). */
export const horizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
