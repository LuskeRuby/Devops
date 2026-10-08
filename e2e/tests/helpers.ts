import { Page, expect } from '@playwright/test';

export const FAMILY_EMAIL    = 'e2e@playwright.test';
export const FAMILY_PASSWORD = 'PlaywrightTest1!';
export const MEMBER_NAME     = 'E2E Parent';
export const MEMBER_PIN      = '0000';

/**
 * Logs in by calling the API directly from the browser context and injecting
 * the returned access token into localStorage.  This bypasses the login form
 * entirely, making tests fast and immune to form-interaction quirks on any
 * device/browser combination.
 */
export async function doLogin(page: Page) {
  // Navigate first so we are on the correct origin for localStorage writes
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  const { token, familyEmail } = await page.evaluate(
    async ({ email, password }) => {
      const res = await fetch('/api/families/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // lets the browser store the HttpOnly refresh cookie
      });
      if (!res.ok) throw new Error(`Login API returned ${res.status}`);
      const data = await res.json();
      return { token: data.accessToken as string, familyEmail: data.familyEmail as string };
    },
    { email: FAMILY_EMAIL, password: FAMILY_PASSWORD },
  );

  // Write the auth state that AuthService reads on bootstrap
  await page.evaluate(
    ({ token, familyEmail }) => {
      localStorage.setItem('auth.accessToken', token);
      localStorage.setItem('auth.familyEmail', familyEmail);
      localStorage.setItem('auth.persist', '1');
    },
    { token, familyEmail },
  );

  // A fresh page.goto re-bootstraps Angular, which reads localStorage and
  // marks the user as authenticated before the route guard runs
  await page.goto('/select-member');
  await expect(page).toHaveURL(/\/select-member/, { timeout: 10_000 });
}

/**
 * Full login → select member → enter PIN flow.
 */
export async function loginAsDave(page: Page) {
  await doLogin(page);
  await page.locator('.user-card', { hasText: MEMBER_NAME }).click();
  await expect(page).toHaveURL(/\/member-pin/, { timeout: 5_000 });

  const pinBoxes = page.locator('.pin-box');
  for (let i = 0; i < MEMBER_PIN.length; i++) {
    await pinBoxes.nth(i).click();
    await pinBoxes.nth(i).pressSequentially(MEMBER_PIN[i]);
  }

  await expect(page).toHaveURL(/\/dashboard|\/home/, { timeout: 10_000 });
}
