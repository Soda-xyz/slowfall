import { test, expect } from '@playwright/test';
import { visitHome, openTab } from '../test-helpers';

// Provide simple stubbed responses so the page renders
test('database control shows person and airport sections', async ({ page }) => {
  await page.route('**/api/person', async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify([]), headers: { 'Content-Type': 'application/json' } });
  });
  await page.route('**/api/airports', async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify([]), headers: { 'Content-Type': 'application/json' } });
  });

  await visitHome(page);
  await openTab(page, 'Database');

  await expect(page.getByRole('heading', { name: 'Database Control' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add person' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Airports' })).toBeVisible();
});
