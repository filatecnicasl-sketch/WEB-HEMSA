import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight, Building2, ChevronLeft, ChevronRight, HeartHandshake,
  Landmark, MapPin, Pause, Play,
} from 'lucide-react';

const slides = [
  {
    label: 'San Fernando',
    kicker: 'Nuestra ciudad',
    title: 'San Fernando es nuestra casa',
    text: 'Historia, barrios y personas. Todo lo que hacemos empieza aquí.',
    image: '/images/san-fernando-calle-real.webp',
    alt: 'Calle Real de San Fernando, con sus fachadas blancas y el tranvía al fondo',
    to: '/sobre-nosotros',
    linkLabel: 'Conoce HEMSA',
    icon: MapPin,
  },
  {
    label: 'Ayuntamiento',
    kicker: 'Plaza del Rey',
    title: 'El corazón de la vida municipal',
    text: 'Una casa abierta a los vecinos y al servicio de nuestra ciudad.',
    image: '/images/san-fernando-ayuntamiento.webp',
    alt: 'Fachada del Ayuntamiento de San Fernando, en la Plaza del Rey',
    to: '/sobre-nosotros',
    linkLabel: 'Conoce HEMSA',
    icon: Landmark,
  },
  {
    label: 'Teatro de las Cortes',
    kicker: 'Cuna de la Constitución',
    title: 'La historia de España vive aquí',
    text: 'El Real Teatro de las Cortes, un símbolo de libertad y de nuestra ciudad.',
    image: '/images/san-fernando-teatro-cortes.webp',
    alt: 'Exterior del Real Teatro de las Cortes de San Fernando',
    to: '/sobre-nosotros',
    linkLabel: 'Descubre nuestra historia',
    icon: Landmark,
  },
  {
    label: 'Vivienda',
    kicker: 'Nuevas promociones',
    title: 'Un hogar para tu próxima etapa',
    text: 'Viviendas pensadas para empezar algo nuevo, sin alejarte de los tuyos.',
    image: '/images/vivienda/la-marina-132-fachada.webp',
    alt: 'Fachada de la promoción de 132 viviendas de HEMSA en San Fernando',
    to: '/vivienda#promociones',
    linkLabel: 'Descubre tu vivienda',
    icon: Building2,
  },
  {
    label: 'Ayuda a domicilio',
    kicker: 'Cuidamos de los tuyos',
    title: 'El mejor cuidado es sentirse en casa',
    text: 'Acompañamiento, confianza y atención cercana para vivir mejor cada día.',
    image: '/images/hemsa-hero-personas.jpg',
    alt: 'Una auxiliar del Servicio de Ayuda a Domicilio ríe junto a una vecina',
    to: '/ayuda-a-domicilio',
    linkLabel: 'Conoce el servicio',
    icon: HeartHandshake,
  },
];

export default function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [manualPaused, setManualPaused] = useState(false);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const autoplayPaused = manualPaused || interactionPaused || reducedMotion;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener('change', updatePreference);
    return () => media.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    if (autoplayPaused) return undefined;
    const timer = window.setTimeout(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 5500);
    return () => window.clearTimeout(timer);
  }, [active, autoplayPaused]);

  const showPrevious = () => setActive((active - 1 + slides.length) % slides.length);
  const showNext = () => setActive((active + 1) % slides.length);

  return (
    <div
      className={`r-hero-visual r-hero-carousel${autoplayPaused ? ' is-paused' : ''}`}
      role="region"
      aria-roledescription="carrusel"
      aria-label="HEMSA en San Fernando"
      onMouseEnter={() => setInteractionPaused(true)}
      onMouseLeave={() => setInteractionPaused(false)}
      onFocusCapture={() => setInteractionPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setInteractionPaused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') { event.preventDefault(); showPrevious(); }
        if (event.key === 'ArrowRight') { event.preventDefault(); showNext(); }
      }}
    >
      <div className="r-hero-slides" aria-live={interactionPaused || manualPaused ? 'polite' : 'off'}>
        {slides.map(({ label, kicker, title, text, image, alt, to, linkLabel, icon: Icon }, index) => (
          <article
            className={`r-hero-slide${index === active ? ' is-active' : ''}`}
            key={label}
            role="group"
            aria-roledescription="diapositiva"
            aria-label={`${index + 1} de ${slides.length}: ${label}`}
            aria-hidden={index !== active}
          >
            <img
              className="r-hero-photo"
              src={image}
              alt={alt}
              loading={index === 0 ? 'eager' : 'lazy'}
              fetchPriority={index === 0 ? 'high' : 'auto'}
              draggable="false"
            />
            <div className="r-hero-slide-copy">
              <span className="r-hero-slide-kicker"><Icon size={14} aria-hidden="true" />{kicker}</span>
              <h2>{title}</h2>
              <p>{text}</p>
              <Link to={to} tabIndex={index === active ? 0 : -1}>{linkLabel}<ArrowUpRight size={15} /></Link>
            </div>
          </article>
        ))}
      </div>

      <div className="r-years"><strong>30</strong><span>años al servicio<br />de La Isla</span></div>
      <button
        type="button"
        className="r-hero-carousel-playback"
        onClick={() => setManualPaused((paused) => !paused)}
        aria-label={manualPaused ? 'Reanudar reproducción automática' : 'Pausar reproducción automática'}
        title={manualPaused ? 'Reanudar carrusel' : 'Pausar carrusel'}
      >
        {manualPaused ? <Play size={17} /> : <Pause size={17} />}
      </button>

      <div className="r-hero-carousel-controls">
        <div className="r-hero-carousel-tabs" role="group" aria-label="Elegir una imagen">
          {slides.map((slide, index) => (
            <button
              type="button"
              key={slide.label}
              className={`r-hero-carousel-tab${index === active ? ' is-active' : ''}`}
              onClick={() => setActive(index)}
              aria-pressed={index === active}
              aria-label={`Ver ${slide.label}`}
            >
              <span className="r-hero-tab-number">0{index + 1}</span>
              <span>{slide.label}</span>
            </button>
          ))}
        </div>
        <div className="r-hero-carousel-arrows">
          <button type="button" onClick={showPrevious} aria-label="Imagen anterior"><ChevronLeft size={18} /></button>
          <button type="button" onClick={showNext} aria-label="Imagen siguiente"><ChevronRight size={18} /></button>
        </div>
      </div>
    </div>
  );
}
