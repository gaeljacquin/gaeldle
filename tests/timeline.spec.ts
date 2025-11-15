import { test, expect } from '@playwright/test';

test.describe('Timeline game mode', () => {
  test('should load the page and display the title', async ({ page }) => {
    await page.goto('/timeline');
    await expect(page).toHaveTitle(/Gaeldle/);
    await expect(page.getByRole('heading', { name: 'Timeline' })).toBeVisible();
  });

  test('should allow a user to submit the initial order', async ({ page }) => {
    await page.goto('/timeline');

    // Wait for the game to load
    await expect(page.getByText('Loading game...')).not.toBeVisible();

    // Submit the initial order
    await page.getByRole('button', { name: 'Submit' }).click();

    // Check if the cards have been updated with feedback (e.g., showing the date)
    // This is a simple check to see if the state has changed after submission.
    // A more robust test would check the color of the cards or the exact date.
    await expect(page.locator('.text-sm.text-slate-500').first()).toBeVisible();
  });
});
