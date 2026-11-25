import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, CalendarClock, ChevronRight, ClipboardCheck,
  Download, FileText, Home as HomeIcon, KeyRound, MessageCircle,
} from 'lucide-react';
import { ExternalAnchor } from '../components/UI';

const pliegoUrl = '/documents/vivienda/pliego-adquisicion-viviendas-firmado.pdf';

const facts = [
  {
    icon: CalendarClock,
    title: '29 de enero de 2026',
    text: 'Fecha en la que finalizó el plazo de presentación de ofertas de la última convocatoria.',
  },
  {
    icon: ClipboardCheck,
    title: 'Precio y conservación',
    text: 'Las ofertas se valoraron atendiendo al precio y al estado de conservación de cada vivienda.',
  },
  {
    icon: FileText,
    title: 'Información disponible',
    text: 'El pliego de adquisición y el perfil de contratante permanecen accesibles para su consulta.',
  },
];

export default function HousingPurchase() {
  return (
    <div className="r-purchase-page">
      <section className="r-purchase-hero" id="compra">
        <div className="container">
          <nav className="r-purchase-breadcrumbs" aria-label="Migas de pan">
            <Link to="/vivienda">Vivienda</Link>
            <ChevronRight size={14} aria-hidden="true" />
            <span>Compra de viviendas</span>
          </nav>
          <div className="r-purchase-hero-grid">
            <div className="r-purchase-hero-copy">
              <span className="r-eyebrow"><HomeIcon size={15} />Vivienda en San Fernando</span>
              <h1>HEMSA compra viviendas en <span>San Fernando</span></h1>
              <p>Consulta la información de la última convocatoria de adquisición, su documentación oficial y los canales de atención disponibles para resolver tus dudas.</p>
              <span className="r-purchase-status"><CalendarClock size={16} />Convocatoria finalizada</span>
              <div className="r-purchase-actions">
                <ExternalAnchor href={pliegoUrl} className="r-button">Consultar pliego<ArrowUpRight size={16} /></ExternalAnchor>
                <Link to="/contacto" className="r-button-quiet">Consultar a HEMSA<ArrowRight size={16} /></Link>
              </div>
            </div>
            <div className="r-purchase-visual">
              <img src="/images/hemsa-compra-casa.jpg" alt="Una mano sostiene las llaves de una vivienda" />
              <div className="r-purchase-deadline">
                <CalendarClock size={23} aria-hidden="true" />
                <div><span>Último plazo</span><strong>Finalizó el 29.01.2026</strong></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container r-purchase-facts" aria-label="Datos principales de la convocatoria">
        {facts.map(({ icon: Icon, title, text }) => (
          <article key={title}>
            <Icon size={23} aria-hidden="true" />
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="r-purchase-documents">
        <div className="container r-purchase-documents-grid">
          <div className="r-purchase-documents-copy">
            <span className="r-eyebrow">Documentación oficial</span>
            <h2>Toda la información, clara y accesible</h2>
            <p>El plazo de presentación de ofertas ha finalizado. Puedes consultar el pliego publicado y acceder a la información de contratación de HEMSA.</p>
            <Link to="/transparencia#contratacion" className="r-purchase-contract-link">Ver perfil de contratante<ArrowUpRight size={16} /></Link>
          </div>
          <article className="r-purchase-document-card">
            <span className="r-purchase-document-icon"><FileText size={28} aria-hidden="true" /></span>
            <div>
              <span>Documento publicado por HEMSA · PDF</span>
              <h3>Pliego de adquisición de viviendas</h3>
              <p>Consulta las condiciones y la documentación de la convocatoria.</p>
            </div>
            <ExternalAnchor href={pliegoUrl} className="r-purchase-download" aria-label="Abrir el pliego de adquisición de viviendas en PDF"><Download size={18} /><span>Abrir pliego</span></ExternalAnchor>
          </article>
        </div>
      </section>

      <section className="container r-purchase-contact">
        <div className="r-purchase-contact-icon"><KeyRound size={28} aria-hidden="true" /></div>
        <div>
          <span>Atención cercana</span>
          <h2>¿Tienes una vivienda y quieres consultarnos?</h2>
          <p>Estamos para escucharte y ayudarte a resolver cualquier duda relacionada con la adquisición de viviendas.</p>
        </div>
        <div className="r-purchase-contact-actions">
          <Link to="/contacto" className="r-button r-button-bright">Contactar con HEMSA<MessageCircle size={17} /></Link>
          <Link to="/cita-previa" className="r-button-dark">Pide tu cita<ArrowRight size={16} /></Link>
        </div>
      </section>
    </div>
  );
}
