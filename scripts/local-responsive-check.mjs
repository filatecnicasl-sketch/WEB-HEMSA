import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const base = process.env.LOCAL_WEB_URL || 'http://127.0.0.1:4173';
const credentials = JSON.parse(await readFile(new URL('../local-server/private/admin.json', import.meta.url), 'utf8'));
const output = new URL('../test-output/local-responsive/', import.meta.url);
const outputFile = (name) => fileURLToPath(new URL(name, output));
await mkdir(output, { recursive: true });
const checks = [];
const errors = [];
const browser = await chromium.launch({ headless: true });

function check(name, passed, details = {}) { checks.push({ name, passed: Boolean(passed), ...details }); }
function observe(page) {
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', (response) => { if (response.url().startsWith(base) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
}

try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await desktop.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
  const page = await desktop.newPage();
  observe(page);
  await page.goto(base, { waitUntil: 'networkidle' });
  const performance = await page.evaluate(() => {
    const resources = window.performance.getEntriesByType('resource');
    return { requests: resources.length, transferredBytes: resources.reduce((total, resource) => total + (resource.transferSize || 0), 0) };
  });
  check('Medición de portada disponible', performance.requests > 0, performance);
  await page.goto(`${base}/gestor`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: outputFile('01-acceso-escritorio.png'), fullPage: true });
  const loginInput = await page.getByLabel('Correo electrónico').boundingBox();
  check('Campo de acceso ocupa el ancho del formulario', loginInput.width > 250, { width: loginInput.width });
  await page.getByLabel('Correo electrónico').fill(credentials.email);
  await page.getByLabel('Contraseña').fill(credentials.password);
  await page.getByRole('button', { name: 'Entrar al gestor' }).click();
  await page.getByRole('heading', { name: 'Editar Inicio y aviso destacado' }).waitFor();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: outputFile('02-editor-escritorio.png'), fullPage: true });
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  await mobile.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
  const phone = await mobile.newPage();
  observe(phone);
  for (const [name, route] of [['inicio', '/'], ['ayudas', '/ayudas-y-subvenciones'], ['empleo', '/empleo'], ['acceso', '/gestor']]) {
    await phone.goto(`${base}${route}`, { waitUntil: 'networkidle' });
    const dimensions = await phone.evaluate(() => ({ viewport: window.innerWidth, content: document.documentElement.scrollWidth }));
    check(`Sin desbordamiento móvil en ${name}`, dimensions.content <= dimensions.viewport, dimensions);
    if (name === 'inicio' || name === 'acceso') await phone.screenshot({ path: outputFile(`03-${name}-movil.png`), fullPage: true });
  }
  await mobile.close();
  check('Sin errores de consola o HTTP', errors.length === 0, { errors });
} finally {
  await browser.close();
  const report = { passed: checks.every((item) => item.passed), checks, errors };
  await writeFile(new URL('report.json', output), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
}
