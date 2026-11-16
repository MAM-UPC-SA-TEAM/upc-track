// Pruebas end-to-end (navegador real contra backend + PostgreSQL reales).
//
// Aislamiento: el e2e usa SU PROPIA base (docker-compose.e2e.yml, puerto 5434) y fuerza
// DATABASE_URL vacío para que ni siquiera un backend/.env con una base en la nube pueda colarse.
// Puertos propios (3100 / 5180) para no chocar con `npm run dev`.
import { defineConfig, devices } from '@playwright/test'

const API = 'http://localhost:3100'
const WEB = 'http://localhost:5180'

export const BD_E2E = {
  DATABASE_URL: '',
  DB_HOST: '127.0.0.1',
  DB_PORT: '5434',
  DB_USER: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_NAME: 'bd_e2e',
  DB_SSL: 'false',
}

export default defineConfig({
  testDir: './e2e/tests',
  globalSetup: './e2e/global-setup.js',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // los flujos comparten una BD: se ejecutan en orden
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: WEB,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'es-CO',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node src/server.js',
      cwd: 'backend',
      url: `${API}/api/health`,
      reuseExistingServer: !process.env.CI,
      env: {
        ...BD_E2E,
        NODE_ENV: 'development',
        PORT: '3100',
        JWT_SECRET: 'secreto-solo-para-e2e',
        JWT_EXPIRES_IN: '1h',
        CLIENT_URL: WEB,
      },
    },
    {
      command: 'npx vite --port 5180 --strictPort',
      cwd: 'frontend',
      url: WEB,
      reuseExistingServer: !process.env.CI,
      env: { VITE_API_URL: API },
    },
  ],
})
