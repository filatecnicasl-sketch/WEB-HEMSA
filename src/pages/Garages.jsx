import { Link } from 'react-router-dom';
import {
  Accessibility, ArrowRight, Box, CarFront, CheckCircle2, ClipboardList,
  CreditCard, ExternalLink, FileText, MapPin,
} from 'lucide-react';
import { ExternalAnchor } from '../components/UI';

export default function Garages() {
  return (
    <section className="section muted-section garages-section" id="garajes">
      <div className="container">
        <div className="garages-heading">
          <div>
            <span className="eyebrow">Patrimonio municipal · UE-56 San Cayetano</span>
            <h1>Garajes y trasteros</h1>
            <p>Toda la información de la convocatoria para la compraventa de plazas de garaje y trasteros en construcción, en la planta sótano de la promoción de 81 viviendas de HEMSA.</p>
          </div>
          <p className="location-line"><MapPin size={18} />Ronda del Estero, esquina calle El Carmen</p>
        </div>

        <div className="garages-overview">
          <figure className="garages-photo">
            <img src="/images/garajes-ronda-estero.jpeg" alt="Plazas de aparcamiento" />
            <figcaption><CarFront size={21} /><span><strong>74 plazas de garaje y 19 trasteros</strong>En la planta sótano del edificio</span></figcaption>
          </figure>
          <div className="garages-overview-content">
            <div className="garages-stats" aria-label="Unidades de la convocatoria">
              <div><strong>74</strong><span>plazas de garaje</span></div>
              <div><strong>19</strong><span>trasteros</span></div>
              <div><strong>4</strong><span>plazas con trastero vinculado</span></div>
            </div>
            <div className="garages-price-grid">
              <article>
                <span className="garages-card-icon"><CarFront size={23} /></span>
                <h3>Plazas de garaje</h3>
                <strong className="garages-price">16.153,50 € – 24.838,28 €</strong>
                <p>Superficie útil: 12,43–17,85 m²</p>
              </article>
              <article>
                <span className="garages-card-icon"><Box size={23} /></span>
                <h3>Trasteros</h3>
                <strong className="garages-price">4.036,56 € – 13.068,00 €</strong>
                <p>Superficie útil: 2,78–9,00 m²</p>
              </article>
            </div>
            <p className="garages-price-note">Precios totales con IVA y superficies según el anexo 4 de las bases. Las cuatro plazas con trastero vinculado se adjudican de forma conjunta y tienen un precio específico.</p>
          </div>
        </div>

        <div className="garages-process">
          <div className="garages-subheading">
            <span className="eyebrow">Cómo participar</span>
            <h3>De la elección a la solicitud</h3>
          </div>
          <ol>
            <li><span>01</span><div><h4>Elige la unidad</h4><p>Consulta el plano de distribución y el cuadro de precios del anexo 4 para identificar la plaza o el trastero que te interesa.</p></div></li>
            <li><span>02</span><div><h4>Prepara la documentación</h4><p>Cumplimenta el modelo de solicitud y acompaña el DNI/NIE y la declaración responsable. Las bases recogen los documentos adicionales para personas jurídicas.</p></div></li>
            <li><span>03</span><div><h4>Registra tu solicitud</h4><p>Debe presentarse una solicitud por cada unidad en las oficinas de HEMSA, en Avenida San Juan Bosco, 46. La adjudicación sigue el orden de entrada en el registro.</p></div></li>
          </ol>
        </div>

        <div className="garages-feature-grid">
          <article className="garages-feature-card">
            <span className="garages-card-icon"><CreditCard size={24} /></span>
            <h3>Forma de pago</h3>
            <p>Según las bases de la convocatoria, el precio de adjudicación se abona en tres momentos:</p>
            <ul>
              <li><CheckCircle2 size={18} /><span><strong>10 % inicial + IVA</strong>En los 7 días siguientes a la notificación de la adjudicación.</span></li>
              <li><CheckCircle2 size={18} /><span><strong>6 mensualidades del 5 % + IVA</strong>Durante el periodo de obra.</span></li>
              <li><CheckCircle2 size={18} /><span><strong>60 % restante + IVA</strong>Al formalizar la escritura pública de compraventa.</span></li>
            </ul>
          </article>
          <article className="garages-feature-card garages-access-card">
            <span className="garages-card-icon"><Accessibility size={25} /></span>
            <h3>Plazas adaptadas</h3>
            <p>Las plazas <strong>41 y 50</strong> tienen dimensiones aptas para personas con movilidad reducida y quedan reservadas inicialmente para quienes acrediten una discapacidad igual o superior al 33 % con baremo de movilidad reducida, propia o de un miembro de su unidad familiar.</p>
            <p>Si nadie con esta condición las solicita durante el plazo, las bases permiten adjudicarlas al resto de personas interesadas.</p>
          </article>
        </div>

        <div className="garages-availability-note">
          <ClipboardList size={25} />
          <div><h3>Consulta la situación actual antes de solicitar</h3><p>El plazo inicial de presentación de solicitudes finalizó el 24 de febrero de 2026. Las bases prevén una oferta pública continuada para las unidades que queden sin adjudicar; confirma con HEMSA la disponibilidad y las condiciones vigentes.</p></div>
          <Link to="/contacto" className="button">Consultar disponibilidad<ArrowRight size={17} /></Link>
        </div>

        <div className="garages-bottom-grid">
          <div className="garages-documents">
            <span className="eyebrow">Documentación oficial</span>
            <h3>Consulta todos los detalles</h3>
            <div className="document-list">
              <ExternalAnchor href="/documents/garajes/anuncio.pdf"><FileText /><span><strong>Anuncio de venta</strong><small>Objeto, fechas y presentación de ofertas</small></span><ExternalLink size={16} /></ExternalAnchor>
              <ExternalAnchor href="/documents/garajes/bases-adjudicacion-garajes-y-trasteros-81.pdf"><FileText /><span><strong>Bases de adjudicación</strong><small>Requisitos, solicitudes, precios, pagos y anexos</small></span><ExternalLink size={16} /></ExternalAnchor>
              <ExternalAnchor href="/documents/garajes/plano-venta-garajes.pdf"><FileText /><span><strong>Plano de distribución</strong><small>Ubicación de garajes y trasteros en la planta sótano</small></span><ExternalLink size={16} /></ExternalAnchor>
            </div>
          </div>
          <aside className="garages-help-card">
            <span className="eyebrow light">Atención personalizada</span>
            <h3>¿Tienes dudas sobre una plaza o un trastero?</h3>
            <p>Te ayudamos a localizar la documentación y a resolver tus consultas sobre el procedimiento.</p>
            <Link to="/cita-previa" className="button button-white">Solicitar cita previa<ArrowRight size={17} /></Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
