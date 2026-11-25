const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const grantsSource = fs.readFileSync(path.join(root, 'src/pages/Grants.jsx'), 'utf8');
const documentsSource = fs.readFileSync(path.join(root, 'src/content/documents.js'), 'utf8');

const grantsArraySource = grantsSource.match(/const grants = (\[[\s\S]*?\n\]);/)[1];
const iconNames = ['Accessibility', 'HeartHandshake', 'KeyRound', 'Building2'];
const grants = Function(...iconNames, `return ${grantsArraySource}`)(...iconNames);
const groups = Function(`return ${documentsSource.match(/export const documentGroups = (\[[\s\S]*?\n\]);/)[1]}`)();

function kindFor(title) {
  const value = title.toLowerCase();
  if (/formulario|solicitud|anexo/.test(value)) return 'formulario';
  if (/lista|listado|relación/.test(value)) return 'listado';
  if (/resolución|acta final|desistimiento/.test(value)) return 'resolucion';
  if (/resultado/.test(value)) return 'resultado';
  if (/base|convocatoria|orden|boja/.test(value)) return 'bases';
  return 'otro';
}

function documentRecord(document, ownerId, index, description = '') {
  return {
    id: `${ownerId}-doc-${String(index + 1).padStart(2, '0')}`,
    title: document.title,
    description: document.description || description,
    pages: document.pages || null,
    bytes: document.bytes || null,
    kind: kindFor(document.title),
    source: 'legacy',
    url: document.url,
  };
}

const grantSeed = grants.map((grant) => ({
  id: grant.id,
  category: grant.category,
  title: grant.title,
  summary: grant.summary,
  publicationDate: grant.publishedISO,
  deadlineDate: grant.deadlineISO,
  deadlineLabel: grant.deadlineLabel,
  note: grant.note,
  contentUpdatedAt: grant.updated ? '2025-11-06' : null,
  sourceUrl: grant.source || null,
  sourceLabel: grant.sourceLabel || '',
  icon: grant.icon,
  documents: grant.documents.map((document, index) => documentRecord(document, grant.id, index)),
}));

const current = new Set(['bolsa-auxiliar-2026-octubre', 'bolsa-coordinador-2026-octubre']);
const jobIds = [
  'bolsa-auxiliar-2026-octubre',
  'bolsa-coordinador-2026-octubre',
  'bolsa-auxiliar-2025',
  'bolsa-coordinador-2025',
  'bolsa-auxiliar',
  'bolsa-coordinador',
  'promoción-interna-coordinación',
];
const jobSeed = jobIds.map((id) => {
  const group = groups.find((item) => item.id === id);
  if (!group) throw new Error(`Falta el proceso ${id}`);
  return {
    id: group.id,
    title: group.title,
    description: group.description,
    publicationDate: null,
    deadlineDate: null,
    statusLabel: current.has(id) ? 'Convocatoria 2026' : 'Proceso anterior',
    displayGroup: current.has(id) ? 'current' : 'archive',
    documents: group.documents.map((document, index) => documentRecord(document, id, index)),
  };
});

const seed = { grants: grantSeed, jobs: jobSeed };
const destination = path.join(__dirname, 'editorial-seed.json');
fs.writeFileSync(destination, `${JSON.stringify(seed, null, 2)}\n`);
console.log(JSON.stringify({
  grants: grantSeed.length,
  grantDocuments: grantSeed.reduce((sum, item) => sum + item.documents.length, 0),
  jobs: jobSeed.length,
  jobDocuments: jobSeed.reduce((sum, item) => sum + item.documents.length, 0),
  destination,
}, null, 2));
