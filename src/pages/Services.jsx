import { Link } from 'react-router-dom';
import {
  ArrowRight, Building2, CheckCircle2, ClipboardList,
  CreditCard, ExternalLink, FileText, Gavel, LandPlot, MapPin,
} from 'lucide-react';
import { ExternalAnchor, PageHero } from '../components/UI';

const parcels = [
  { id: 'M1.2', registry: '58.468', surface: '3.203,94 m²', buildability: '3.844,73 m²', price: '557.773,91 €', deposit: '16.733,22 €', note: 'Mantiene el paso aéreo de un cable de alta tensión pendiente de soterramiento o desvío aéreo.' },
  { id: 'M2.3', registry: '58.471', surface: '3.368,70 m²', buildability: '4.042,44 m²', price: '586.456,98 €', deposit: '17.593,71 €' },
  { id: 'M3.1', registry: '58.472', surface: '1.625,79 m²', buildability: '1.950,95 m²', price: '283.033,78 €', deposit: '8.491,01 €' },
  { id: 'M4.4', registry: '58.477', surface: '1.570,61 m²', buildability: '1.884,73 m²', price: '273.427,49 €', deposit: '8.202,82 €' },
  { id: 'M8.3', registry: '58.490', surface: '1.857,30 m²', buildability: '2.228,76 m²', price: '195.953,21 €', deposit: '5.878,60 €', note: 'La venta se refiere exclusivamente a la participación de HEMSA del 60,6033 % de la propiedad. La superficie indicada corresponde a la totalidad de la parcela.' },
];

export default function Services() {
  return (
    <>
      <PageHero
        eyebrow="Desarrollo económico"
        title="Parcelas en Fadricas II"
        text="Venta de suelo empresarial para nuevos proyectos y actividades económicas en San Fernando."
      />

      <section className="section parcels-section" id="locales">
        <div className="container">
          <div className="parcels-heading">
            <div>
              <span className="eyebrow">Parque Empresarial Fadricas II · Sector V</span>
              <h2>Cinco parcelas para impulsar tu actividad</h2>
              <p>Consulta las parcelas incluidas en la licitación, sus superficies, edificabilidad, precios mínimos y las condiciones para presentar una oferta.</p>
            </div>
            <p className="location-line"><MapPin size={18} />Polígono empresarial Fadricas II, San Fernando</p>
          </div>

          <div className="parcels-intro">
            <figure className="parcels-photo">
              <img src="/images/fadricas-ii.webp" alt="Vista aérea del polígono empresarial Fadricas II" />
              <figcaption><LandPlot size={22} /><span><strong>Suelo empresarial en San Fernando</strong>Parcelas urbanas en el Sector V del PGOU</span></figcaption>
            </figure>
            <div className="parcels-intro-content">
              <span className="parcels-intro-icon"><Building2 size={27} /></span>
              <h3>Espacio para nuevos proyectos empresariales</h3>
              <p>Las parcelas se transmiten mediante compraventa. Su uso característico es <strong>industrial intensivo</strong> y cualquier actividad deberá ajustarse al planeamiento municipal y a las condiciones urbanísticas del pliego.</p>
              <div className="parcels-key-facts">
                <div><strong>5</strong><span>parcelas en la licitación</span></div>
                <div><strong>1.570,61–3.368,70 m²</strong><span>rango de superficies</span></div>
                <div><strong>Z-1</strong><span>zona industrial intensiva</span></div>
              </div>
            </div>
          </div>

          <div className="parcels-catalogue-heading">
            <span className="eyebrow">Anexo I del pliego</span>
            <h3>Superficies y precios mínimos</h3>
            <p>Precios de licitación sin IVA. La garantía para participar corresponde al 3 % del precio mínimo de cada parcela.</p>
          </div>
          <div className="parcels-grid">
            {parcels.map((parcel) => (
              <article className="parcel-card" key={parcel.id}>
                <div className="parcel-card-heading"><span>Parcela</span><h4>{parcel.id}</h4><small>Finca registral {parcel.registry}</small></div>
                <dl>
                  <div><dt>Superficie</dt><dd>{parcel.surface}</dd></div>
                  <div><dt>Edificabilidad</dt><dd>{parcel.buildability}</dd></div>
                  <div><dt>Garantía del 3 %</dt><dd>{parcel.deposit}</dd></div>
                </dl>
                <div className="parcel-price"><span>Precio mínimo sin IVA</span><strong>{parcel.price}</strong></div>
                {parcel.note && <p className="parcel-note">{parcel.note}</p>}
              </article>
            ))}
          </div>

          <div className="parcels-feature-grid">
            <article className="parcels-feature-card">
              <span className="parcels-card-icon"><Gavel size={24} /></span>
              <h3>Subasta y presentación de ofertas</h3>
              <p>La adjudicación se realiza mediante subasta pública y el <strong>precio es el único criterio de valoración</strong>.</p>
              <ul>
                <li><CheckCircle2 size={18} /><span>Puedes presentar oferta por una o varias parcelas.</span></li>
                <li><CheckCircle2 size={18} /><span>Las ofertas parciales solo se estudian si no hay oferta por la parcela completa.</span></li>
                <li><CheckCircle2 size={18} /><span>Si la adquisición requiere segregación, el precio mínimo se incrementa un 5 % y los gastos corren a cargo del adjudicatario.</span></li>
              </ul>
            </article>
            <article className="parcels-feature-card">
              <span className="parcels-card-icon"><CreditCard size={24} /></span>
              <h3>Garantía y forma de pago</h3>
              <ul>
                <li><CheckCircle2 size={18} /><span><strong>3 % como garantía</strong>Del precio mínimo de la parcela o parcelas incluidas en la oferta.</span></li>
                <li><CheckCircle2 size={18} /><span><strong>Entrada mínima del 15 %, IVA incluido</strong>En los 15 días siguientes a la notificación de la adjudicación, descontando la garantía entregada.</span></li>
                <li><CheckCircle2 size={18} /><span><strong>Restante a la escritura pública</strong>Dentro del plazo máximo de dos meses desde la notificación de la adjudicación.</span></li>
              </ul>
            </article>
          </div>

          <div className="parcels-availability-note">
            <ClipboardList size={25} />
            <div><h3>Confirma la situación actual de cada parcela</h3><p>El plazo inicial de presentación de ofertas finalizó el 5 de noviembre de 2026 a las 13:30 h. Las parcelas que queden desiertas o sin adjudicar permanecerán en oferta pública continuada; consulta con HEMSA la disponibilidad y las condiciones vigentes antes de preparar tu oferta.</p></div>
            <Link to="/contacto" className="button">Consultar una parcela<ArrowRight size={17} /></Link>
          </div>

          <div className="parcels-bottom-grid">
            <div className="parcels-documents">
              <span className="eyebrow">Documentación oficial</span>
              <h3>Pliego, plano y anuncio</h3>
              <div className="document-list">
                <ExternalAnchor href="/documents/otros/pliego-venta-julio-2026.pdf"><FileText /><span><strong>Pliego de venta</strong><small>Condiciones, parcelas, ofertas, pagos y anexos</small></span><ExternalLink size={16} /></ExternalAnchor>
                <ExternalAnchor href="/documents/otros/2026-06-30-plano-de-venta.pdf"><FileText /><span><strong>Plano de parcelas</strong><small>Situación y distribución dentro de Fadricas II</small></span><ExternalLink size={16} /></ExternalAnchor>
                <ExternalAnchor href="/documents/otros/anuncio-licitacion-fadricas-ii-e31544ac.pdf"><FileText /><span><strong>Anuncio de licitación</strong><small>Objeto, precios, garantía, plazos y presentación</small></span><ExternalLink size={16} /></ExternalAnchor>
              </div>
            </div>
            <aside className="parcels-help-card">
              <span className="eyebrow light">Información para empresas</span>
              <h3>¿Quieres consultar una parcela?</h3>
              <p>Te ayudamos a localizar su documentación y a resolver tus dudas sobre el procedimiento.</p>
              <Link to="/cita-previa" className="button button-white">Solicitar cita previa<ArrowRight size={17} /></Link>
            </aside>
          </div>
        </div>
      </section>

    </>
  );
}
