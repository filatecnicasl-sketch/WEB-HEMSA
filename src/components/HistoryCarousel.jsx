import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

const views = [
  {
    label: 'vista aérea',
    src: '/images/esisa-titanic-aerea-san-juan-bosco.webp',
    alt: 'Vista aérea del conjunto residencial Titanic en la avenida San Juan Bosco de San Fernando',
    title: 'Obra derivada de PNOA máxima actualidad · CC BY 4.0 · scne.es',
  },
  {
    label: 'vista frontal',
    src: '/images/esisa-titanic-frontal.webp',
    alt: 'Vista frontal y esquinada de la fachada del conjunto residencial Titanic',
  },
  {
    label: 'vista lateral',
    src: '/images/esisa-titanic-lateral.webp',
    alt: 'Vista lateral de la fachada alargada y curva del conjunto residencial Titanic',
  },
];

export default function HistoryCarousel() {
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
      setActive((current) => (current + 1) % views.length);
    }, 5500);
    return () => window.clearTimeout(timer);
  }, [active, autoplayPaused]);

  const showPrevious = () => setActive((active - 1 + views.length) % views.length);
  const showNext = () => setActive((active + 1) % views.length);

  return (
    <div
      className="r-history-photo r-history-photo--titanic r-history-carousel"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Vistas del edificio Titanic"
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
      <div className="r-history-carousel-slides" aria-live={autoplayPaused ? 'polite' : 'off'}>
        {views.map((view, index) => (
          <div
            className={`r-history-carousel-slide${index === active ? ' is-active' : ''}`}
            key={view.src}
            role="group"
            aria-roledescription="diapositiva"
            aria-label={`${index + 1} de ${views.length}: ${view.label}`}
            aria-hidden={index !== active}
          >
            <img
              src={view.src}
              alt={view.alt}
              title={view.title}
              loading={index === 0 ? 'eager' : 'lazy'}
              fetchPriority={index === 0 ? 'high' : 'auto'}
              draggable="false"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        className="r-history-carousel-playback"
        onClick={() => setManualPaused((paused) => !paused)}
        aria-label={manualPaused ? 'Reanudar reproducción automática' : 'Pausar reproducción automática'}
        title={manualPaused ? 'Reanudar carrusel' : 'Pausar carrusel'}
      >
        {manualPaused ? <Play size={16} /> : <Pause size={16} />}
      </button>

      <div className="r-history-carousel-controls">
        <button type="button" onClick={showPrevious} aria-label="Fotografía anterior"><ChevronLeft size={18} /></button>
        <div className="r-history-carousel-dots" role="group" aria-label="Elegir una vista">
          {views.map((view, index) => (
            <button
              type="button"
              key={view.src}
              className={`r-history-carousel-dot${index === active ? ' is-active' : ''}`}
              onClick={() => setActive(index)}
              aria-pressed={index === active}
              aria-label={`Ver ${view.label}`}
            ><span /></button>
          ))}
        </div>
        <button type="button" onClick={showNext} aria-label="Fotografía siguiente"><ChevronRight size={18} /></button>
      </div>
    </div>
  );
}
