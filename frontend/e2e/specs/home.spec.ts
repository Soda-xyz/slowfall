import { test, expect } from '@playwright/test';

test('home page shows app title', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await expect(page.locator('text=Slowfall')).toBeVisible();
});

