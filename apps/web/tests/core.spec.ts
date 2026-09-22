import { test, expect } from '@playwright/test';

test('homepage loads and shows primary call to action', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/NagarGo/);

  // Expect the "Book a delivery" button to be visible
  const bookButton = page.locator('text=Book a delivery').first();
  await expect(bookButton).toBeVisible();
});

test('login page contains phone input', async ({ page }) => {
  await page.goto('/login');
  
  // Look for the phone number input
  const phoneInput = page.getByPlaceholder('017... or 013...');
  await expect(phoneInput).toBeVisible();
});
