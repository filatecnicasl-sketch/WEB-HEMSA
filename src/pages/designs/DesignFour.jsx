import { Link } from 'react-router-dom';
import {
  ArrowDown, ArrowRight, ArrowUpRight, Bot, BriefcaseBusiness, Building2,
  CalendarDays, ChevronRight, FileSearch, HeartHandshake, LandPlot, MapPin,
  MessageSquareText, MoveRight, ShieldCheck, Warehouse,
} from 'lucide-react';
import DesignShell from '../../components/designs/DesignShell';
import { services } from '../../content/site';

const serviceIcons = { Building2, HeartHandshake, Warehouse, LandPlot };

export default function DesignFour() {
  return (
    <DesignShell variant="four" title="San Fernando Vivo · Propuesta 4">
      <section className="d4-hero design-wrap">
        <div className="d4-hero-title"><span className="d4-overline">HEMSA / EMPRESA PÚBLICA MUNICIPAL</span><h1>SAN FERNANDO<br /><span>AVANZA</span> CONTIGO.</h1><div className="d4-hero-bottom"><p>Vivienda. Bienestar. Desarrollo.<br />Servicios públicos que mueven la ciudad.</p><Link to="/servicios" className="d4-arrow-link" aria-label="Descubrir servicios"><ArrowDown size={34} /></Link></div></div>
        <Link to="/vivienda" className="d4-hero-image"><img src="/images/ronda-estero.webp" alt="Promociones de vivienda protegida de Ronda del Estero" /><span><MapPin size={15} />RONDA DEL ESTERO<ArrowUpRight size={19} /></span></Link>
        <div className="d4-hero-green"><span>DESDE</span><strong>1996</strong><p>Construyendo<br />una ciudad mejor.</p><Building2 size={37} strokeWidth={1.25} /></div>
        <div className="d4-hero-action"><span>ACCESO RÁPIDO</span><h2>Tu cita,<br />sin vueltas.</h2><Link to="/cita-previa">Pedir cita previa<ArrowUpRight size={20} /></Link></div>
      </section>

      <section className="d4-marquee" aria-label="Áreas de HEMSA"><div><span>VIVIENDA</span><i>✳</i><span>BIENESTAR</span><i>✳</i><span>DESARROLLO</span><i>✳</i><span>SAN FERNANDO</span></div></section>

      <section className="d4-services design-wrap">
        <div className="d4-section-heading"><span>01 / QUÉ HACEMOS</span><h2>CUATRO ÁREAS.<br />UNA MISMA CIUDAD.</h2><Link to="/servicios">Todos los servicios<ArrowUpRight size={18} /></Link></div>
        <div className="d4-service-grid">{services.map((service, index) => { const Icon = serviceIcons[service.icon]; return <Link to={service.link} key={service.id} className={`d4-service d4-service-${index + 1}`}><div><span>0{index + 1}</span><Icon size={31} strokeWidth={1.4} /></div><h3>{service.title}</h3><p>{service.text}</p><span className="d4-service-link">Entrar<ArrowUpRight size={19} /></span></Link>; })}</div>
      </section>

      <section className="d4-housing">
        <div className="design-wrap d4-housing-grid"><div className="d4-housing-copy"><span className="d4-overline">02 / VIVIENDA PROTEGIDA</span><h2>348 NUEVAS<br />FORMAS DE<br /><span>VIVIR.</span></h2><p>Dos promociones en Ronda del Estero para abrir nuevas oportunidades en San Fernando.</p><Link to="/vivienda" className="d4-button">Descubrir el proyecto<MoveRight size={20} /></Link></div><div className="d4-housing-image"><img src="/images/ronda-estero.webp" alt="Patio residencial de Ronda del Estero" loading="lazy" /><div><span>01</span><strong>132</strong><small>Primera promoción</small></div><div><span>02</span><strong>216</strong><small>Segunda promoción</small></div></div></div>
      </section>

      <section className="d4-city design-wrap">
        <div className="d4-agent"><div className="d4-agent-top"><span>03 / AYUDA A DOMICILIO</span><Bot size={34} strokeWidth={1.35} /></div><h2>ATENCIÓN<br />QUE NO<br /><span>SE DETIENE.</span></h2><p>Un agente de IA para resolver consultas de forma personal, privada e inmediata. Y un equipo humano siempre detrás.</p><Link to="/area-sad">Hablar con el agente<MessageSquareText size={20} /></Link></div>
        <div className="d4-city-links"><Link to="/empleo" className="d4-employment"><span>EMPLEO / CONVOCATORIAS 2026</span><BriefcaseBusiness size={36} strokeWidth={1.3} /><h3>Trabaja por<br />San Fernando.</h3><p>Consulta los procesos de selección del Servicio de Ayuda a Domicilio.</p><span className="d4-bottom-link">Ver oportunidades<ArrowUpRight size={19} /></span></Link><div className="d4-transparency"><ShieldCheck size={30} strokeWidth={1.4} /><span>GOBIERNO ABIERTO</span><h3>Lo público,<br />a la vista.</h3><Link to="/transparencia">Portal de transparencia<ArrowUpRight size={18} /></Link></div></div>
      </section>

      <section className="d4-final"><div className="design-wrap"><div><span>SAN FERNANDO / CÁDIZ</span><h2>¿EMPEZAMOS?</h2></div><Link to="/contacto">Hablemos<ArrowUpRight size={30} /></Link></div></section>
    </DesignShell>
  );
}
