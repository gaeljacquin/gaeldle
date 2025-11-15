import { test, expect } from '@playwright/test';

test.describe('Cover Art game mode', () => {
  test('should load the page and display the title', async ({ page }) => {
    await page.goto('/cover-art');
    await expect(page).toHaveTitle(/Gaeldle/);
    await expect(page.getByRole('heading', { name: 'Cover Art' })).toBeVisible();
  });

  test('should allow a user to make a guess', async ({ page }) => {
    await page.goto('/cover-art');

    // Wait for the game to load
    await expect(page.getByText('Loading game...')).not.toBeVisible();

    // Search for a game
    await page.getByRole('combobox').click();
    await page.getByRole('combobox').fill('Gael');
    await page.getByRole('option', { name: 'Gael' }).click();

    // Submit the guess
    await page.getByRole('button', { name: 'Submit' }).click();

    // Check if the guess is in the history
    await expect(page.getByTestId('guess-history-inline')).toHaveText(/Gael/);
  });
});
