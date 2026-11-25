import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('test-output', { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5173, strictPort: true } });
let browser;
const report = { checks: {}, consoleErrors: [] };

try {
  await server.listen();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => report.consoleErrors.push(error.message));

  await page.goto('http://127.0.0.1:5173/area-sad', { waitUntil: 'networkidle' });
  report.checks.gatewayTitle = await page.locator('h1').innerText();
  await page.screenshot({ path: 'test-output/sad-access-desktop.png', fullPage: true });

  await page.getByRole('button', { name: 'Entrar en la demostración' }).click();
  report.checks.privateDashboard = await page.locator('h1').innerText();
  await page.screenshot({ path: 'test-output/sad-agent-desktop.png', fullPage: true });

  await page.getByRole('button', { name: 'Avisar de una ausencia', exact: true }).click();
  await page.locator('.sad-action-card').waitFor({ state: 'visible' });
  report.checks.absenceRequiresConfirmation = await page.locator('.sad-action-card').isVisible();
  await page.locator('.sad-action-card').getByRole('button', { name: 'Confirmar aviso' }).click();
  report.checks.absenceReference = await page.locator('.sad-message-reference').last().innerText();
  report.checks.visitNoticeUpdated = await page.locator('.sad-visit-notice').isVisible();

  await page.getByRole('button', { name: /Mis gestiones/ }).click();
  report.checks.requestHistoryCount = await page.locator('.sad-request-item').count();
  report.checks.requestPending = await page.locator('.sad-request-status').first().innerText();
  await page.screenshot({ path: 'test-output/sad-requests-desktop.png', fullPage: true });

  await page.getByRole('button', { name: 'Mi asistente' }).click();
  await page.getByRole('button', { name: 'Quiero hablar con coordinación', exact: true }).click();
  await page.locator('.sad-action-card').last().waitFor({ state: 'visible' });
  await page.locator('.sad-action-card').last().getByRole('button', { name: 'Solicitar llamada' }).click();
  await page.getByRole('button', { name: /Mis gestiones/ }).click();
  report.checks.handoffHistoryCount = await page.locator('.sad-request-item').count();

  await page.getByRole('button', { name: 'Mi asistente' }).click();
  await page.locator('#sad-message').fill('Me he caído y necesito una ambulancia');
  await page.locator('.sad-composer').getByRole('button', { name: 'Enviar mensaje' }).click();
  await page.waitForFunction(() => [...document.querySelectorAll('.sad-message-bubble')].some((node) => node.textContent.includes('llama ahora al 112')));
  report.checks.emergencyGuidance = true;

  report.checks.sadStorageKeys = await page.evaluate(() => Object.keys(localStorage).filter((key) => /sad|message|conversation/i.test(key)));
  await page.reload({ waitUntil: 'networkidle' });
  report.checks.reloadReturnsToPrivateGateway = await page.getByRole('button', { name: 'Entrar en la demostración' }).isVisible();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto('http://127.0.0.1:5173/area-sad', { waitUntil: 'networkidle' });
  await mobile.getByRole('button', { name: 'Entrar en la demostración' }).click();
  report.checks.horizontalOverflowMobile = await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  await mobile.screenshot({ path: 'test-output/sad-agent-mobile.png', fullPage: true });
  await mobile.close();
} finally {
  if (browser) await browser.close();
  await server.close();
  await writeFile('test-output/sad-agent-report.json', JSON.stringify(report, null, 2));
}

console.log(JSON.stringify(report, null, 2));
