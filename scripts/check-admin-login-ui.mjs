import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const base = process.env.LOCAL_WEB_URL || 'http://localhost:7100';
const output = new URL('../test-output/admin-login-ui/', import.meta.url);
const file = (name) => fileURLToPath(new URL(name, output));
const credentials = JSON.parse(await readFile(new URL('../local-server/private/admin.json', import.meta.url), 'utf8'));
let browser;
let result;

await mkdir(output, { recursive: true });
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 700, height: 765 } });
  await context.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
  const page = await context.newPage();
  const responseErrors = [];
  const consoleErrors = [];
  page.on('response', (response) => {
    if (response.url().startsWith(base) && response.status() >= 400) responseErrors.push(`${response.status()} ${response.url()}`);
  });
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto(`${base}/gestor`, { waitUntil: 'networkidle' });
  await page.getByLabel('Correo electrónico').fill(credentials.email);
  await page.getByLabel('Contraseña').fill(credentials.password);
  await page.getByRole('button', { name: 'Entrar al gestor' }).click();
  const outcome = await Promise.race([
    page.getByRole('heading', { name: 'Editar Inicio y aviso destacado' }).waitFor({ timeout: 15000 }).then(() => 'correcto'),
    page.locator('.admin-error').first().waitFor({ timeout: 15000 }).then(async () => `error: ${await page.locator('.admin-error').first().textContent()}`),
  ]).catch(() => 'sin respuesta visible');
  result = { outcome, responseErrors, consoleErrors };
  await page.screenshot({ path: file('resultado.png'), fullPage: true });
} finally {
  if (browser) await browser.close();
  await writeFile(file('report.json'), JSON.stringify(result, null, 2));
}

console.log(JSON.stringify(result, null, 2));
process.exitCode = result?.outcome === 'correcto' ? 0 : 1;
