import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const credentials = JSON.parse(await readFile(new URL('../local-server/private/admin.json', import.meta.url), 'utf8'));
const base = process.env.LOCAL_WEB_URL || 'http://127.0.0.1:5173';
const marker = `Prueba local ${Date.now()}`;
const created = { grants: [], jobs: [] };
const checks = [];
const consoleErrors = [];
const responseErrors = [];
const output = new URL('../test-output/local-editor/', import.meta.url);
const outputFile = (name) => fileURLToPath(new URL(name, output));
await mkdir(output, { recursive: true });
let browser;
let page;
let publicPage;

function check(name, passed, details = {}) {
  checks.push({ name, passed: Boolean(passed), ...details });
}

async function api(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${data?.error?.message || ''}`);
  return data;
}

async function cleanup() {
  const session = await api('/api/auth/login', { method: 'POST', body: { email: credentials.email, password: credentials.password } });
  const token = session.token;
  for (const kind of ['grants', 'jobs']) {
    for (const id of created[kind]) {
      try {
        const { item } = await api(`/api/admin/${kind}/${encodeURIComponent(id)}`, { token });
        if (item.status !== 'archived') {
          await api(`/api/admin/${kind}/${encodeURIComponent(id)}/archive`, { token, method: 'POST', body: { baseVersion: item.version } });
        }
      } catch { /* El elemento puede no haber llegado a crearse. */ }
    }
  }
  const state = await api('/api/admin/content', { token });
  const revisions = await api('/api/admin/content/revisions', { token });
  const initial = revisions.revisions.find((revision) => revision.action === 'initial');
  if (initial) {
    const restored = await api('/api/admin/content/revisions/restore', { token, method: 'POST', body: { revisionId: initial.id, baseVersion: state.version } });
    await api('/api/admin/content/publish', { token, method: 'POST', body: { baseVersion: restored.version } });
  }
  await api('/api/auth/logout', { token, method: 'POST' });
}

async function publishCurrent() {
  await page.getByRole('button', { name: 'Publicar', exact: true }).click();
  await page.getByText(/(?:Publicación completada|Contenido publicado correctamente)/).waitFor({ timeout: 15000 });
}

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  await context.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
  page = await context.newPage();
  publicPage = await context.newPage();
  for (const currentPage of [page, publicPage]) {
    currentPage.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    currentPage.on('response', (response) => {
      if (response.url().startsWith(base) && response.status() >= 400) responseErrors.push(`${response.status()} ${response.url()}`);
    });
  }
  page.on('dialog', (dialog) => dialog.accept());

  await publicPage.goto(base, { waitUntil: 'networkidle' });
  const originalHero = await publicPage.locator('.r-hero-copy > p').textContent();
  check('Portada pública inicial', (await publicPage.locator('h1').textContent()).includes('Cerca de ti'));
  await publicPage.screenshot({ path: outputFile('01-inicio.png'), fullPage: true });

  await publicPage.goto(`${base}/ayudas-y-subvenciones`, { waitUntil: 'networkidle' });
  check('Ayudas públicas conserva cuatro convocatorias', await publicPage.locator('.grants-news-item').count() === 4);
  await publicPage.goto(`${base}/empleo`, { waitUntil: 'networkidle' });
  check('Empleo público conserva siete procesos', await publicPage.locator('.job-card-documents').count() + await publicPage.locator('.job-archive-item').count() === 7);

  await page.goto(`${base}/gestor`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: outputFile('02-acceso.png'), fullPage: true });
  await page.getByLabel('Correo electrónico').fill(credentials.email);
  await page.getByLabel('Contraseña').fill(credentials.password);
  await page.getByRole('button', { name: 'Entrar al gestor' }).click();
  await page.getByRole('heading', { name: 'Editar Inicio y aviso destacado' }).waitFor();
  await page.getByRole('heading', { name: 'Bloque principal de Inicio' }).waitFor();
  check('Acceso personal y carga del editor', true);
  await page.screenshot({ path: outputFile('03-editor-inicio.png'), fullPage: true });

  const heroInput = page.locator('#contenido-general textarea').nth(1);
  await heroInput.fill(`${originalHero} [PRUEBA_LOCAL]`);
  await page.getByRole('button', { name: 'Guardar borrador', exact: true }).click();
  await page.getByText(/Borrador guardado en el servidor/).waitFor();
  await publicPage.goto(base, { waitUntil: 'networkidle' });
  check('Guardar no altera la portada pública', !(await publicPage.locator('.r-hero-copy > p').textContent()).includes('PRUEBA_LOCAL'));
  await publishCurrent();
  await publicPage.reload({ waitUntil: 'networkidle' });
  check('Publicar actualiza la portada pública', (await publicPage.locator('.r-hero-copy > p').textContent()).includes('PRUEBA_LOCAL'));

  await page.getByRole('button', { name: 'Historial general', exact: true }).click();
  const initialRevision = page.locator('.revision-row').filter({ hasText: 'Contenido inicial' }).first();
  await initialRevision.getByRole('button', { name: 'Restaurar al borrador' }).click();
  await page.getByText(/La versión seleccionada ya está en el borrador/).waitFor();
  await page.screenshot({ path: outputFile('04-historial.png'), fullPage: true });
  await page.getByRole('button', { name: 'Inicio y aviso', exact: true }).click();
  await publishCurrent();
  await publicPage.reload({ waitUntil: 'networkidle' });
  check('Restaurar y publicar recupera el texto original', (await publicPage.locator('.r-hero-copy > p').textContent()) === originalHero);

  await page.getByRole('button', { name: 'Ayudas y subvenciones', exact: true }).click();
  await page.getByRole('button', { name: 'Nueva ayuda', exact: true }).click();
  await page.getByLabel('Categoría', { exact: true }).fill('Prueba editorial local');
  await page.getByLabel('Título', { exact: true }).fill(`${marker} ayuda`);
  await page.getByLabel('Resumen', { exact: true }).fill('Contenido temporal para comprobar el editor y su limpieza.');
  await page.getByRole('button', { name: 'Guardar borrador', exact: true }).click();
  await page.getByText(/se ha guardado como borrador privado/).waitFor();
  const grantId = await page.getByLabel('Identificador estable').inputValue();
  created.grants.push(grantId);
  await page.getByRole('button', { name: 'Subir PDF', exact: true }).click();
  await page.locator('input[type=file]').setInputFiles({ name: 'prueba-local.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n% Prueba local\n%%EOF\n') });
  await page.getByRole('button', { name: 'Añadir PDF al borrador' }).click();
  await page.getByText(/Todavía no es público/).waitFor();
  await publicPage.goto(`${base}/ayudas-y-subvenciones`, { waitUntil: 'networkidle' });
  check('Nueva ayuda permanece privada antes de publicar', await publicPage.getByText(`${marker} ayuda`, { exact: true }).count() === 0);
  await publishCurrent();
  await publicPage.reload({ waitUntil: 'networkidle' });
  await publicPage.getByText(`${marker} ayuda`, { exact: true }).waitFor();
  check('Ayuda y documento aparecen tras publicar', await publicPage.locator(`#${grantId} .grants-file-link`).count() === 1);
  await page.screenshot({ path: outputFile('05-editor-ayudas.png'), fullPage: true });
  await page.getByRole('button', { name: 'Archivar y ocultar' }).click();
  await page.getByText(/Contenido archivado y retirado/).waitFor();
  await publicPage.reload({ waitUntil: 'networkidle' });
  check('Archivar retira la ayuda temporal', await publicPage.getByText(`${marker} ayuda`, { exact: true }).count() === 0);

  await page.getByRole('button', { name: 'Empleo', exact: true }).click();
  await page.getByRole('button', { name: 'Nueva convocatoria', exact: true }).click();
  await page.getByLabel('Título', { exact: true }).fill(`${marker} empleo`);
  await page.getByLabel('Descripción', { exact: true }).fill('Proceso temporal para comprobar la incorporación de resultados.');
  await page.getByRole('button', { name: 'Guardar borrador', exact: true }).click();
  await page.getByText(/se ha guardado como borrador privado/).waitFor();
  const jobId = await page.getByLabel('Identificador estable').inputValue();
  created.jobs.push(jobId);
  await publishCurrent();
  await page.getByRole('button', { name: 'Añadir resultado', exact: true }).click();
  await page.locator('input[type=file]').setInputFiles({ name: 'resultado-local.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n% Resultado local\n%%EOF\n') });
  await page.getByRole('button', { name: 'Añadir PDF al borrador' }).click();
  await page.getByText(/Todavía no es público/).waitFor();
  await publishCurrent();
  await publicPage.goto(`${base}/empleo`, { waitUntil: 'networkidle' });
  await publicPage.locator(`#${jobId}`).waitFor();
  check('Resultado se añade a la misma convocatoria', await publicPage.locator(`#${jobId} .job-document-list li`).count() === 1);
  await page.screenshot({ path: outputFile('06-editor-empleo.png'), fullPage: true });
  await page.getByRole('button', { name: 'Archivar y ocultar' }).click();
  await page.getByText(/Contenido archivado y retirado/).waitFor();
  await publicPage.reload({ waitUntil: 'networkidle' });
  check('Archivar retira la convocatoria temporal', await publicPage.locator(`#${jobId}`).count() === 0);

  await cleanup();
  await publicPage.goto(base, { waitUntil: 'networkidle' });
  check('Limpieza final deja la portada original', (await publicPage.locator('.r-hero-copy > p').textContent()) === originalHero);
  check('Sin errores de consola', consoleErrors.length === 0, { consoleErrors });
  check('Sin respuestas HTTP de error en la navegación', responseErrors.length === 0, { responseErrors });
} catch (error) {
  checks.push({ name: 'Ejecución completada', passed: false, error: error.message });
  try { await cleanup(); } catch (cleanupError) { checks.push({ name: 'Limpieza tras error', passed: false, error: cleanupError.message }); }
} finally {
  if (browser) await browser.close();
  const report = { passed: checks.every((item) => item.passed), checks, consoleErrors, responseErrors };
  await writeFile(new URL('report.json', output), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
}
