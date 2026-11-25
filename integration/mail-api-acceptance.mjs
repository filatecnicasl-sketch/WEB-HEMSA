import { writeFile } from 'node:fs/promises';

const base = (process.env.BACKEND_URL || '').replace(/\/$/, '');
const email = process.env.HEMSA_ADMIN_EMAIL;
const password = process.env.HEMSA_ADMIN_PASSWORD;
const report = { base, checks: [], restored: false };
let token;
let originalSettings = null;

if (!base) throw new Error('Define BACKEND_URL sin barra final.');

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { nonJson: text.slice(0, 160) }; }
  return { status: response.status, data };
}

function check(name, condition, details = {}) {
  report.checks.push({ name, passed: Boolean(condition), ...details });
}

function saveBody(settings, overrides = {}) {
  return {
    enabled: Boolean(settings.enabled),
    host: settings.host || '',
    port: settings.port || 587,
    security: settings.security || 'starttls',
    username: settings.username || '',
    password: '',
    sender: settings.sender || '',
    recipient: settings.recipient || '',
    ...overrides,
  };
}

async function restoreOriginal() {
  if (!token || !originalSettings) return;
  const restored = await request('/api/admin/mail-settings', {
    method: 'POST', auth: true, body: saveBody(originalSettings),
  });
  report.restored = restored.status === 200;
  if (!report.restored) throw new Error('No se pudo restaurar la configuración de correo original tras la prueba.');
}

async function main() {
  const login = await request('/api/auth/login', { method: 'POST', body: { email, password } });
  check('login admin', login.status === 200 && typeof login.data?.token === 'string');
  token = login.data?.token;

  const unauthorized = await request('/api/admin/mail-settings');
  check('GET sin sesión devuelve 401', unauthorized.status === 401);

  const current = await request('/api/admin/mail-settings', { auth: true });
  check('GET con sesión devuelve la configuración', current.status === 200 && typeof current.data?.settings === 'object');
  const settings = current.data?.settings || {};
  originalSettings = settings;
  check('la respuesta nunca incluye la contraseña', !('password' in settings) && typeof settings.passwordSet === 'boolean');
  check('incluye los campos esperados', ['enabled', 'host', 'port', 'security', 'username', 'sender', 'recipient'].every((key) => key in settings));

  const invalid = await request('/api/admin/mail-settings', {
    method: 'POST', auth: true,
    body: saveBody(settings, { enabled: true, security: 'abierta', sender: 'correo-sin-arroba', port: 0 }),
  });
  check('rechaza configuraciones no válidas con 400', invalid.status === 400 && invalid.data?.error?.code === 'VALIDATION_ERROR');
  const invalidFields = invalid.data?.error?.fields || {};
  check('informa de los campos incorrectos', Boolean(invalidFields.security) && Boolean(invalidFields.sender) && Boolean(invalidFields.port), { fields: Object.keys(invalidFields) });

  const kept = await request('/api/admin/mail-settings', {
    method: 'POST', auth: true, body: saveBody(settings),
  });
  check('guardar con contraseña vacía conserva la actual', kept.status === 200 && kept.data?.settings?.passwordSet === settings.passwordSet);
  check('guardar no revela la contraseña', kept.status === 200 && !('password' in (kept.data?.settings || {})));

  const disabled = await request('/api/admin/mail-settings', {
    method: 'POST', auth: true, body: saveBody(settings, { enabled: false }),
  });
  check('permite guardar desactivado', disabled.status === 200 && disabled.data?.settings?.enabled === false);

  const testWhileDisabled = await request('/api/admin/mail-settings/test', { method: 'POST', auth: true });
  check('la prueba avisa si el envío está desactivado', testWhileDisabled.status === 503 && testWhileDisabled.data?.error?.code === 'MAIL_NOT_CONFIGURED');

  const testWithoutAuth = await request('/api/admin/mail-settings/test', { method: 'POST' });
  check('la prueba exige sesión', testWithoutAuth.status === 401);
}

try {
  await main();
} finally {
  try { await restoreOriginal(); } catch (reason) {
    report.checks.push({ name: 'restaurar configuración original', passed: false, error: String(reason) });
  }
}

const failed = report.checks.filter((item) => !item.passed);
await writeFile(new URL('./mail-api-acceptance-report.json', import.meta.url), JSON.stringify(report, null, 2));
for (const item of report.checks) {
  console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}`);
}
if (failed.length > 0) {
  console.error(`\n${failed.length} comprobaciones de correo han fallado.`);
  process.exit(1);
}
console.log('\nTodas las comprobaciones de correo han pasado.');
