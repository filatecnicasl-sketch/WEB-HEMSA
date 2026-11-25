import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:5187';
const output = 'test-output/full-site-audit';
const routes = [
  ['/', 'inicio'],
  ['/sobre-nosotros', 'sobre-nosotros'],
  ['/vivienda', 'vivienda'],
  ['/vivienda/registro', 'vivienda-registro'],
  ['/vivienda/compra', 'vivienda-compra'],
  ['/ayudas-y-subvenciones', 'ayudas-subvenciones'],
  ['/servicios', 'servicios'],
  ['/ayuda-a-domicilio', 'ayuda-domicilio'],
  ['/garajes-trasteros', 'garajes-trasteros'],
  ['/transparencia', 'transparencia'],
  ['/empleo', 'empleo'],
  ['/contacto', 'contacto'],
  ['/cita-previa', 'cita-previa'],
  ['/area-sad', 'area-sad'],
  ['/gestor', 'gestor'],
  ['/aviso-legal', 'aviso-legal'],
  ['/cookies', 'cookies'],
  ['/alternativas', 'alternativas'],
  ['/propuesta-1', 'propuesta-1'],
  ['/propuesta-2', 'propuesta-2'],
  ['/propuesta-3', 'propuesta-3'],
  ['/propuesta-4', 'propuesta-4'],
];
const viewports = [1440, 1024, 768, 390, 375];
const report = {
  generatedAt: new Date().toISOString(),
  base,
  routes: [],
  consoleErrors: [],
  failedResponses: [],
  internalPageLinks: [],
  documentChecks: [],
  externalLinks: [],
  specialLinks: {},
  placeholders: [],
  notFoundCheck: {},
  summary: {},
};

await mkdir(output, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5187, strictPort: true } });
let browser;

const slug = (route) => routes.find(([path]) => path === route)?.[1] || 'otra-ruta';
const unique = (items) => [...new Set(items)];

async function loadImages(page) {
  await page.evaluate(async () => {
    const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const step = Math.max(window.innerHeight * 1.5, 900);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await pause(35);
    }
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
    await pause(120);
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.waitForTimeout(250);
}

async function inspect(page, route, width) {
  const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await loadImages(page);
  const data = await page.evaluate(() => ({
    title: document.title,
    heading: document.querySelector('h1')?.textContent?.trim() || document.querySelector('h2')?.textContent?.trim() || '',
    notFound: document.body.innerText.includes('No hemos encontrado esta página'),
    mainVisible: Boolean(document.querySelector('main')?.getBoundingClientRect().height),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    brokenImages: [...document.images].filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.currentSrc || image.src),
    imageCount: document.images.length,
    videos: [...document.querySelectorAll('video')].map((video) => ({
      src: video.currentSrc || video.querySelector('source')?.src || '',
      error: video.error?.message || null,
    })),
    ids: [...document.querySelectorAll('[id]')].map((element) => element.id),
    anchors: [...document.querySelectorAll('a')].map((anchor) => ({
      raw: anchor.getAttribute('href'),
      href: anchor.href,
      text: anchor.textContent.replace(/\s+/g, ' ').trim(),
      target: anchor.getAttribute('target'),
      rel: anchor.getAttribute('rel'),
    })),
    buttonCount: document.querySelectorAll('button').length,
    formCount: document.querySelectorAll('form').length,
  }));
  let screenshot = null;
  if (width === 1440 || width === 390) {
    screenshot = `${output}/${slug(route)}-${width}.jpg`;
    await page.screenshot({ path: screenshot, fullPage: true, type: 'jpeg', quality: 68 });
  }
  return { route, viewport: width, status: response?.status() || 0, screenshot, ...data };
}

async function checkExternal(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    let response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; HEMSA-link-check/1.0)' },
    });
    let method = 'HEAD';
    if ([400, 401, 403, 405, 406, 429, 500, 501, 502, 503].includes(response.status)) {
      response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; HEMSA-link-check/1.0)', range: 'bytes=0-2047' },
      });
      method = 'GET';
      await response.body?.cancel();
    }
    return {
      url,
      status: response.status,
      ok: response.status < 400,
      finalUrl: response.url,
      method,
      classification: response.status < 400 ? 'correcto' : [401, 403, 429].includes(response.status) ? 'requiere revision manual' : 'fallo',
    };
  } catch (error) {
    return { url, status: null, ok: false, classification: 'requiere revision manual', error: error.name === 'AbortError' ? 'Tiempo de espera agotado' : error.message };
  } finally {
    clearTimeout(timeout);
  }
}

try {
  browser = await chromium.launch({ headless: true });
  const linkOccurrences = new Map();

  for (const width of viewports) {
    const context = await browser.newContext({ viewport: { width, height: width > 1000 ? 1000 : 844 }, reducedMotion: 'reduce' });
    await context.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
    const page = await context.newPage();
    let currentRoute = '';
    page.on('console', (message) => {
      if (message.type() === 'error') report.consoleErrors.push({ route: currentRoute, viewport: width, text: message.text() });
    });
    page.on('pageerror', (error) => report.consoleErrors.push({ route: currentRoute, viewport: width, text: error.message }));
    page.on('response', (response) => {
      if (response.status() >= 400) report.failedResponses.push({ route: currentRoute, viewport: width, status: response.status(), url: response.url() });
    });

    for (const [route] of routes) {
      currentRoute = route;
      const result = await inspect(page, route, width);
      report.routes.push(result);
      for (const anchor of result.anchors) {
        if (!anchor.raw || anchor.raw === '#' || anchor.raw.toLowerCase().startsWith('javascript:')) {
          report.placeholders.push({ route, viewport: width, ...anchor });
        }
        if (width !== 1440) continue;
        const key = anchor.href || anchor.raw;
        if (!linkOccurrences.has(key)) linkOccurrences.set(key, { ...anchor, sources: [] });
        linkOccurrences.get(key).sources.push({ route, text: anchor.text });
      }
    }
    await context.close();
  }

  const desktopResults = new Map(report.routes.filter((item) => item.viewport === 1440).map((item) => [item.route, item]));
  const internalTargets = new Map();
  const externalTargets = new Map();
  const documentTargets = new Map();
  const specialLinks = [];

  for (const [key, link] of linkOccurrences) {
    if (!key) continue;
    if (key.startsWith('mailto:') || key.startsWith('tel:')) {
      specialLinks.push(link);
      continue;
    }
    let url;
    try { url = new URL(key); } catch { continue; }
    if (url.origin === base) {
      const target = `${url.pathname}${url.hash}`;
      if (url.pathname.toLowerCase().endsWith('.pdf')) {
        if (!documentTargets.has(url.pathname)) documentTargets.set(url.pathname, { ...link, sources: [] });
        documentTargets.get(url.pathname).sources.push(...link.sources);
      } else {
        if (!internalTargets.has(target)) internalTargets.set(target, { ...link, sources: [] });
        internalTargets.get(target).sources.push(...link.sources);
      }
    } else if (url.protocol === 'http:' || url.protocol === 'https:') {
      if (!externalTargets.has(key)) externalTargets.set(key, { ...link, sources: [] });
      externalTargets.get(key).sources.push(...link.sources);
    }
  }

  const linkPage = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  await linkPage.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
  for (const [target, link] of internalTargets) {
    const url = new URL(target, base);
    const known = desktopResults.get(url.pathname);
    let result;
    if (known) {
      const hash = decodeURIComponent(url.hash.slice(1));
      result = {
        target,
        status: known.status,
        notFound: known.notFound,
        anchorExists: hash ? known.ids.includes(hash) : true,
        ok: known.status < 400 && !known.notFound && (!hash || known.ids.includes(hash)),
      };
    } else {
      const response = await linkPage.goto(`${base}${target}`, { waitUntil: 'domcontentloaded' });
      await linkPage.waitForTimeout(120);
      const hash = decodeURIComponent(url.hash.slice(1));
      const notFound = await linkPage.locator('text=No hemos encontrado esta página').count() > 0;
      const anchorExists = hash ? await linkPage.evaluate((id) => document.getElementById(id) !== null, hash) : true;
      result = { target, status: response?.status() || 0, notFound, anchorExists, ok: (response?.status() || 500) < 400 && !notFound && anchorExists };
    }
    report.internalPageLinks.push({ ...result, sources: link.sources });
  }
  await linkPage.close();

  const documentPaths = [...documentTargets.keys()];
  for (let index = 0; index < documentPaths.length; index += 6) {
    const batch = documentPaths.slice(index, index + 6);
    const checks = await Promise.all(batch.map(async (path) => {
      try {
        const response = await fetch(`${base}${path}`);
        const buffer = Buffer.from(await response.arrayBuffer());
        return {
          path,
          status: response.status,
          contentType: response.headers.get('content-type'),
          bytes: buffer.length,
          pdfSignature: buffer.subarray(0, 5).toString() === '%PDF-',
          ok: response.ok && buffer.subarray(0, 5).toString() === '%PDF-',
          sources: documentTargets.get(path).sources,
        };
      } catch (error) {
        return { path, ok: false, error: error.message, sources: documentTargets.get(path).sources };
      }
    }));
    report.documentChecks.push(...checks);
  }

  const externalUrls = [...externalTargets.keys()];
  for (let index = 0; index < externalUrls.length; index += 4) {
    const batch = externalUrls.slice(index, index + 4);
    const checks = await Promise.all(batch.map((url) => checkExternal(url)));
    report.externalLinks.push(...checks.map((check) => ({ ...check, sources: externalTargets.get(check.url).sources })));
  }

  const notFoundPage = await browser.newPage();
  const notFoundResponse = await notFoundPage.goto(`${base}/esta-pagina-no-existe-hemsa`, { waitUntil: 'domcontentloaded' });
  report.notFoundCheck = {
    status: notFoundResponse?.status() || 0,
    displaysCustomPage: await notFoundPage.locator('text=No hemos encontrado esta página').count() > 0,
    homeLink: await notFoundPage.getByRole('link', { name: 'Volver al inicio' }).getAttribute('href'),
  };
  await notFoundPage.close();

  report.specialLinks = {
    telephone: unique(specialLinks.filter((link) => link.href.startsWith('tel:')).map((link) => link.href)),
    email: unique(specialLinks.filter((link) => link.href.startsWith('mailto:')).map((link) => link.href)),
  };
  report.summary = {
    routesChecked: routes.length,
    routeViewportChecks: report.routes.length,
    screenshots: report.routes.filter((item) => item.screenshot).length,
    missingMain: report.routes.filter((item) => !item.mainVisible).map(({ route, viewport }) => ({ route, viewport })),
    unexpectedNotFoundRoutes: report.routes.filter((item) => item.notFound).map(({ route, viewport }) => ({ route, viewport })),
    overflow: report.routes.filter((item) => item.overflow).map(({ route, viewport, scrollWidth, clientWidth }) => ({ route, viewport, scrollWidth, clientWidth })),
    brokenImages: report.routes.flatMap((item) => item.brokenImages.map((url) => ({ route: item.route, viewport: item.viewport, url }))),
    brokenInternalLinks: report.internalPageLinks.filter((item) => !item.ok),
    brokenDocuments: report.documentChecks.filter((item) => !item.ok),
    externalFailures: report.externalLinks.filter((item) => item.classification === 'fallo'),
    externalManualReview: report.externalLinks.filter((item) => item.classification === 'requiere revision manual'),
    placeholderCount: report.placeholders.length,
    documentsChecked: report.documentChecks.length,
    externalLinksChecked: report.externalLinks.length,
    consoleErrorCount: report.consoleErrors.length,
    failedResponseCount: report.failedResponses.length,
  };
} catch (error) {
  report.executionError = error.stack || error.message;
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
}

console.log(JSON.stringify({ executionError: report.executionError, summary: report.summary, notFoundCheck: report.notFoundCheck }, null, 2));
