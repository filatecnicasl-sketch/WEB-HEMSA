import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:5188';
const output = 'test-output/interaction-audit';
const report = { checks: {}, navigation: [], errors: [] };
await mkdir(output, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5188, strictPort: true } });
let browser;

async function run(name, task) {
  try {
    report.checks[name] = await task();
  } catch (error) {
    report.errors.push({ check: name, error: error.stack || error.message });
  }
}

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
  const page = await context.newPage();
  page.on('pageerror', (error) => report.errors.push({ type: 'pageerror', error: error.message }));

  await run('desktopNavigation', async () => {
    await page.goto(`${base}/`, { waitUntil: 'networkidle' });
    const links = await page.locator('.desktop-nav a').evaluateAll((anchors) => anchors.map((anchor) => anchor.href));
    const internal = [...new Set(links.filter((href) => href.startsWith(base)))];
    for (const href of internal) {
      const index = links.indexOf(href);
      await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
      const link = page.locator('.desktop-nav a').nth(index);
      const topIndex = await link.evaluate((element) => {
        let current = element;
        while (current && !(current.classList?.contains('nav-item') && current.parentElement?.classList?.contains('desktop-nav'))) current = current.parentElement;
        return [...document.querySelectorAll('.desktop-nav > .nav-item')].indexOf(current);
      });
      if (topIndex >= 0) await page.locator('.desktop-nav > .nav-item').nth(topIndex).hover();
      const nested = link.locator('xpath=ancestor::div[contains(@class,"dropdown-item") and contains(@class,"has-children")]');
      if (await nested.count()) await nested.first().hover();
      await link.click({ timeout: 5000 });
      const expected = new URL(href);
      await page.waitForURL((url) => `${url.pathname}${url.hash}` === `${expected.pathname}${expected.hash}`, { timeout: 5000 });
      report.navigation.push({ href: `${expected.pathname}${expected.hash}`, clicked: true });
    }
    return { tested: report.navigation.length, passed: report.navigation.every((item) => item.clicked) };
  });

  await run('mobileNavigationAndTextSize', async () => {
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobile.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
    await mobile.goto(`${base}/`, { waitUntil: 'networkidle' });
    await mobile.getByRole('button', { name: 'Abrir menú' }).click();
    const menuVisible = await mobile.locator('#mobile-menu').isVisible();
    await mobile.locator('#mobile-menu').getByRole('link', { name: 'Viviendas', exact: true }).click();
    await mobile.waitForURL('**/vivienda');
    await mobile.locator('#mobile-menu').waitFor({ state: 'detached' });
    const menuClosed = await mobile.locator('#mobile-menu').count() === 0;
    await mobile.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
    await mobile.getByRole('button', { name: 'Abrir menú' }).click();
    await mobile.getByRole('button', { name: 'Aumentar tamaño del texto' }).click();
    const largeText = await mobile.locator('html').evaluate((element) => element.classList.contains('large-text'));
    await mobile.screenshot({ path: `${output}/mobile-menu-large-text.jpg`, fullPage: false, type: 'jpeg', quality: 80 });
    await mobile.close();
    return { menuVisible, menuClosed, largeText, passed: menuVisible && menuClosed && largeText };
  });

  await run('cookieBanner', async () => {
    const fresh = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const cookiePage = await fresh.newPage();
    await cookiePage.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
    const visible = await cookiePage.locator('.cookie-banner').isVisible();
    await cookiePage.getByRole('button', { name: 'Aceptar', exact: true }).click();
    const hidden = await cookiePage.locator('.cookie-banner').count() === 0;
    const stored = await cookiePage.evaluate(() => localStorage.getItem('hemsa-cookie-choice'));
    await fresh.close();
    return { visible, hidden, stored, passed: visible && hidden && stored === 'accepted' };
  });

  await run('homeCarousel', async () => {
    await page.goto(`${base}/`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Pausar reproducción automática' }).click();
    const before = await page.locator('.r-hero-carousel-tab.is-active').getAttribute('aria-label');
    await page.getByRole('button', { name: 'Imagen siguiente' }).click();
    const after = await page.locator('.r-hero-carousel-tab.is-active').getAttribute('aria-label');
    return { before, after, pauseControl: true, passed: before !== after };
  });

  await run('historyCarousel', async () => {
    await page.goto(`${base}/sobre-nosotros`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Pausar reproducción automática' }).click();
    const before = await page.locator('.r-history-carousel-dot.is-active').getAttribute('aria-label');
    await page.getByRole('button', { name: 'Fotografía siguiente' }).click();
    const after = await page.locator('.r-history-carousel-dot.is-active').getAttribute('aria-label');
    return { before, after, pauseControl: true, passed: before !== after };
  });

  await run('housingGalleriesAndVideos', async () => {
    await page.goto(`${base}/vivienda`, { waitUntil: 'networkidle' });
    const thumbnailCounts = await page.locator('.promotion-thumbnails').evaluateAll((groups) => groups.map((group) => group.querySelectorAll('button').length));
    const firstGroup = page.locator('.promotion-thumbnails').first();
    const second = firstGroup.locator('button').nth(1);
    await second.click();
    const thumbnailSelected = await second.getAttribute('aria-pressed');
    const videos = await page.locator('video').evaluateAll(async (items) => Promise.all(items.map((video) => new Promise((resolve) => {
      const timer = setTimeout(() => resolve({ src: video.querySelector('source')?.src, readyState: video.readyState, error: 'timeout' }), 20000);
      video.addEventListener('loadedmetadata', () => {
        clearTimeout(timer);
        resolve({ src: video.currentSrc, readyState: video.readyState, duration: video.duration, error: null });
      }, { once: true });
      video.addEventListener('error', () => {
        clearTimeout(timer);
        resolve({ src: video.currentSrc, readyState: video.readyState, error: video.error?.message || 'error' });
      }, { once: true });
      video.preload = 'metadata';
      video.load();
    }))));
    return { thumbnailCounts, thumbnailSelected, videos, passed: thumbnailCounts.every((count) => count > 1) && thumbnailSelected === 'true' && videos.every((video) => !video.error && video.readyState >= 1) };
  });

  await run('transparencySearch', async () => {
    await page.goto(`${base}/transparencia`, { waitUntil: 'networkidle' });
    const search = page.getByRole('searchbox');
    await search.fill('término que no existe hemsa');
    const emptyVisible = await page.locator('.open-transparency-empty').isVisible();
    await page.getByRole('button', { name: 'Limpiar búsqueda' }).click();
    const documentsRestored = await page.locator('.open-transparency-documents li').count();
    return { emptyVisible, documentsRestored, passed: emptyVisible && documentsRestored > 0 };
  });

  await run('appointmentForm', async () => {
    await page.goto(`${base}/cita-previa`, { waitUntil: 'networkidle' });
    const form = page.locator('.r-appointment-form');
    await form.getByRole('button', { name: 'Solicitar cita', exact: true }).click();
    const invalidFields = await form.evaluate((element) => [...element.querySelectorAll('input, select, textarea')].filter((field) => !field.checkValidity()).length);
    await form.locator('[name="name"]').fill('Prueba automatizada HEMSA');
    await form.locator('[name="phone"]').fill('600000000');
    await form.locator('[name="email"]').fill('prueba@example.com');
    await form.locator('[name="service"]').selectOption({ label: 'Información general' });
    await form.locator('[name="privacy"]').check();
    await form.getByRole('button', { name: 'Solicitar cita', exact: true }).click();
    const feedback = await form.locator('[role="status"]').innerText();
    return { invalidFields, feedback, passed: invalidFields > 0 && feedback.includes('Solicitud preparada') };
  });

  await run('contactForm', async () => {
    await page.goto(`${base}/contacto`, { waitUntil: 'networkidle' });
    const form = page.locator('.form-card form');
    await form.getByRole('button', { name: 'Preparar envío por correo' }).click();
    const invalidFields = await form.evaluate((element) => [...element.querySelectorAll('input, select, textarea')].filter((field) => !field.checkValidity()).length);
    await form.locator('[name="name"]').fill('Prueba automatizada HEMSA');
    await form.locator('[name="email"]').fill('prueba@example.com');
    await form.locator('[name="message"]').fill('Mensaje de prueba. No se envía ninguna información.');
    await form.locator('[name="privacy"]').check();
    await form.getByRole('button', { name: 'Preparar envío por correo' }).click();
    const feedback = await form.locator('[role="status"]').innerText();
    return { invalidFields, feedback, passed: invalidFields > 0 && feedback.includes('Mensaje preparado') };
  });

  await run('adminDemo', async () => {
    await page.goto(`${base}/gestor`, { waitUntil: 'networkidle' });
    await page.getByLabel('Texto del aviso').fill('Aviso de prueba automatizada');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    const feedback = await page.locator('.admin-saved').innerText();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('hemsa-content-preview-v1'))?.notice?.text);
    return { feedback, stored, passed: feedback.includes('Cambios guardados') && stored === 'Aviso de prueba automatizada' };
  });

  await run('sadAgentDemo', async () => {
    await page.goto(`${base}/area-sad`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Entrar en la demostración' }).click();
    await page.getByRole('button', { name: 'Avisar de una ausencia', exact: true }).click();
    await page.locator('.sad-action-card').waitFor({ state: 'visible' });
    await page.locator('.sad-action-card').getByRole('button', { name: 'Confirmar aviso' }).click();
    await page.getByRole('button', { name: /Mis gestiones/ }).click();
    const requests = await page.locator('.sad-request-item').count();
    const status = await page.locator('.sad-request-status').first().innerText();
    return { requests, status, passed: requests === 1 && status.includes('Pendiente') };
  });

  await context.close();
} catch (error) {
  report.errors.push({ type: 'execution', error: error.stack || error.message });
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
  report.summary = {
    checks: Object.keys(report.checks).length,
    passed: Object.values(report.checks).filter((check) => check.passed).length,
    failedChecks: Object.entries(report.checks).filter(([, check]) => !check.passed).map(([name]) => name),
    navigationLinksClicked: report.navigation.length,
    errors: report.errors.length,
  };
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
}

console.log(JSON.stringify(report, null, 2));
