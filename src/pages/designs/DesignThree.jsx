import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, Bot, Building2, CalendarDays, CheckCircle2,
  Clock3, FileText, Heart, HeartHandshake, Home, LandPlot, LockKeyhole,
  Mail, MapPin, MessageCircle, Phone, Sparkles, Warehouse,
} from 'lucide-react';
import DesignShell from '../../components/designs/DesignShell';
import { services } from '../../content/site';

const serviceIcons = { Building2, HeartHandshake, Warehouse, LandPlot };
const needs = [
  { title: 'Quiero pedir una cita', text: 'Te atendemos en nuestras oficinas', to: '/cita-previa', icon: CalendarDays, color: 'mint' },
  { title: 'Busco una vivienda', text: 'Promociones y registro de demandantes', to: '/vivienda', icon: Home, color: 'sand' },
  { title: 'Necesito ayuda en casa', text: 'Información sobre el servicio municipal', to: '/area-sad', icon: HeartHandshake, color: 'rose' },
  { title: 'Busco un documento', text: 'Transparencia, contratos y convenios', to: '/transparencia', icon: FileText, color: 'grey' },
];

export default function DesignThree() {
  return (
    <DesignShell variant="three" title="Cercanía · Propuesta 3">
      <section className="d3-hero design-wrap">
        <div className="d3-hero-copy"><span className="d3-badge"><Sparkles size={15} />Servicios públicos, trato humano</span><h1>Estamos aquí<br />para <em>ayudarte.</em></h1><p>Somos HEMSA, la empresa municipal que trabaja por tu bienestar y por el futuro de San Fernando.</p><div className="design-actions"><Link to="/servicios" className="d3-button">¿En qué podemos ayudarte?<ArrowRight size={18} /></Link><Link to="/contacto" className="d3-contact-link"><Phone size={17} />956 945 000</Link></div><div className="d3-trust"><span><CheckCircle2 size={16} />Información clara</span><span><CheckCircle2 size={16} />Atención cercana</span><span><CheckCircle2 size={16} />Gestión sencilla</span></div></div>
        <div className="d3-hero-visual"><div className="d3-organic-image"><img src="/images/ronda-estero.webp" alt="Espacios comunes de las nuevas viviendas de HEMSA" /></div><div className="d3-floating-note"><span><Heart size={18} fill="currentColor" /></span><div><strong>San Fernando, nuestra casa</strong><small>Trabajamos por las personas desde 1996</small></div></div><span className="d3-doodle" aria-hidden="true">✳</span></div>
      </section>

      <section className="d3-needs">
        <div className="design-wrap"><div className="d3-section-title"><span>PARA HACERTELO MÁS FÁCIL</span><h2>¿Qué necesitas hoy?</h2><p>Elige una opción y vamos directos al grano.</p></div><div className="d3-needs-grid">{needs.map(({ title, text, to, icon: Icon, color }) => <Link to={to} key={title} className={`d3-need-card ${color}`}><span className="d3-need-icon"><Icon size={27} strokeWidth={1.6} /></span><div><h3>{title}</h3><p>{text}</p></div><span className="d3-round-arrow"><ArrowUpRight size={19} /></span></Link>)}</div></div>
      </section>

      <section className="d3-care design-wrap">
        <div className="d3-care-card">
          <div className="d3-care-copy"><span className="d3-small-label"><MessageCircle size={15} />AYUDA A DOMICILIO · ATENCIÓN PERSONAL</span><h2>Ahora puedes hablar<br />con nosotros, <em>a tu ritmo.</em></h2><p>Nuestro agente de inteligencia artificial responde tus dudas, te ayuda con las gestiones y avisa al equipo de coordinación cuando lo necesitas.</p><div className="d3-care-points"><span><Clock3 size={18} /><strong>Sin esperas</strong><small>Respuesta inmediata</small></span><span><LockKeyhole size={18} /><strong>Solo para ti</strong><small>Conversación privada</small></span><span><HeartHandshake size={18} /><strong>Siempre acompañado</strong><small>Con apoyo del equipo humano</small></span></div><Link to="/area-sad" className="d3-button"><Bot size={18} />Iniciar una conversación privada<ArrowRight size={17} /></Link></div>
          <div className="d3-care-visual"><span className="d3-care-big-icon"><HeartHandshake size={70} strokeWidth={1.15} /></span><div className="d3-message d3-message-one"><span>Hola, soy el asistente de HEMSA.</span><small>¿En qué puedo ayudarte?</small></div><div className="d3-message d3-message-two"><CheckCircle2 size={17} /><span>Te escuchamos.</span></div><span className="d3-privacy-note"><LockKeyhole size={13} />Tu conversación no es pública</span></div>
        </div>
      </section>

      <section className="d3-housing">
        <div className="design-wrap d3-housing-grid"><div className="d3-housing-photo"><img src="/images/ronda-estero.webp" alt="Viviendas protegidas de Ronda del Estero" loading="lazy" /><span><MapPin size={15} />Ronda del Estero</span></div><div className="d3-housing-copy"><span className="d3-small-label"><Home size={15} />UN HOGAR PARA CADA ETAPA</span><h2>Nuevas viviendas,<br /><em>nuevas historias.</em></h2><p>Descubre las dos nuevas promociones de vivienda protegida en venta. Te explicamos los requisitos y te acompañamos en cada paso.</p><div className="d3-home-stats"><div><strong>132</strong><span>viviendas en la primera promoción</span></div><div><strong>216</strong><span>viviendas en la segunda promoción</span></div></div><div className="design-actions"><Link to="/vivienda#promociones" className="d3-button">Ver las viviendas<ArrowRight size={17} /></Link><Link to="/vivienda/registro" className="d3-text-link">Cómo inscribirse<ArrowUpRight size={16} /></Link></div></div></div>
      </section>

      <section className="d3-services design-wrap"><div className="d3-section-title"><span>TODO LO QUE HACEMOS</span><h2>Cuidamos lo que importa.</h2></div><div className="d3-service-grid">{services.map((service) => { const Icon = serviceIcons[service.icon]; return <Link to={service.link} key={service.id}><Icon size={30} strokeWidth={1.45} /><h3>{service.title}</h3><p>{service.text}</p><span>Saber más<ArrowUpRight size={16} /></span></Link>; })}</div><div className="d3-help-line"><Mail size={20} /><span>¿No encuentras lo que buscas?</span><Link to="/contacto">Estamos para ayudarte<ArrowRight size={16} /></Link></div></section>
    </DesignShell>
  );
}
