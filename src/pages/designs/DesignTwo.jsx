import { Link } from 'react-router-dom';
import {
  Activity, ArrowRight, ArrowUpRight, Bot, BriefcaseBusiness, Building2,
  CalendarCheck, Check, ChevronRight, ClipboardList, FileText, HeartHandshake,
  LandPlot, LockKeyhole, MessageSquareText, Phone, ShieldCheck, Warehouse,
} from 'lucide-react';
import DesignShell from '../../components/designs/DesignShell';
import { services } from '../../content/site';

const serviceIcons = { Building2, HeartHandshake, Warehouse, LandPlot };
const panelLinks = [
  { label: 'Solicitar cita previa', meta: 'Elige día y hora', to: '/cita-previa', icon: CalendarCheck },
  { label: 'Vivienda protegida', meta: 'Promociones y registro', to: '/vivienda', icon: Building2 },
  { label: 'Ayuda a domicilio', meta: 'Atención personal con IA', to: '/area-sad', icon: MessageSquareText },
  { label: 'Documentos y contratos', meta: 'Portal de transparencia', to: '/transparencia', icon: FileText },
];

export default function DesignTwo() {
  return (
    <DesignShell variant="two" title="Pulso ciudadano · Propuesta 2">
      <section className="d2-hero">
        <div className="design-wrap d2-hero-grid">
          <div className="d2-hero-copy">
            <span className="d2-live"><i />HEMSA · Servicios públicos municipales</span>
            <h1>Tu ciudad.<br />Tus gestiones.<br /><span>Sin esperas.</span></h1>
            <p>Una ventanilla digital para acceder a vivienda, servicios municipales y atención ciudadana de forma clara, segura y directa.</p>
            <div className="design-actions"><Link to="/servicios" className="d2-button">Explorar servicios<ArrowRight size={18} /></Link><Link to="/contacto" className="d2-secondary-button"><Phone size={17} />Hablar con HEMSA</Link></div>
            <span className="d2-security"><ShieldCheck size={16} />Servicio público · Información accesible y verificable</span>
          </div>
          <div className="d2-access-panel">
            <div className="d2-panel-heading"><div><span>ACCESO CIUDADANO</span><h2>¿Qué necesitas hacer?</h2></div><Activity size={24} /></div>
            <div className="d2-panel-links">
              {panelLinks.map(({ label, meta, to, icon: Icon }) => <Link to={to} key={label}><span className="d2-panel-icon"><Icon size={21} /></span><span><strong>{label}</strong><small>{meta}</small></span><ChevronRight size={19} /></Link>)}
            </div>
            <div className="d2-panel-footer"><span><i />Atención en línea</span><Link to="/contacto">Ver horarios<ArrowUpRight size={14} /></Link></div>
          </div>
        </div>
        <div className="design-wrap d2-stats">
          <div><strong>1996</strong><span>Empresa municipal constituida</span></div>
          <div><strong>348</strong><span>Nuevas viviendas en Ronda del Estero</span></div>
          <div><strong>04</strong><span>Áreas de servicio a la ciudadanía</span></div>
          <div className="d2-stat-message"><span>San Fernando</span><strong>Todo empieza aquí.</strong></div>
        </div>
      </section>

      <section className="d2-services">
        <div className="design-wrap">
          <div className="d2-section-heading"><div><span className="d2-label">01 / SERVICIOS</span><h2>Una ventanilla.<br />Todas las soluciones.</h2></div><p>Accede directamente a la información que necesitas, sin recorrer toda la web.</p></div>
          <div className="d2-service-grid">
            {services.map((service, index) => {
              const Icon = serviceIcons[service.icon];
              return <Link to={service.link} key={service.id} className="d2-service-card"><div className="d2-service-top"><span>0{index + 1}</span><Icon size={29} strokeWidth={1.5} /></div><h3>{service.title}</h3><p>{service.text}</p><span className="d2-card-link">Acceder al servicio<ArrowUpRight size={17} /></span></Link>;
            })}
          </div>
          <div className="d2-service-extra"><Link to="/empleo"><BriefcaseBusiness size={21} /><span><strong>Empleo público</strong><small>Convocatorias y bolsas de trabajo</small></span><ArrowUpRight size={18} /></Link><Link to="/transparencia"><ClipboardList size={21} /><span><strong>Gobierno abierto</strong><small>Información institucional y económica</small></span><ArrowUpRight size={18} /></Link></div>
        </div>
      </section>

      <section className="d2-housing design-wrap">
        <div className="d2-housing-image"><img src="/images/ronda-estero.webp" alt="Nuevas promociones de Ronda del Estero" loading="lazy" /><span>PROYECTO / RONDA DEL ESTERO</span></div>
        <div className="d2-housing-copy"><span className="d2-label">02 / VIVIENDA PROTEGIDA</span><h2>Espacio para tu próxima etapa.</h2><p>Dos nuevas promociones en venta que suman 348 viviendas protegidas en San Fernando.</p><ul><li><Check size={16} />Adjudicación mediante el Registro Municipal de Demandantes</li><li><Check size={16} />Información clara sobre requisitos y documentación</li></ul><div className="d2-housing-data"><div><strong>132</strong><span>Primera promoción</span></div><div><strong>216</strong><span>Segunda promoción</span></div></div><Link to="/vivienda" className="d2-button">Ver viviendas<ArrowRight size={17} /></Link></div>
      </section>

      <section className="d2-agent">
        <div className="design-wrap d2-agent-grid">
          <div className="d2-agent-orb"><span><Bot size={48} strokeWidth={1.3} /></span><i /><i /><i /></div>
          <div><span className="d2-label">03 / ATENCIÓN INTELIGENTE</span><h2>Un agente que escucha.<br /><span>Un equipo que responde.</span></h2><p>El asistente de IA del Servicio de Ayuda a Domicilio atiende consultas individualmente, agiliza gestiones y avisa a coordinación cuando se necesita intervención humana.</p><div className="d2-agent-features"><span><LockKeyhole size={16} />Privado</span><span><MessageSquareText size={16} />Personal</span><span><HeartHandshake size={16} />Con supervisión humana</span></div></div>
          <Link to="/area-sad" className="d2-agent-button"><span>Iniciar conversación</span><ArrowUpRight size={24} /></Link>
        </div>
      </section>
    </DesignShell>
  );
}
