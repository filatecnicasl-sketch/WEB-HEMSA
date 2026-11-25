import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const server = await preview({ preview: { host: '127.0.0.1', port: 5187, strictPort: true } });
let browser;
const errors = [];
try {
  await mkdir('test-output/locales-title-check', { recursive: true });
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:5187/servicios', { waitUntil: 'networkidle' });
  const title = await page.locator('main h1').textContent();
  const description = await page.locator('.page-hero p').textContent();
  if (title !== 'Locales y parcelas' || errors.length) throw new Error(JSON.stringify({ title, errors }));
  await page.locator('.page-hero').screenshot({ path: 'test-output/locales-title-check/locales-hero.jpg', type: 'jpeg', quality: 90 });
  console.log(JSON.stringify({ title, description, consoleErrors: errors, passed: true }, null, 2));
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
