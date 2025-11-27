import { test, expect } from '@playwright/test';
import { visitHome, openTab } from '../test-helpers';

test('navigates between Dashboard and Database tabs', async ({ page }) => {
  await visitHome(page);
  await openTab(page, 'Database');
  await expect(page.getByRole('heading', { name: 'Database Control' })).toBeVisible();

  await openTab(page, 'Dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
