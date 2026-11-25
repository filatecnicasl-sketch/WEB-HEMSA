import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const base = process.env.LOCAL_WEB_URL || 'http://127.0.0.1:4173';
const output = new URL('../test-output/contact-forms/', import.meta.url);
const file = (name) => fileURLToPath(new URL(name, output));
const checks = [];
const consoleErrors = [];
const responseErrors = [];
const contact = { name: 'Prueba Local HEMSA', email: 'prueba.local@example.org', phone: '600 000 000', subject: 'Información general', message: 'Mensaje local para verificar el envío del formulario.', privacy: true, website: '' };
const future = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
const appointment = { name: 'Prueba Local HEMSA', email: 'prueba.local@example.org', phone: '600 000 000', service: 'Información general', date: future, notes: 'Solicitud local para comprobar la cita previa.', privacy: true, website: '' };
let browser;

function check(name, passed, details = {}) {
  checks.push({ name, passed: Boolean(passed), ...details });
}

async function post(path, body, headers = {}) {
  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return { status: response.status, data };
}

await mkdir(output, { recursive: true });
try {
  const invalid = await post('/api/public/contact', { ...contact, message: 'Corto' });
  check('El servidor rechaza un mensaje demasiado corto', invalid.status === 400 && invalid.data.error.code === 'VALIDATION_ERROR');
  const noConsent = await post('/api/public/appointments', { ...appointment, privacy: false });
  check('El servidor exige el consentimiento de privacidad', noConsent.status === 400);
  const pastDate = await post('/api/public/appointments', { ...appointment, date: '2020-01-01' });
  check('El servidor rechaza una cita en una fecha pasada', pastDate.status === 400);
  const badOrigin = await post('/api/public/contact', contact, { Origin: 'https://origen-no-permitido.example' });
  check('El servidor bloquea orígenes no permitidos', badOrigin.status === 403);
  const honeypot = await post('/api/public/contact', { ...contact, website: 'relleno-automatico' });
  check('El filtro automático no confirma una referencia falsa', honeypot.status === 201 && !honeypot.data.reference);

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
  const page = await context.newPage();
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('response', (response) => {
    if (response.url().startsWith(base) && response.status() >= 400) responseErrors.push(`${response.status()} ${response.url()}`);
  });

  await page.goto(`${base}/contacto`, { waitUntil: 'networkidle' });
  check('La página de Contacto abre correctamente', await page.getByRole('heading', { name: 'Envíanos un mensaje' }).isVisible());
  await page.getByLabel('Nombre y apellidos *').fill(contact.name);
  await page.getByLabel('Correo electrónico *').fill(contact.email);
  await page.getByLabel('Teléfono', { exact: true }).fill(contact.phone);
  await page.getByLabel('Mensaje *').fill(contact.message);
  await page.locator('input[name=privacy]').check();
  await page.getByRole('button', { name: 'Enviar mensaje', exact: true }).click();
  await page.getByText(/Hemos recibido tu mensaje correctamente\. Referencia: CON-/).waitFor({ timeout: 15000 });
  check('Contacto confirma el envío con una referencia', page.url() === `${base}/contacto`);
  check('Contacto limpia los campos después de enviar', await page.getByLabel('Mensaje *').inputValue() === '');
  await page.screenshot({ path: file('01-contacto-enviado.png'), fullPage: true });

  await page.goto(`${base}/cita-previa`, { waitUntil: 'networkidle' });
  check('La página de Pedir cita abre correctamente', await page.getByRole('heading', { name: 'Pide tu cita previa, te llamamos' }).isVisible());
  await page.getByLabel('Nombre y apellidos', { exact: true }).fill(appointment.name);
  await page.getByLabel('Teléfono', { exact: true }).fill(appointment.phone);
  await page.getByLabel('Email', { exact: true }).fill(appointment.email);
  await page.locator('select[name=service]').selectOption({ label: appointment.service });
  await page.getByLabel('Fecha preferida', { exact: true }).fill(appointment.date);
  await page.getByLabel(/Comentario/).fill(appointment.notes);
  await page.locator('input[name=privacy]').check();
  await page.getByRole('button', { name: 'Solicitar cita', exact: true }).click();
  await page.getByText(/Hemos recibido tu solicitud\. Referencia: CIT-/).waitFor({ timeout: 15000 });
  check('Cita previa confirma el envío con una referencia', page.url() === `${base}/cita-previa`);
  check('Cita previa limpia los campos después de enviar', await page.getByLabel('Nombre y apellidos', { exact: true }).inputValue() === '');
  await page.screenshot({ path: file('02-cita-enviada.png'), fullPage: true });

  await page.setViewportSize({ width: 375, height: 812 });
  for (const [path, name] of [['/contacto', '03-contacto-movil.png'], ['/cita-previa', '04-cita-movil.png']]) {
    await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
    const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: window.innerWidth }));
    check(`Sin desplazamiento horizontal móvil en ${path}`, dimensions.scroll <= dimensions.viewport, dimensions);
    await page.screenshot({ path: file(name), fullPage: true });
  }
  check('Sin errores de consola', consoleErrors.length === 0, { errors: consoleErrors });
  check('Sin respuestas HTTP de error en el navegador', responseErrors.length === 0, { errors: responseErrors });
} catch (error) {
  check('Ejecución de la prueba completada', false, { error: error.message });
} finally {
  if (browser) await browser.close();
  await writeFile(file('browser-report.json'), JSON.stringify({ checks, consoleErrors, responseErrors }, null, 2));
}

const failed = checks.filter((item) => !item.passed);
console.log(JSON.stringify({ total: checks.length, passed: checks.length - failed.length, failed }, null, 2));
process.exitCode = failed.length ? 1 : 0;
