import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const base = process.env.LOCAL_WEB_URL || 'http://127.0.0.1:4173';
const output = new URL('../test-output/admin-login-layout/', import.meta.url);
const file = (name) => fileURLToPath(new URL(name, output));
const checks = [];
const details = [];
const consoleErrors = [];
let browser;

await mkdir(output, { recursive: true });
try {
  browser = await chromium.launch({ headless: true });
  for (const viewport of [{ width: 700, height: 765, name: 'ordenador' }, { width: 375, height: 812, name: 'movil' }]) {
    const context = await browser.newContext({ viewport });
    await context.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
    const page = await context.newPage();
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    await page.goto(`${base}/gestor`, { waitUntil: 'networkidle' });
    const state = await page.evaluate(() => {
      const labels = [...document.querySelectorAll('.admin-login-card form label')];
      const inputs = [...document.querySelectorAll('.admin-login-card form input')];
      return {
        labels: labels.map((label) => ({ display: getComputedStyle(label).display, direction: getComputedStyle(label).flexDirection, width: label.getBoundingClientRect().width })),
        inputs: inputs.map((input) => ({ display: getComputedStyle(input).display, width: input.getBoundingClientRect().width, borderRadius: getComputedStyle(input).borderRadius, borderWidth: getComputedStyle(input).borderTopWidth })),
        overflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    });
    details.push({ viewport: viewport.name, ...state });
    checks.push({ name: `Etiquetas verticales en ${viewport.name}`, passed: state.labels.length === 2 && state.labels.every((label) => label.display === 'flex' && label.direction === 'column') });
    checks.push({ name: `Campos a todo el ancho en ${viewport.name}`, passed: state.inputs.length === 2 && state.inputs.every((input, index) => Math.abs(input.width - state.labels[index].width) < 2 && input.borderRadius === '7px') });
    checks.push({ name: `Sin desbordamiento en ${viewport.name}`, passed: !state.overflow });
    await page.screenshot({ path: file(`${viewport.name}.png`), fullPage: true });
    await context.close();
  }
  checks.push({ name: 'Sin errores de consola', passed: consoleErrors.length === 0 });
} catch (error) {
  checks.push({ name: 'Prueba ejecutada', passed: false, error: error.message });
} finally {
  if (browser) await browser.close();
  await writeFile(file('report.json'), JSON.stringify({ checks, details, consoleErrors }, null, 2));
}

console.log(JSON.stringify({ checks, details, consoleErrors }, null, 2));
process.exitCode = checks.some((check) => !check.passed) ? 1 : 0;
