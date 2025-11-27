import type { Page } from "@playwright/test";

export async function visitHome(page: Page) {
  await page.goto('/');
  await page.getByRole('heading', { name: 'Slowfall' }).waitFor({ state: 'visible' });
}

export async function openTab(page: Page, tabName: string) {
  await page.getByRole('tab', { name: tabName }).click();
  // wait for a heading with the same name (pages use Title with same text)
  await page.getByRole('heading', { name: tabName === 'Database' ? 'Database Control' : tabName }).waitFor({ state: 'visible' });
}

export async function waitForNotification(page: Page, text: RegExp | string) {
  // Mantine notifications render as divs containing the message text. Use getByText for simplicity.
  await page.getByText(text).waitFor({ state: 'visible' });
}

export async function fillPersonForm(page: Page, { name, weight, email }: { name: string; weight: string; email: string; }) {
  // Find the 'Add person' button and then locate its ancestor form to scope inputs precisely
  const addButton = page.getByRole('button', { name: 'Add person' });
  const form = addButton.locator('xpath=ancestor::form');
  await form.getByLabel('Name').fill(name);
  await form.getByLabel('Weight').fill(weight);
  await form.getByLabel('Email').fill(email);
  await addButton.click();
}

// Removed the verbose jump form helper (it was specific to the archived jump-form.spec.ts).
// Provide a small stub so callers fail fast and the file no longer contains test-specific logic.
export async function fillJumpForm(page: Page, _opts: { date: string; time: string; altitude: string; craft?: string; }) {
  throw new Error('fillJumpForm helper has been removed because the jump-form e2e spec was archived. Restore from e2e/backup if needed.');
}
