import { writeFile } from 'node:fs/promises';

const base = (process.env.BACKEND_URL || '').replace(/\/$/, '');
const email = process.env.HEMSA_ADMIN_EMAIL;
const password = process.env.HEMSA_ADMIN_PASSWORD;
const marker = `PRUEBA_HEMSA_${Date.now()}`;
const report = { base, checks: [], cleanup: null };
let token;
let initialContent;
let initialRevisionId;
let contentTouched = false;

if (!base) throw new Error('Define BACKEND_URL sin barra final.');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function same(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function request(path, { method = 'GET', body, auth = false, origin } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  if (origin) headers.Origin = origin;
  const response = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { nonJson: text.slice(0, 160) }; }
  return { status: response.status, data, headers: response.headers, contentType: response.headers.get('content-type') || '' };
}

function check(name, condition, details = {}) {
  report.checks.push({ name, passed: Boolean(condition), ...details });
}

async function findInitialRevision() {
  if (initialRevisionId) return initialRevisionId;
  const list = await request('/api/admin/content/revisions', { auth: true });
  for (const summary of list.data?.revisions || []) {
    const revision = await request(`/api/admin/content/revisions/${encodeURIComponent(summary.id)}`, { auth: true });
    if (revision.status === 200 && same(revision.data?.content, initialContent)) {
      initialRevisionId = summary.id;
      return initialRevisionId;
    }
  }
  return null;
}

async function restoreInitial() {
  if (!token || !initialContent || !contentTouched) return;
  const revisionId = await findInitialRevision();
  if (!revisionId) throw new Error('No se encontro una revision con el contenido inicial para limpiar la prueba.');
  const state = await request('/api/admin/content', { auth: true });
  if (state.status !== 200) throw new Error('No se pudo leer el estado para restaurar el contenido inicial.');
  const restored = await request('/api/admin/content/revisions/restore', {
    method: 'POST', auth: true,
    body: { revisionId, baseVersion: state.data.version },
  });
  if (restored.status !== 200) throw new Error('No se pudo copiar el contenido inicial al borrador.');
  const published = await request('/api/admin/content/publish', {
    method: 'POST', auth: true,
    body: { baseVersion: restored.data.version },
  });
  if (published.status !== 200) throw new Error('No se pudo republicar el contenido inicial.');
  const publicContent = await request('/api/public/content');
  report.cleanup = { passed: same(publicContent.data?.content, initialContent), revisionId };
  contentTouched = false;
}

try {
  const health = await request('/api/health');
  check('Health JSON', health.status === 200 && health.data?.status === 'ok' && health.contentType.includes('application/json'), { status: health.status });

  const publicInitial = await request('/api/public/content');
  initialContent = publicInitial.data?.content;
  check('Contenido publico inicial', publicInitial.status === 200 && initialContent?.hero && initialContent?.contact, { status: publicInitial.status });

  const unauthorized = await request('/api/admin/content');
  check('Ruta privada sin token', unauthorized.status === 401 && unauthorized.data?.error?.code, { status: unauthorized.status });

  const badLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { email: `no-existe-${Date.now()}@example.invalid`, password: 'incorrecta' },
  });
  check('Login incorrecto', badLogin.status === 401 && badLogin.data?.error, { status: badLogin.status });

  const preflight = await fetch(`${base}/api/admin/content/draft`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:5173',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type, authorization',
    },
  });
  const allowHeaders = preflight.headers.get('access-control-allow-headers') || '';
  const allowMethods = preflight.headers.get('access-control-allow-methods') || '';
  check('Preflight CORS', preflight.ok
    && preflight.headers.get('access-control-allow-origin') === 'http://localhost:5173'
    && allowMethods.toLowerCase().includes('post')
    && allowHeaders.toLowerCase().includes('authorization')
    && allowHeaders.toLowerCase().includes('content-type'), { status: preflight.status });

  if (!email || !password) throw new Error('Define HEMSA_ADMIN_EMAIL y HEMSA_ADMIN_PASSWORD en el entorno para las pruebas autenticadas.');
  const login = await request('/api/auth/login', { method: 'POST', body: { email, password } });
  token = login.data?.token;
  check('Login valido', login.status === 200 && token?.length >= 32 && login.data?.user?.role === 'admin', { status: login.status });
  if (!token) throw new Error('No se obtuvo sesion de administrador.');

  const me = await request('/api/auth/me', { auth: true });
  check('Sesion valida', me.status === 200 && me.data?.user?.role === 'admin', { status: me.status });

  let state = await request('/api/admin/content', { auth: true });
  check('Estado editorial privado', state.status === 200 && state.data?.draft && Number.isInteger(state.data?.version), { status: state.status });
  const originalVersion = state.data.version;

  const invalid = clone(state.data.draft);
  invalid.contact.email = 'correo-invalido';
  const invalidDraft = await request('/api/admin/content/draft', {
    method: 'POST', auth: true,
    body: { content: invalid, baseVersion: originalVersion },
  });
  const afterInvalid = await request('/api/admin/content', { auth: true });
  check('Borrador invalido rechazado', invalidDraft.status === 400 && afterInvalid.data?.version === originalVersion, { status: invalidDraft.status });

  const marked = clone(initialContent);
  marked.hero.text = `${initialContent.hero.text} [${marker}]`;
  let saved = await request('/api/admin/content/draft', {
    method: 'POST', auth: true,
    body: { content: marked, baseVersion: originalVersion },
  });
  contentTouched = contentTouched || saved.status === 200;
  const publicAfterDraft = await request('/api/public/content');
  check('Borrador no publicado', saved.status === 200 && saved.data?.draft?.hero?.text.includes(marker)
    && same(publicAfterDraft.data?.content, initialContent), { status: saved.status });

  const discarded = await request('/api/admin/content/discard-draft', {
    method: 'POST', auth: true,
    body: { baseVersion: saved.data.version },
  });
  check('Descartar borrador', discarded.status === 200 && same(discarded.data?.draft, discarded.data?.published), { status: discarded.status });

  saved = await request('/api/admin/content/draft', {
    method: 'POST', auth: true,
    body: { content: marked, baseVersion: discarded.data.version },
  });
  contentTouched = contentTouched || saved.status === 200;
  const stale = await request('/api/admin/content/draft', {
    method: 'POST', auth: true,
    body: { content: initialContent, baseVersion: discarded.data.version },
  });
  check('Conflicto de versiones', stale.status === 409, { status: stale.status });

  const published = await request('/api/admin/content/publish', {
    method: 'POST', auth: true,
    body: { baseVersion: saved.data.version },
  });
  contentTouched = contentTouched || published.status === 200;
  const publicAfterPublish = await request('/api/public/content');
  check('Publicacion real', published.status === 200 && publicAfterPublish.data?.content?.hero?.text.includes(marker), { status: published.status });

  const revisionId = await findInitialRevision();
  check('Historial y exportacion JSON', Boolean(revisionId), { revisionId });
  if (!revisionId) throw new Error('No se encontro la revision inicial.');

  const restored = await request('/api/admin/content/revisions/restore', {
    method: 'POST', auth: true,
    body: { revisionId, baseVersion: published.data.version },
  });
  const publicBeforeRestorePublish = await request('/api/public/content');
  check('Restaurar solo al borrador', restored.status === 200 && same(restored.data?.draft, initialContent)
    && publicBeforeRestorePublish.data?.content?.hero?.text.includes(marker), { status: restored.status });

  const republished = await request('/api/admin/content/publish', {
    method: 'POST', auth: true,
    body: { baseVersion: restored.data.version },
  });
  const finalPublic = await request('/api/public/content');
  check('Contenido inicial republicado', republished.status === 200 && same(finalPublic.data?.content, initialContent), { status: republished.status });
  contentTouched = false;

  const logout = await request('/api/auth/logout', { method: 'POST', auth: true });
  const meAfterLogout = await request('/api/auth/me', { auth: true });
  check('Logout invalida sesion', logout.status === 204 && meAfterLogout.status === 401, { logout: logout.status, me: meAfterLogout.status });
  token = null;
} catch (error) {
  report.executionError = error.message;
} finally {
  if (contentTouched && token) {
    try { await restoreInitial(); } catch (error) { report.cleanup = { passed: false, error: error.message }; }
  }
  report.passed = !report.executionError && report.checks.every((item) => item.passed) && report.cleanup?.passed !== false;
  await writeFile(new URL('./api-acceptance-report.json', import.meta.url), JSON.stringify(report, null, 2));
}

console.log(JSON.stringify({
  passed: report.passed,
  checks: report.checks,
  cleanup: report.cleanup,
  executionError: report.executionError,
}, null, 2));
if (!report.passed) process.exitCode = 1;
