import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  globalSetup: './tests/global-setup.ts',
  testDir: './tests',
  fullyParallel: false,
  retries: 1,
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  projects: [
    // Parent view — desktop
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    // Child view — mobile
    {
      name: 'iPhone 13',
      use: { ...devices['iPhone 13'] },
    },
  ],
  // Start both servers before tests run
  webServer: [
    {
      command: 'cd backend && mvn spring-boot:run -Dspring.profiles.active=test',
      url: 'http://localhost:8080/actuator/health',
      timeout: 120_000,
      reuseExistingServer: true,
    },
    {
      command: 'cd frontend && ng serve',
      url: 'http://localhost:4200',
      timeout: 60_000,
      reuseExistingServer: true,
    },
  ],
});
