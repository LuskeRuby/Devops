import { request } from '@playwright/test';

/**
 * Runs once before all tests.
 * Registers a E2E test family and parent user via the API so tests
 * never depend on seed data with unknown passwords.
 */
async function globalSetup() {
  // Call the backend directly — ng serve has no /api proxy configured
  const api = await request.newContext({ baseURL: 'http://localhost:8080' });

  // Register the test family — ignore 409 if it already exists
  const registerRes = await api.post('/api/families/register', {
    data: { email: 'e2e@playwright.test', password: 'PlaywrightTest1!' },
  });
  if (!registerRes.ok() && registerRes.status() !== 409) {
    throw new Error(`Failed to register test family: ${registerRes.status()} ${await registerRes.text()}`);
  }

  // Log in to get an access token so we can create a user
  const loginRes = await api.post('/api/families/login', {
    data: { email: 'e2e@playwright.test', password: 'PlaywrightTest1!' },
  });
  if (!loginRes.ok()) {
    throw new Error(`Failed to login as test family: ${loginRes.status()} ${await loginRes.text()}`);
  }
  const { accessToken } = await loginRes.json();

  // Only create the test user if the family has no members yet
  const usersRes = await api.get('/api/users/family/e2e@playwright.test', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const users = usersRes.ok() ? await usersRes.json() : [];
  if (users.length === 0) {
    const createRes = await api.post('/api/users', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
      data: {
        name: 'E2E Parent',
        role: 'PARENT',
        pincode: '0000',
        family: { email: 'e2e@playwright.test' },
      },
    });
    if (!createRes.ok()) {
       throw new Error(`Failed to create test user: ${createRes.status()} ${await createRes.text()}`);
    }
  }

  await api.dispose();
}

export default globalSetup;
