import { Link } from 'react-router-dom';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Bot, Building2, CalendarDays,
  ClipboardList, FileSearch, HeartHandshake, LandPlot, MapPin, MessageCircle,
  ShieldCheck, Warehouse,
} from 'lucide-react';
import DesignShell from '../../components/designs/DesignShell';
import { services } from '../../content/site';

const serviceIcons = { Building2, HeartHandshake, Warehouse, LandPlot };
const actions = [
  { title: 'Pedir cita previa', text: 'Atención presencial con el equipo de HEMSA', to: '/cita-previa', icon: CalendarDays },
  { title: 'Registro de demandantes', text: 'Requisitos y acceso a vivienda protegida', to: '/vivienda/registro', icon: ClipboardList },
  { title: 'Ayuda a domicilio', text: 'Información y asistencia personal con IA', to: '/area-sad', icon: MessageCircle },
  { title: 'Contratación pública', text: 'Contratos, convenios y perfil de contratante', to: '/transparencia#contratacion', icon: FileSearch },
];

export default function DesignOne() {
  return (
    <DesignShell variant="one" title="Horizonte · Propuesta 1">
      <section className="d1-hero design-wrap">
        <div className="d1-hero-copy">
          <span className="d1-kicker"><span />Empresa pública municipal · San Fernando</span>
          <h1>Construimos ciudad.<br /><em>Cuidamos</em> a las personas.</h1>
          <p>Vivienda, desarrollo urbano y servicios municipales para mejorar la vida de quienes hacen San Fernando cada día.</p>
          <div className="design-actions">
            <Link to="/servicios" className="design-button">Descubre HEMSA<ArrowRight size={18} /></Link>
            <Link to="/vivienda" className="design-text-link">Ver promociones<ArrowUpRight size={17} /></Link>
          </div>
          <div className="d1-hero-note"><strong>Desde 1996</strong><span>Una empresa pública comprometida con el futuro del municipio.</span></div>
        </div>
        <div className="d1-hero-visual">
          <span className="d1-vertical-label">SAN FERNANDO · CÁDIZ</span>
          <figure>
            <img src="/images/ronda-estero.webp" alt="Patio de las nuevas viviendas protegidas de Ronda del Estero" />
            <figcaption><span>01 / Vivienda protegida</span><strong>Ronda del Estero</strong></figcaption>
          </figure>
          <span className="d1-hero-stamp" aria-hidden="true">H<br />E<br />M<br />S<br />A</span>
        </div>
      </section>

      <section className="d1-actions design-wrap" aria-labelledby="d1-actions-title">
        <div className="d1-section-index"><span>01</span><h2 id="d1-actions-title">¿Qué necesitas?</h2></div>
        <div className="d1-action-list">
          {actions.map(({ title, text, to, icon: Icon }) => (
            <Link to={to} key={title} className="d1-action-item">
              <Icon size={23} strokeWidth={1.6} />
              <span><strong>{title}</strong><small>{text}</small></span>
              <ArrowDownRight size={20} />
            </Link>
          ))}
        </div>
      </section>

      <section className="d1-housing">
        <div className="design-wrap">
          <div className="d1-section-heading">
            <div><span className="d1-kicker"><span />02 · Nuevos hogares</span><h2>Un lugar donde<br />empezar de nuevo.</h2></div>
            <p>Dos promociones de vivienda protegida en venta, con espacios pensados para vivir y compartir.</p>
          </div>
          <div className="d1-housing-visual">
            <img src="/images/ronda-estero.webp" alt="Promociones de vivienda protegida en Ronda del Estero" loading="lazy" />
            <div className="d1-housing-card">
              <span><MapPin size={15} />Ronda del Estero · San Fernando</span>
              <h3>348 viviendas.<br />Un nuevo horizonte.</h3>
              <div className="d1-housing-numbers"><div><strong>132</strong><span>Primera promoción</span></div><div><strong>216</strong><span>Segunda promoción</span></div></div>
              <Link to="/vivienda#promociones" className="design-button">Conocer las promociones<ArrowUpRight size={17} /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="d1-services design-wrap">
        <div className="d1-section-index"><span>03</span><h2>Áreas de actuación</h2></div>
        <div className="d1-services-content">
          <div className="d1-services-intro"><h2>Lo público,<br /><em>bien hecho.</em></h2><p>Cuatro áreas, un mismo compromiso: ofrecer servicios útiles, transparentes y cercanos.</p></div>
          <div className="d1-service-list">
            {services.map((service, index) => {
              const Icon = serviceIcons[service.icon];
              return <Link to={service.link} key={service.id}><span>0{index + 1}</span><Icon size={24} strokeWidth={1.5} /><div><h3>{service.title}</h3><p>{service.text}</p></div><ArrowUpRight size={20} /></Link>;
            })}
          </div>
        </div>
      </section>

      <section className="d1-care design-wrap">
        <div className="d1-care-icon"><HeartHandshake size={38} strokeWidth={1.4} /></div>
        <div className="d1-care-copy"><span>04 · Servicio de Ayuda a Domicilio</span><h2>La tecnología también puede cuidar.</h2><p>Nuestro agente de IA atiende cada consulta de forma personal y privada, resuelve gestiones y deriva al equipo humano cuando hace falta.</p></div>
        <div className="d1-care-action"><span><ShieldCheck size={16} />Conversación privada</span><Link to="/area-sad" className="design-button design-button-light"><Bot size={18} />Hablar con el agente<ArrowRight size={17} /></Link></div>
      </section>
    </DesignShell>
  );
}
