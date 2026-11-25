import editorialSeed from '../../integration/editorial-seed.json';

export const fallbackGrants = editorialSeed.grants;
export const fallbackJobs = editorialSeed.jobs;

export function formatDate(value) {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(Date.UTC(year, month - 1, day)));
}
