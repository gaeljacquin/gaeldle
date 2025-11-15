import { test, expect } from '@playwright/test';

test.describe('Timeline 2 game mode', () => {
  test('should load the page and display the title', async ({ page }) => {
    await page.goto('/timeline-2');
    await expect(page).toHaveTitle(/Gaeldle/);
    await expect(page.getByRole('heading', { name: 'Timeline 2' })).toBeVisible();
  });

  test('should deal a card to the user', async ({ page }) => {
    await page.goto('/timeline-2');

    // Wait for the game to load
    await expect(page.getByText('Loading game...')).not.toBeVisible();

    // Check if the dealt card is visible
    await expect(page.locator('.cursor-grab')).toBeVisible();
  });
});
