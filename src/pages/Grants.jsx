import {
  Accessibility, ArrowUpRight, Building2, CalendarDays, CalendarX2,
  Clock3, Download, FileText, FolderOpen, HeartHandshake, Home, Info,
  KeyRound, Landmark, Megaphone,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ExternalAnchor, PageHero } from '../components/UI';
import { fallbackGrants, formatDate } from '../content/editorial';
import usePublicCollection from '../hooks/usePublicCollection';

const icons = { Accessibility, HeartHandshake, KeyRound, Building2, Megaphone };
const today = () => new Date().toISOString().slice(0, 10);

export default function Grants() {
  const grants = usePublicCollection('grants', fallbackGrants);
  const documentTotal = grants.reduce((total, grant) => total + grant.documents.length, 0);
  const allClosed = grants.every((grant) => grant.deadlineDate && grant.deadlineDate < today());

  return (
    <div className="grants-page">
      <PageHero
        eyebrow="Vivienda · Información y actualidad"
        title="Ayudas y subvenciones"
        text="Convocatorias, resoluciones y documentación oficial reunidas en un solo lugar, con fechas claras para que puedas consultar cada expediente."
      >
        <div className="grants-hero-meta" aria-label="Contenido del tablón">
          <span><Megaphone size={17} />Tablón de convocatorias</span>
          <span><FolderOpen size={17} />{documentTotal} documentos oficiales</span>
          <span><Landmark size={17} />Fuentes públicas verificadas</span>
        </div>
      </PageHero>

      <section className="section grants-board" aria-labelledby="grants-board-title">
        <div className="container">
          <div className="grants-board-heading">
            <div>
              <span className="eyebrow">Actualidad documental</span>
              <h2 id="grants-board-title">Convocatorias publicadas</h2>
              <p>Cada noticia recoge su fecha de publicación, el vencimiento del plazo y todos los documentos relacionados.</p>
            </div>
            <div className="grants-archive-count" aria-label={`${grants.length} convocatorias históricas`}>
              <strong>{String(grants.length).padStart(2, '0')}</strong>
              <span>convocatorias<br />en el archivo</span>
            </div>
          </div>

          <div className="grants-status-note" role="note">
            <Info size={22} />
            <div>
              <strong>{allClosed ? 'Archivo de convocatorias anteriores' : 'Información sobre los plazos'}</strong>
              <p>{allClosed ? 'Los plazos recogidos en este tablón han finalizado. La documentación se mantiene disponible para consulta; no son convocatorias abiertas actualmente.' : 'Consulta la fecha de vencimiento y las bases de cada convocatoria. La documentación publicada permanece disponible en esta página.'}</p>
            </div>
          </div>

          <div className="grants-news-list">
            {grants.map(({ id, icon, category, title, summary, publicationDate, deadlineDate, deadlineLabel, contentUpdatedAt, note, sourceUrl, sourceLabel, documents }) => {
              const Icon = icons[icon] || Megaphone;
              const closed = deadlineDate && deadlineDate < today();
              return (
                <article className="grants-news-item" id={id} aria-labelledby={`${id}-title`} key={id}>
                  <header className="grants-news-header">
                    <div className="grants-news-category"><Icon size={19} /><span>{category}</span></div>
                    <span className="grants-closed"><Clock3 size={15} />{closed ? 'Plazo vencido' : 'Convocatoria publicada'}</span>
                  </header>
                  <h3 id={`${id}-title`}>{title}</h3>
                  <p className="grants-news-summary">{summary}</p>

                  <div className="grants-date-grid">
                    <div>
                      <CalendarDays size={20} />
                      <span><small>Fecha de publicación</small><time dateTime={publicationDate}>{formatDate(publicationDate)}</time></span>
                    </div>
                    <div className="grants-deadline">
                      <CalendarX2 size={20} />
                      <span><small>{deadlineLabel}</small>{deadlineDate ? <time dateTime={deadlineDate}>{formatDate(deadlineDate)}</time> : <span>Sin vencimiento</span>}</span>
                    </div>
                  </div>

                  {note && <p className="grants-news-note">{note}</p>}
                  {contentUpdatedAt && <p className="grants-news-updated"><FileText size={15} />Actualizada el {formatDate(contentUpdatedAt)}</p>}

                  <section className="grants-documents" aria-labelledby={`${id}-documents`}>
                    <div className="grants-documents-heading">
                      <h4 id={`${id}-documents`}><FolderOpen size={19} />Documentación de la convocatoria</h4>
                      <span>{documents.length} {documents.length === 1 ? 'documento' : 'documentos'}</span>
                    </div>
                    <ul>
                      {documents.map(({ id: documentId, title: documentTitle, description, pages, url }) => (
                        <li key={documentId}>
                          <span className="grants-file-icon"><FileText size={21} /></span>
                          <span className="grants-file-copy"><strong>{documentTitle}</strong><span>{description}</span><small>PDF{pages ? ` · ${pages} ${pages === 1 ? 'página' : 'páginas'}` : ''}</small></span>
                          <ExternalAnchor href={url} className="grants-file-link" aria-label={`Abrir ${documentTitle} en PDF`}>
                            <span>Abrir PDF</span><Download size={17} />
                          </ExternalAnchor>
                        </li>
                      ))}
                    </ul>
                  </section>

                  {sourceUrl && <ExternalAnchor href={sourceUrl} className="grants-official-source">{sourceLabel || 'Consultar fuente oficial'}<ArrowUpRight size={15} /></ExternalAnchor>}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section grants-help" aria-labelledby="grants-help-title">
        <div className="container grants-help-card">
          <div className="grants-help-icon"><Home size={29} /></div>
          <div>
            <span className="eyebrow">Información municipal</span>
            <h2 id="grants-help-title">¿Necesitas consultar una ayuda o tu expediente?</h2>
            <p>El personal de HEMSA puede orientarte sobre la documentación publicada y los servicios municipales de vivienda.</p>
          </div>
          <Link to="/cita-previa" className="button button-white">Pedir cita previa<ArrowUpRight size={17} /></Link>
        </div>
      </section>
    </div>
  );
}
