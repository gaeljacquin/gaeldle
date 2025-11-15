import { test, expect } from '@playwright/test';

test.describe('Specifications game mode', () => {
  test('should load the page and display the title', async ({ page }) => {
    await page.goto('/specifications');
    await expect(page).toHaveTitle(/Gaeldle/);
    await expect(page.getByRole('heading', { name: 'Specifications' })).toBeVisible();
  });

  test('should allow a user to make a guess', async ({ page }) => {
    await page.goto('/specifications');

    // Wait for the game to load
    await expect(page.getByText('Loading game...')).not.toBeVisible();

    // Search for a game
    await page.getByRole('combobox').click();
    await page.getByRole('combobox').fill('Gael');
    await page.getByRole('option', { name: 'Gael' }).click();

    // Submit the guess
    await page.getByRole('button', { name: 'Submit' }).click();

    // Check if the guess is in the grid
    await expect(page.getByRole('grid')).toHaveText(/Gael/);
  });
});
