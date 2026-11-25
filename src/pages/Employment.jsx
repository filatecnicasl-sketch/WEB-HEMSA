import { Link } from 'react-router-dom';
import {
  BriefcaseBusiness, CalendarDays, CheckCircle2, ChevronDown, ChevronRight,
  Download, FileText, Mail, Users,
} from 'lucide-react';
import { ExternalAnchor, PageHero } from '../components/UI';
import { fallbackJobs } from '../content/editorial';
import usePublicCollection from '../hooks/usePublicCollection';

const documentCount = (items) => items.reduce((total, group) => total + group.documents.length, 0);

function DocumentLink({ document }) {
  return (
    <li>
      <ExternalAnchor href={document.url} aria-label={`Abrir ${document.title} en PDF`}>
        <FileText size={18} />
        <span><strong>{document.title}</strong><small>PDF{document.pages ? ` · ${document.pages} ${document.pages === 1 ? 'página' : 'páginas'}` : ''}</small></span>
        <Download size={16} />
      </ExternalAnchor>
    </li>
  );
}

export default function Employment() {
  const jobs = usePublicCollection('jobs', fallbackJobs);
  const currentGroups = jobs.filter((job) => job.displayGroup === 'current');
  const archiveGroups = jobs.filter((job) => job.displayGroup === 'archive');

  return (
    <>
      <PageHero
        eyebrow="Trabaja con nosotros"
        title="Empleo"
        text="Consulta las convocatorias, bolsas de empleo y procesos de selección de personal de HEMSA, con toda su documentación oficial."
      />

      <section className="employment-notice">
        <div className="container">
          <div className="employment-notice-icon"><Users size={32} /></div>
          <div><span className="pill">Procesos de selección</span><h2>Servicio Municipal de Ayuda a Domicilio</h2><p>Convocatorias, bolsas de empleo, listados y resoluciones publicadas por HEMSA.</p></div>
          <BriefcaseBusiness size={54} className="employment-watermark" />
        </div>
      </section>

      <section className="section jobs-section">
        <div className="container">
          <div className="section-topline"><div><span className="eyebrow">Convocatorias 2026</span><h2>Procesos de selección</h2></div><span className="job-count">{currentGroups.length} convocatorias · {documentCount(currentGroups)} documentos</span></div>
          <div className="jobs-grid">
            {currentGroups.map((group) => (
              <article className="job-card job-card-documents" id={group.id} key={group.id}>
                <div className="job-card-top"><span className="job-icon"><BriefcaseBusiness size={24} /></span><span className="pill"><CheckCircle2 size={14} />{group.statusLabel}</span></div>
                <h3>{group.title.replace(` · ${group.statusLabel}`, '')}</h3>
                <p>{group.description}</p>
                <ul className="job-document-list">
                  {group.documents.map((document) => <DocumentLink document={document} key={document.id} />)}
                </ul>
              </article>
            ))}
          </div>
          <div className="jobs-help">
            <div><CalendarDays size={23} /><span><strong>¿Necesitas ayuda con una convocatoria?</strong><small>Consulta siempre las bases y plazos oficiales antes de presentar tu solicitud.</small></span></div>
            <Link to="/contacto" className="text-link">Contactar con HEMSA<ChevronRight size={17} /></Link>
          </div>
        </div>
      </section>

      <section className="section muted-section archive-section">
        <div className="container">
          <div className="section-topline">
            <div><span className="eyebrow">Histórico</span><h2>Convocatorias anteriores y bolsas de empleo</h2><p>Accede a las bases, solicitudes, listados y resoluciones de cada proceso.</p></div>
            <span className="job-count">{archiveGroups.length} procesos · {documentCount(archiveGroups)} documentos</span>
          </div>
          <div className="job-archive-list">
            {archiveGroups.map((group) => (
              <details className="job-archive-item" id={group.id} key={group.id}>
                <summary>
                  <span className="job-icon"><BriefcaseBusiness size={22} /></span>
                  <span className="job-archive-summary"><strong>{group.title}</strong><small>{group.description} · {group.documents.length} documentos</small></span>
                  <ChevronDown size={20} className="job-archive-chevron" />
                </summary>
                <ul className="job-archive-documents">
                  {group.documents.map((document) => <DocumentLink document={document} key={document.id} />)}
                </ul>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="contact-cta">
        <div className="container contact-cta-inner">
          <div><span className="eyebrow light">Atención a candidaturas</span><h2>Resolvemos tus dudas</h2><p>Si tienes una consulta sobre un proceso, escríbenos.</p></div>
          <Link to="/contacto" className="button button-white"><Mail size={17} />Contactar</Link>
        </div>
      </section>
    </>
  );
}
