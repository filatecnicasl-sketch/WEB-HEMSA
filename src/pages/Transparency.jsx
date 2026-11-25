import { useMemo, useState } from 'react';
import {
  ArrowUpRight, Building2, Download, ExternalLink, FileSearch, FileText,
  FolderOpen, Landmark, Search, ShieldCheck,
} from 'lucide-react';
import { documentGroups } from '../content/documents';
import { ExternalAnchor, PageHero } from '../components/UI';

const groups = Object.fromEntries(documentGroups.map((group) => [group.id, group]));

const titleOverrides = {
  'Codigo etico': 'Código ético',
  'Datos estadisticos': 'Datos estadísticos de contratación',
  'Plan antifraude': 'Plan de medidas antifraude',
  'Convenio San Fernando 19/11/2024': 'Convenio San Fernando · 19/11/2024',
};

function documentsFor(id) {
  return groups[id].documents.map((document) => ({
    ...document,
    title: titleOverrides[document.title]
      || document.title.replace(/^AÑO (\d{4})$/, 'Contratos menores · $1')
        .replace(/^Presupuesto (\d{4})$/, 'Presupuesto · $1')
        .replace(/^Cuentas (\d{4})$/, 'Cuentas anuales · $1'),
  }));
}

const sections = [
  {
    id: 'institucional',
    icon: Building2,
    title: 'Información institucional y organizativa',
    description: 'Estatutos, órganos de gobierno, estructura, plantilla y normativa interna de la empresa municipal.',
    collections: [
      { id: 'informacion-organizativa', title: 'Documentos institucionales', documents: documentsFor('informacion-organizativa') },
    ],
    resources: [],
  },
  {
    id: 'contratacion',
    icon: FileText,
    title: 'Contratos, convenios y subvenciones',
    description: 'Información estadística de contratación, relaciones anuales de contratos menores y convenios publicados.',
    collections: [
      { id: 'contratos', title: 'Contratación · Datos estadísticos', documents: documentsFor('contratos') },
      { id: 'contratos-menores', title: 'Contratos menores por ejercicio', documents: documentsFor('contratos-menores') },
      { id: 'convenios', title: 'Convenios y acuerdos', documents: documentsFor('convenios') },
    ],
    resources: [
      {
        title: 'Perfil de contratante',
        description: 'Acceso a la Plataforma de Contratación del Sector Público.',
        url: 'https://contrataciondelestado.es/wps/portal/!ut/p/b0/DcexDkAwEADQTzqbkBgQC5Gw0HY7WnJxTjUNv8_bHhhQYAQf2jHSJcj_tXXOM8mRexc24vqSGDCiRAczGDBkKw86u_uVllYG7tQ4JXOTsh7eogB_nuUHDNVcvg!!/',
        externalLabel: 'Plataforma externa',
      },
    ],
  },
  {
    id: 'economica',
    icon: Landmark,
    title: 'Información económica y presupuestaria',
    description: 'Presupuestos anuales, cuentas publicadas y accesos a la información financiera y de publicidad institucional.',
    collections: [
      { id: 'presupuestos', title: 'Presupuestos por ejercicio', documents: documentsFor('presupuestos') },
      { id: 'cuentas', title: 'Cuentas anuales', documents: documentsFor('cuentas') },
    ],
    resources: [
      {
        id: 'control-financiero-auditorias',
        title: 'Control financiero y auditorías',
        description: 'La Intervención del Ayuntamiento de San Fernando ejerce el control financiero de HEMSA.',
        additionalText: 'Hasta la fecha de actualización, ningún órgano de control de carácter externo (Tribunal de Cuentas y/o Cámara de Cuentas de Andalucía) ha emitido informes de auditoría de cuentas ni de fiscalización de HEMSA.',
        updated: 'Fecha actualización: 21 de Mayo de 2025.',
      },
      {
        id: 'gastos-publicidad',
        title: 'Gastos públicos en campañas de publicidad',
        description: 'Hasta la fecha de actualización no se ha realizado ninguna campaña de publicidad',
        updated: 'Fecha de actualizacion 11 de enero de 2024',
      },
    ],
  },
];

const normalize = (text) => text.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function Transparency() {
  const [query, setQuery] = useState('');
  const filteredSections = useMemo(() => {
    const normalized = normalize(query.trim());
    if (!normalized) return sections;
    const matches = (...text) => normalize(text.join(' ')).includes(normalized);
    return sections.map((section) => ({
      ...section,
      collections: section.collections.map((collection) => ({
        ...collection,
        documents: collection.documents.filter((document) => matches(document.title, collection.title, section.title)),
      })).filter((collection) => collection.documents.length > 0),
      resources: section.resources.filter((resource) => matches(resource.title, resource.description, resource.additionalText || '', resource.updated || '', section.title)),
    })).filter((section) => section.collections.length > 0 || section.resources.length > 0);
  }, [query]);

  const resultCount = filteredSections.reduce((total, section) => total
    + section.collections.reduce((count, collection) => count + collection.documents.length, 0)
    + section.resources.length, 0);

  return (
    <div className="open-transparency-page">
      <PageHero
        eyebrow="Gobierno abierto"
        title="Transparencia"
        text="Consulta la información institucional, económica y de contratación de HEMSA, con toda la documentación disponible organizada por materias."
      >
        <nav className="open-transparency-shortcuts" aria-label="Accesos a las áreas de transparencia">
          {sections.map(({ id, title }) => <a href={`#${id}`} key={id}>{title}<ArrowUpRight size={14} /></a>)}
        </nav>
      </PageHero>

      <section className="section open-transparency-main" aria-label="Documentación pública">
        <div className="container">
          <div className="open-transparency-tools">
            <div className="open-transparency-promise">
              <ShieldCheck size={28} />
              <span><strong>Información pública y accesible</strong><small>6 colecciones documentales y accesos de interés</small></span>
            </div>
            <label className="open-transparency-search">
              <Search size={19} />
              <span className="sr-only">Buscar en transparencia</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por documento, año o apartado…" type="search" aria-controls="transparency-results" />
            </label>
          </div>

          <div id="transparency-results">
            {query && <p className="open-transparency-results" role="status">{resultCount} {resultCount === 1 ? 'resultado' : 'resultados'} para «{query}»</p>}
            {filteredSections.length > 0 ? filteredSections.map(({ id, icon: Icon, title, description, collections, resources }) => (
              <section className="open-transparency-section" id={id} aria-labelledby={`${id}-title`} key={id}>
                <header className="open-transparency-section-header">
                  <span className="open-transparency-section-icon"><Icon size={27} /></span>
                  <div><h2 id={`${id}-title`}>{title}</h2><p>{description}</p></div>
                </header>

                <div className="open-transparency-collections">
                  {collections.map((collection) => (
                    <article className="open-transparency-collection" id={collection.id} aria-labelledby={`${collection.id}-title`} key={collection.id}>
                      <div className="open-transparency-collection-heading">
                        <h3 id={`${collection.id}-title`}><FolderOpen size={20} />{collection.title}</h3>
                        <span>{collection.documents.length} {collection.documents.length === 1 ? 'documento' : 'documentos'}</span>
                      </div>
                      <ul className="open-transparency-documents">
                        {collection.documents.map((document) => (
                          <li key={`${collection.id}-${document.title}`}>
                            <span className="open-transparency-file-icon"><FileText size={20} /></span>
                            <span className="open-transparency-file-copy"><strong>{document.title}</strong><small>{document.type === 'portal' ? 'Portal oficial · Cuenta anual en XML' : `PDF · ${document.pages} ${document.pages === 1 ? 'página' : 'páginas'}`}</small></span>
                            <ExternalAnchor href={document.url} className="open-transparency-file-link" aria-label={document.type === 'portal' ? `Consultar ${document.title} en el portal oficial` : `Abrir ${document.title} en PDF`}>
                              <span>{document.type === 'portal' ? 'Consultar' : 'Abrir PDF'}</span>{document.type === 'portal' ? <ExternalLink size={16} /> : <Download size={16} />}
                            </ExternalAnchor>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>

                {resources.length > 0 && (
                  <div className="open-transparency-resources">
                    <h3>{resources.every((resource) => !resource.url) ? 'Información publicada' : 'Accesos relacionados'}</h3>
                    <div>
                      {resources.map((resource) => resource.url ? (
                        <ExternalAnchor href={resource.url} className="open-transparency-resource" key={resource.title}>
                          <span className="open-transparency-resource-icon"><ExternalLink size={20} /></span>
                          <span><strong>{resource.title}</strong><small>{resource.description}</small><em>{resource.externalLabel}</em></span>
                          <ArrowUpRight size={18} />
                        </ExternalAnchor>
                      ) : (
                        <article className="open-transparency-resource open-transparency-resource-static" id={resource.id} key={resource.title}>
                          <span className="open-transparency-resource-icon"><FileText size={20} /></span>
                          <span>
                            <strong>{resource.title}</strong>
                            <small>{resource.description}</small>
                            {resource.additionalText && <small>{resource.additionalText}</small>}
                            {resource.updated && <small className="open-transparency-notice-date">{resource.updated}</small>}
                          </span>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )) : (
              <div className="open-transparency-empty"><FileSearch size={40} /><h2>No hemos encontrado resultados</h2><p>Prueba con otro término, por ejemplo «contratos», «2026» o «estatutos».</p><button type="button" className="button button-secondary" onClick={() => setQuery('')}>Limpiar búsqueda</button></div>
            )}
          </div>

          <div className="open-transparency-integrity">
            <div><ShieldCheck size={30} /><span><h2>Canal de denuncias</h2><p>Acceso al canal externo habilitado por HEMSA.</p></span></div>
            <ExternalAnchor href="https://whistleblowersoftware.com/secure/canaldenunciashemsa" className="button button-white">Acceder al canal<ExternalLink size={16} /></ExternalAnchor>
          </div>
          <p className="open-transparency-note">Los PDF y los enlaces externos se abren en una nueva pestaña.</p>
        </div>
      </section>
    </div>
  );
}
