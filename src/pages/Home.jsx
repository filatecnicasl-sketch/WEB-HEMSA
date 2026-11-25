import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, Building2, CalendarDays, ClipboardList,
  HeartHandshake, KeyRound, Warehouse,
} from 'lucide-react';
import HeroCarousel from '../components/HeroCarousel';
import { useSite } from '../context/SiteContext';

const registryUrl = '/vivienda/registro';
const services = [
  {
    title: 'Servicio Municipal de Ayuda a Domicilio',
    text: 'Cuidamos de quienes más quieres, en su propia casa y con trato cercano.',
    image: '/images/servicio-ayuda-domicilio.jpg',
    alt: 'Una auxiliar acompaña a dos personas mayores en su hogar',
    to: '/ayuda-a-domicilio',
    icon: HeartHandshake,
    className: 'r-service-sad',
  },
  {
    title: 'Nuevas promociones de viviendas en venta',
    text: 'Tu nuevo hogar en La Isla, a un precio pensado para ti y tu familia.',
    image: '/images/ronda-estero.webp',
    alt: 'Nuevas promociones de viviendas en Ronda del Estero',
    to: '/vivienda#promociones',
    icon: Building2,
    className: 'r-service-housing',
  },
  {
    title: 'HEMSA compra viviendas en San Fernando',
    text: '¿Quieres vender tu casa? Te escuchamos y te acompañamos en todo el proceso.',
    image: '/images/hemsa-compra-casa.jpg',
    alt: 'Una mano sostiene las llaves de una vivienda',
    to: '/vivienda/compra',
    icon: KeyRound,
    className: 'r-service-purchase',
  },
  {
    title: 'Venta de garajes y trasteros en Ronda del Estero',
    text: 'Más espacio para lo tuyo: garajes y trasteros cerca de casa.',
    image: '/images/garajes-ronda-estero.jpeg',
    alt: 'Plazas de aparcamiento en Ronda del Estero',
    to: '/garajes-trasteros',
    icon: Warehouse,
    className: 'r-service-garages',
  },
];

function HeroTitle({ title }) {
  return title.split(/(en cada etapa)/).map((part, index) => (
    part === 'en cada etapa' ? <span key={index}>{part}</span> : part
  ));
}

export default function Home() {
  const { content } = useSite();

  return (
    <div className="r-home">
      <section className="r-hero">
        <div className="container r-hero-grid">
          <div className="r-hero-copy">
            <span className="r-eyebrow"><HeartHandshake size={14} />{content.hero.eyebrow}</span>
            <h1><HeroTitle title={content.hero.title} /></h1>
            <p>{content.hero.text}</p>
            <div className="r-hero-actions"><Link to="/cita-previa" className="r-button"><CalendarDays size={16} />Pide tu cita previa<ArrowRight size={16} /></Link><a href="#servicios" className="r-button-quiet">Cómo te ayudamos</a></div>
            <Link to={registryUrl} className="r-registry-link"><ClipboardList size={16} />Registro de Vivienda Protegida<ArrowUpRight size={15} /></Link>
          </div>
          <HeroCarousel />
        </div>
      </section>

      <section className="container r-registry" aria-labelledby="registry-title">
        <div className="r-registry-icon"><ClipboardList size={28} /></div>
        <div className="r-registry-copy"><span><span className="r-online-dot" />Plataforma online</span><h2 id="registry-title">Registro Municipal de Demandantes de Vivienda Protegida</h2><p>Accede a la plataforma del Registro para gestionar las inscripciones de demandantes de vivienda protegida de San Fernando.</p></div>
        <div className="r-registry-actions"><Link to={registryUrl} className="r-button r-button-bright">Acceder al Registro<ArrowUpRight size={16} /></Link><Link to="/cita-previa" className="r-button-dark">Pedir cita previa</Link></div>
      </section>

      <section className="container r-services" id="servicios" aria-labelledby="services-title">
        <span className="r-eyebrow">Cómo te ayudamos</span>
        <h2 id="services-title">Servicios pensados para ti y para los tuyos</h2>
        <div className="r-services-grid">
          {services.map(({ title, text, image, alt, to, icon: Icon, className }) => (
            <article className={`r-service-card ${className}`} key={title}>
              <img src={image} alt={alt} loading="lazy" />
              <div className="r-service-body"><span className="r-service-icon"><Icon size={19} /></span><h3>{title}</h3><p>{text}</p><Link to={to}>Más información<ArrowUpRight size={15} /></Link></div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
