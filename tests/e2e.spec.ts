import { test, expect } from '@playwright/test';
import { doLogin, MEMBER_NAME, MEMBER_PIN } from './helpers';

/**
 * Happy-path E2E tests.
 */

test('full login flow: family login → select member → enter PIN → dashboard', async ({ page }) => {
  // Step 1: Log in as the test family (via API token injection)
  await doLogin(page);
  await expect(page).toHaveURL(/\/select-member/);

  // Step 2: Select the family member
  await page.locator('.user-card', { hasText: MEMBER_NAME }).first().click();
  await expect(page).toHaveURL(/\/member-pin/, { timeout: 5_000 });

  // Step 3: Enter the PIN
  const pinBoxes = page.locator('.pin-box');
  for (let i = 0; i < MEMBER_PIN.length; i++) {
    await pinBoxes.nth(i).click();
    await pinBoxes.nth(i).pressSequentially(MEMBER_PIN[i]);
  }

  // Step 4: Land on the dashboard
  await expect(page).toHaveURL(/\/dashboard|\/home/, { timeout: 10_000 });
});

test('parent can create a task', async ({ page }) => {
  // Get fully logged in first
  await doLogin(page);
  await page.locator('.user-card', { hasText: MEMBER_NAME }).first().click();
  const pinBoxes = page.locator('.pin-box');
  for (let i = 0; i < MEMBER_PIN.length; i++) {
    await pinBoxes.nth(i).click();
    await pinBoxes.nth(i).pressSequentially(MEMBER_PIN[i]);
  }
  await expect(page).toHaveURL(/\/dashboard|\/home/, { timeout: 10_000 });

  // Navigate to the task page and create a task
  await page.goto('/task');
  const taskName = `E2E task ${Date.now()}`;
  await page.locator('#name').fill(taskName);
  await page.locator('#description').fill('Created by Playwright');
  await page.locator('#repeatEvery').selectOption('Weekly');
  await page.locator('.user-checkbox input').first().check();
  await page.getByRole('button', { name: 'Gem Opgave' }).click();

  // After a successful save the component calls taskForm.reset(), clearing the name field.
  // An empty #name is the reliable signal that the API call completed and the subscribe
  // callback ran — the /task page has no task list to inspect directly.
  await expect(page.locator('#name')).toHaveValue('', { timeout: 5_000 });
});
