import { writeFile } from 'node:fs/promises';

const base = (process.env.BACKEND_URL || '').replace(/\/$/, '');
const email = process.env.HEMSA_ADMIN_EMAIL;
const password = process.env.HEMSA_ADMIN_PASSWORD;
const marker = `prueba-hemsa-${Date.now()}`;
const report = { base, checks: [], cleanup: [] };
const created = { grants: [], jobs: [] };
let token;

if (!base) throw new Error('Define BACKEND_URL sin barra final.');
if (!email || !password) throw new Error('Define HEMSA_ADMIN_EMAIL y HEMSA_ADMIN_PASSWORD para las pruebas.');

function check(name, condition, details = {}) {
  report.checks.push({ name, passed: Boolean(condition), ...details });
}

async function request(path, { method = 'GET', body, form, auth = false, binary = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${base}${path}`, {
    method,
    headers,
    body: form || (body === undefined ? undefined : JSON.stringify(body)),
  });
  if (binary) return { status: response.status, buffer: Buffer.from(await response.arrayBuffer()), contentType: response.headers.get('content-type') || '' };
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { nonJson: text.slice(0, 180) }; }
  return { status: response.status, data, contentType: response.headers.get('content-type') || '' };
}

function grantItem(id) {
  return {
    id,
    category: 'Prueba editorial',
    title: `Ayuda temporal ${marker}`,
    summary: 'Registro temporal para verificar el flujo editorial completo.',
    publicationDate: '2026-11-25',
    deadlineDate: '2026-12-31',
    deadlineLabel: 'Fin de solicitudes',
    note: 'Contenido de prueba que debe archivarse al finalizar.',
    contentUpdatedAt: null,
    sourceUrl: null,
    sourceLabel: '',
    icon: 'Megaphone',
    documents: [],
  };
}

function jobItem(id) {
  return {
    id,
    title: `Proceso temporal ${marker}`,
    description: 'Proceso temporal para comprobar resultados y restauración.',
    publicationDate: '2026-11-25',
    deadlineDate: '2026-12-31',
    statusLabel: 'Convocatoria de prueba',
    displayGroup: 'current',
    documents: [],
  };
}

function pdfForm(ownerType, ownerId, baseVersion, kind = 'bases', invalid = false, oversized = false) {
  const form = new FormData();
  form.set('ownerType', ownerType);
  form.set('ownerId', ownerId);
  form.set('baseVersion', String(baseVersion));
  form.set('title', kind === 'resultado' ? 'Resultado temporal de prueba' : 'Documento temporal de prueba');
  form.set('description', 'Archivo temporal de aceptación');
  form.set('pages', '1');
  form.set('kind', kind);
  const content = oversized
    ? Buffer.alloc(15 * 1024 * 1024 + 1, 65)
    : Buffer.from(invalid ? 'Esto no es un PDF' : '%PDF-1.4\n% Prueba HEMSA\n%%EOF\n');
  form.set('file', new Blob([content], { type: 'application/pdf' }), invalid ? 'falso.pdf' : 'prueba.pdf');
  return form;
}

async function archiveCreated() {
  for (const type of ['grants', 'jobs']) {
    for (const id of created[type]) {
      try {
        const state = await request(`/api/admin/${type}/${encodeURIComponent(id)}`, { auth: true });
        if (state.status === 200 && state.data?.item?.status !== 'archived') {
          const archived = await request(`/api/admin/${type}/${encodeURIComponent(id)}/archive`, {
            method: 'POST', auth: true, body: { baseVersion: state.data.item.version },
          });
          report.cleanup.push({ type, id, passed: archived.status === 200, status: archived.status });
        }
      } catch (error) {
        report.cleanup.push({ type, id, passed: false, error: error.message });
      }
    }
  }
}

try {
  const [publicGrants, publicJobs] = await Promise.all([
    request('/api/public/grants'),
    request('/api/public/jobs'),
  ]);
  const initialGrantCount = publicGrants.data?.items?.length;
  const initialJobCount = publicJobs.data?.items?.length;
  const initialGrantDocuments = (publicGrants.data?.items || []).reduce((sum, item) => sum + item.documents.length, 0);
  const initialJobDocuments = (publicJobs.data?.items || []).reduce((sum, item) => sum + item.documents.length, 0);
  check('Datos iniciales de ayudas', publicGrants.status === 200 && initialGrantCount === 4 && initialGrantDocuments === 13, { initialGrantCount, initialGrantDocuments });
  check('Datos iniciales de empleo', publicJobs.status === 200 && initialJobCount === 7 && initialJobDocuments === 49, { initialJobCount, initialJobDocuments });

  const unauthorized = await request('/api/admin/grants');
  check('Colección editorial privada', unauthorized.status === 401, { status: unauthorized.status });

  const login = await request('/api/auth/login', { method: 'POST', body: { email, password } });
  token = login.data?.token;
  check('Acceso de administrador', login.status === 200 && Boolean(token), { status: login.status });
  if (!token) throw new Error('No se obtuvo sesión.');

  const grantId = `${marker}-ayuda`;
  const createdGrant = await request('/api/admin/grants', { method: 'POST', auth: true, body: { item: grantItem(grantId) } });
  if (createdGrant.status === 200) created.grants.push(grantId);
  const grantDraftPublic = await request(`/api/public/grants/${encodeURIComponent(grantId)}`);
  check('Nueva ayuda privada hasta publicar', createdGrant.status === 200 && grantDraftPublic.status === 404, { create: createdGrant.status, public: grantDraftPublic.status });

  const fakePdf = await request('/api/admin/documents', {
    method: 'POST', auth: true,
    form: pdfForm('grants', grantId, createdGrant.data?.item?.version || 1, 'bases', true),
  });
  check('Falso PDF rechazado', fakePdf.status === 400, { status: fakePdf.status });

  const oversizedPdf = await request('/api/admin/documents', {
    method: 'POST', auth: true,
    form: pdfForm('grants', grantId, createdGrant.data?.item?.version || 1, 'bases', false, true),
  });
  check('PDF excesivo rechazado', oversizedPdf.status === 413 || oversizedPdf.status === 400, { status: oversizedPdf.status });

  const upload = await request('/api/admin/documents', {
    method: 'POST', auth: true,
    form: pdfForm('grants', grantId, createdGrant.data.item.version),
  });
  const documentId = upload.data?.document?.id;
  const privatePdf = await request(`/api/admin/documents/${encodeURIComponent(documentId)}`, { auth: true, binary: true });
  const draftPdf = await request(`/api/public/documents/${encodeURIComponent(documentId)}`, { binary: true });
  check('PDF privado antes de publicar', upload.status === 200 && privatePdf.status === 200 && privatePdf.buffer.subarray(0, 5).toString() === '%PDF-' && draftPdf.status === 404, { upload: upload.status, private: privatePdf.status, public: draftPdf.status });

  const publishedGrant = await request(`/api/admin/grants/${encodeURIComponent(grantId)}/publish`, {
    method: 'POST', auth: true, body: { baseVersion: upload.data.item.version },
  });
  const publicGrant = await request(`/api/public/grants/${encodeURIComponent(grantId)}`);
  const publicPdf = await request(`/api/public/documents/${encodeURIComponent(documentId)}`, { binary: true });
  check('Ayuda y PDF visibles tras publicar', publishedGrant.status === 200 && publicGrant.status === 200 && publicGrant.data?.item?.documents?.length === 1 && publicPdf.status === 200 && publicPdf.buffer.subarray(0, 5).toString() === '%PDF-', { publish: publishedGrant.status, item: publicGrant.status, pdf: publicPdf.status });

  const stale = await request(`/api/admin/grants/${encodeURIComponent(grantId)}`, {
    method: 'POST', auth: true,
    body: { item: publicGrant.data.item, baseVersion: createdGrant.data.item.version },
  });
  check('Conflicto de versión en ayuda', stale.status === 409, { status: stale.status });

  const archivedGrant = await request(`/api/admin/grants/${encodeURIComponent(grantId)}/archive`, {
    method: 'POST', auth: true, body: { baseVersion: publishedGrant.data.item.version },
  });
  const archivedPublicGrant = await request(`/api/public/grants/${encodeURIComponent(grantId)}`);
  const archivedPublicPdf = await request(`/api/public/documents/${encodeURIComponent(documentId)}`, { binary: true });
  check('Archivo editorial oculta ayuda y PDF', archivedGrant.status === 200 && archivedPublicGrant.status === 404 && archivedPublicPdf.status === 404, { archive: archivedGrant.status, item: archivedPublicGrant.status, pdf: archivedPublicPdf.status });

  const jobId = `${marker}-empleo`;
  const createdJob = await request('/api/admin/jobs', { method: 'POST', auth: true, body: { item: jobItem(jobId) } });
  if (createdJob.status === 200) created.jobs.push(jobId);
  const publishedJob = await request(`/api/admin/jobs/${encodeURIComponent(jobId)}/publish`, {
    method: 'POST', auth: true, body: { baseVersion: createdJob.data?.item?.version },
  });
  const jobsAfterCreate = await request('/api/public/jobs');
  check('Nueva convocatoria publicada', createdJob.status === 200 && publishedJob.status === 200 && jobsAfterCreate.data?.items?.length === initialJobCount + 1, { create: createdJob.status, publish: publishedJob.status, count: jobsAfterCreate.data?.items?.length });

  const resultUpload = await request('/api/admin/documents', {
    method: 'POST', auth: true,
    form: pdfForm('jobs', jobId, publishedJob.data.item.version, 'resultado'),
  });
  const resultId = resultUpload.data?.document?.id;
  const jobBeforeResultPublish = await request(`/api/public/jobs/${encodeURIComponent(jobId)}`);
  const resultBeforePublish = await request(`/api/public/documents/${encodeURIComponent(resultId)}`, { binary: true });
  check('Resultado permanece privado antes de publicar', resultUpload.status === 200 && jobBeforeResultPublish.data?.item?.documents?.length === 0 && resultBeforePublish.status === 404, { upload: resultUpload.status, publicPdf: resultBeforePublish.status });

  const publishedResult = await request(`/api/admin/jobs/${encodeURIComponent(jobId)}/publish`, {
    method: 'POST', auth: true, body: { baseVersion: resultUpload.data.item.version },
  });
  const jobAfterResult = await request(`/api/public/jobs/${encodeURIComponent(jobId)}`);
  const jobsAfterResult = await request('/api/public/jobs');
  const publicResult = await request(`/api/public/documents/${encodeURIComponent(resultId)}`, { binary: true });
  check('Resultado agregado a la misma convocatoria', publishedResult.status === 200 && jobAfterResult.data?.item?.id === jobId && jobAfterResult.data?.item?.documents?.some((doc) => doc.kind === 'resultado') && jobsAfterResult.data?.items?.length === initialJobCount + 1 && publicResult.status === 200, { publish: publishedResult.status, count: jobsAfterResult.data?.items?.length, pdf: publicResult.status });

  const revisions = await request(`/api/admin/jobs/${encodeURIComponent(jobId)}/revisions`, { auth: true });
  const initialRevision = revisions.data?.revisions?.find((revision) => revision.action === 'initial');
  const restored = await request(`/api/admin/jobs/${encodeURIComponent(jobId)}/restore`, {
    method: 'POST', auth: true,
    body: { revisionId: initialRevision?.id, baseVersion: publishedResult.data.item.version },
  });
  const publicAfterRestore = await request(`/api/public/jobs/${encodeURIComponent(jobId)}`);
  check('Restauración cambia solo el borrador', restored.status === 200 && restored.data?.item?.draft?.documents?.length === 0 && publicAfterRestore.data?.item?.documents?.length === 1, { status: restored.status });

  const archivedJob = await request(`/api/admin/jobs/${encodeURIComponent(jobId)}/archive`, {
    method: 'POST', auth: true, body: { baseVersion: restored.data.item.version },
  });
  const finalJobs = await request('/api/public/jobs');
  const finalResult = await request(`/api/public/documents/${encodeURIComponent(resultId)}`, { binary: true });
  check('Limpieza de empleo y resultado', archivedJob.status === 200 && finalJobs.data?.items?.length === initialJobCount && finalResult.status === 404, { archive: archivedJob.status, count: finalJobs.data?.items?.length, pdf: finalResult.status });
} catch (error) {
  report.executionError = error.message;
} finally {
  if (token) {
    await archiveCreated();
    const logout = await request('/api/auth/logout', { method: 'POST', auth: true });
    report.cleanup.push({ type: 'logout', passed: logout.status === 204, status: logout.status });
    token = null;
  }
  report.passed = !report.executionError && report.checks.every((item) => item.passed) && report.cleanup.every((item) => item.passed !== false);
  await writeFile(new URL('./editorial-api-acceptance-report.json', import.meta.url), JSON.stringify(report, null, 2));
}

console.log(JSON.stringify({ passed: report.passed, checks: report.checks, cleanup: report.cleanup, executionError: report.executionError }, null, 2));
if (!report.passed) process.exitCode = 1;
