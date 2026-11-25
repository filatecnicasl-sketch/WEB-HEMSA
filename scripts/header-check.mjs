import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:5177';
const output = 'test-output/header-check';
const report = { consoleErrors: [], failedResponses: [], checks: {}, screenshots: [] };
await mkdir(output, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5177, strictPort: true } });
let browser;

async function shot(page, name) {
  const path = `${output}/${name}.jpg`;
  await page.screenshot({ path, type: 'jpeg', quality: 85, fullPage: false });
  report.screenshots.push(path);
}

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
  const page = await context.newPage();
  page.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => report.consoleErrors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 400) report.failedResponses.push(`${response.status()} ${response.url()}`); });

  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  report.checks.logo = await page.locator('.brand-symbol').evaluate((image) => ({
    src: image.getAttribute('src'),
    loaded: image.complete && image.naturalWidth === 320,
    width: Math.round(image.getBoundingClientRect().width),
    height: Math.round(image.getBoundingClientRect().height),
  }));
  report.checks.brandText = await page.locator('.brand-wordmark').evaluate((image) => ({
    src: image.getAttribute('src'),
    alt: image.alt,
    loaded: image.complete && image.naturalWidth === 523,
    width: Math.round(image.getBoundingClientRect().width),
    height: Math.round(image.getBoundingClientRect().height),
  }));
  report.checks.mainMenu = await page.locator('.desktop-nav > .nav-item > .nav-link').allTextContents();
  report.checks.homeDropdownCount = await page.locator('.desktop-nav > .nav-item').first().locator(':scope > .dropdown').count();
  await shot(page, 'desktop-home');

  const areasLink = page.locator('.desktop-nav').getByRole('link', { name: 'Áreas de actuación', exact: true });
  await areasLink.hover();
  await page.waitForTimeout(300);
  report.checks.areasDropdownVisible = await areasLink.locator('..').locator(':scope > .dropdown').isVisible();
  report.checks.areasLinks = await areasLink.locator('..').locator(':scope > .dropdown > .dropdown-item > a').allTextContents();

  const transparencyLink = page.locator('.desktop-nav').getByRole('link', { name: 'Transparencia', exact: true });
  await transparencyLink.hover();
  const contractsLink = page.locator('.desktop-nav').getByRole('link', { name: 'Contratos, convenios y subvenciones', exact: true });
  await contractsLink.hover();
  await page.waitForTimeout(300);
  report.checks.contractsNestedVisible = await contractsLink.locator('..').locator(':scope > .dropdown-nested').isVisible();
  report.checks.contractsLinks = await contractsLink.locator('..').locator(':scope > .dropdown-nested > a').allTextContents();
  await shot(page, 'desktop-transparency-menu');

  const economyLink = page.locator('.desktop-nav').getByRole('link', { name: 'Información económica y presupuestaria', exact: true });
  await economyLink.hover();
  await page.waitForTimeout(300);
  report.checks.economyNestedVisible = await economyLink.locator('..').locator(':scope > .dropdown-nested').isVisible();
  report.checks.economyLinks = await economyLink.locator('..').locator(':scope > .dropdown-nested > a').allTextContents();

  await transparencyLink.focus();
  await page.waitForTimeout(300);
  report.checks.keyboardOpensDropdown = await transparencyLink.locator('..').locator(':scope > .dropdown').isVisible();
  await contractsLink.focus();
  await page.waitForTimeout(300);
  report.checks.keyboardOpensNestedDropdown = await contractsLink.locator('..').locator(':scope > .dropdown-nested').isVisible();

  const internalNavigation = [
    ['Inicio', '/'],
    ['Áreas de actuación', '/servicios'],
    ['Transparencia', '/transparencia'],
    ['Empleo', '/empleo'],
    ['Sobre nosotros', '/sobre-nosotros'],
    ['Contacto', '/contacto'],
  ];
  report.checks.navigation = [];
  for (const [label, expected] of internalNavigation) {
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.locator('.desktop-nav').getByRole('link', { name: label, exact: true }).click();
    const url = new URL(page.url());
    report.checks.navigation.push({ label, actual: `${url.pathname}${url.hash}`, expected });
  }
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'Pide tu cita', exact: true }).click();
  report.checks.appointmentNavigation = new URL(page.url()).pathname;

  for (const anchor of ['institucional', 'contratacion', 'economica']) {
    await page.goto(`${base}/transparencia#${anchor}`, { waitUntil: 'networkidle' });
    report.checks[`anchor-${anchor}`] = await page.locator(`#${anchor}`).count() === 1;
  }

  report.checks.responsive = [];
  for (const width of [1440, 1024, 768, 375]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(base, { waitUntil: 'networkidle' });
    report.checks.responsive.push({
      width,
      overflow: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
      desktopMenu: await page.locator('.desktop-nav').isVisible(),
      mobileButton: await page.locator('.mobile-menu-button').isVisible(),
    });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Abrir menú' }).click();
  report.checks.mobileMenuVisible = await page.locator('#mobile-menu').isVisible();
  report.checks.mobileMenuOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  report.checks.mobileSubmenuTargets = await page.locator('#mobile-menu .mobile-submenu a').evaluateAll((links) => links.every((link) => link.getBoundingClientRect().height >= 44));
  await shot(page, 'mobile-menu');
  await page.locator('#mobile-menu').getByRole('link', { name: 'Ayuda a domicilio', exact: true }).click();
  await page.waitForURL('**/servicios#ayuda-a-domicilio');
  await page.locator('#mobile-menu').waitFor({ state: 'detached' });
  const mobileUrl = new URL(page.url());
  report.checks.mobileNavigation = `${mobileUrl.pathname}${mobileUrl.hash}`;
  report.checks.mobileMenuCloses = await page.locator('#mobile-menu').count() === 0;

  await page.goto(base, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Abrir menú' }).click();
  const mobileContact = page.locator('#mobile-menu').getByRole('link', { name: 'Contacto', exact: true });
  await mobileContact.scrollIntoViewIfNeeded();
  report.checks.mobileContactTopLevel = await mobileContact.evaluate((link) => link.parentElement?.classList.contains('nav-item') && link.classList.contains('nav-link'));
  await shot(page, 'mobile-menu-contact');
  await mobileContact.click();
  await page.waitForURL('**/contacto');
  await page.locator('#mobile-menu').waitFor({ state: 'detached' });
  report.checks.mobileContactNavigation = new URL(page.url()).pathname;
  report.checks.mobileMenuClosesAfterContact = await page.locator('#mobile-menu').count() === 0;
} catch (error) {
  report.executionError = error.stack || error.message;
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
}

console.log(JSON.stringify(report, null, 2));
if (report.executionError || report.consoleErrors.length || report.failedResponses.length) process.exitCode = 1;
