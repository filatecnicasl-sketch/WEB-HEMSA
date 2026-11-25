import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Building2, ExternalLink, MapPin,
} from 'lucide-react';
import { ExternalAnchor, PageHero } from '../components/UI';

const promotions = [
  {
    id: 'la-marina',
    status: 'Vivienda protegida en venta',
    title: 'Residencial La Marina',
    location: 'Ronda del Estero · avenida de La Marina',
    description: 'Una promoción de 132 viviendas protegidas distribuidas en seis edificios, con espacios comunes, patio interior y plaza ajardinada.',
    details: 'Incluye viviendas de uno, dos y tres dormitorios, además de 94 plazas de garaje y 47 trasteros.',
    stats: [
      { value: '132', label: 'viviendas' },
      { value: '6', label: 'edificios' },
      { value: '1–3', label: 'dormitorios' },
    ],
    images: [
      { src: '/images/vivienda/la-marina-132-fachada.webp', alt: 'Fachada de Residencial La Marina', label: 'Fachada principal' },
      { src: '/images/vivienda/la-marina-132-entrada.webp', alt: 'Acceso exterior de Residencial La Marina', label: 'Entrada' },
      { src: '/images/vivienda/la-marina-132-interior.webp', alt: 'Zona común interior de Residencial La Marina', label: 'Zona común interior' },
      { src: '/images/vivienda/la-marina-132-patio.webp', alt: 'Patio y recorrido peatonal de Residencial La Marina', label: 'Patio' },
      { src: '/images/vivienda/la-marina-132-rotonda.webp', alt: 'Vista exterior de Residencial La Marina desde la rotonda', label: 'Vista desde la rotonda' },
    ],
    video: '/videos/vivienda/la-marina-132.mp4',
    videoTitle: 'Descubre Residencial La Marina',
    videoText: 'Recorre la promoción y conoce sus exteriores, zonas comunes, terrazas e interiores en este vídeo de 1 minuto y 12 segundos.',
    videoLabel: 'Vídeo promocional de Residencial La Marina, 132 viviendas protegidas',
    link: '/vivienda/registro',
    linkLabel: 'Consultar información y registro',
  },
  {
    id: 'ronda-estero-81',
    status: 'Alquiler con opción a compra',
    title: 'Ronda del Estero · 81 viviendas',
    location: 'Ronda del Estero · San Fernando',
    description: 'Una promoción de 81 viviendas protegidas organizada en cuatro bloques, destinada al alquiler con opción a compra.',
    details: 'El conjunto incluye viviendas de uno a cuatro dormitorios, locales comerciales, garajes y trasteros.',
    stats: [
      { value: '81', label: 'viviendas' },
      { value: '4', label: 'bloques' },
      { value: '1–4', label: 'dormitorios' },
    ],
    images: [
      { src: '/images/vivienda/ronda-estero-81-exterior.webp', alt: 'Fachada exterior de las 81 viviendas de Ronda del Estero', label: 'Exterior' },
      { src: '/images/vivienda/ronda-estero-81-plaza-2.webp', alt: 'Plaza interior de las 81 viviendas de Ronda del Estero', label: 'Plaza interior, vista 1' },
      { src: '/images/vivienda/ronda-estero-81-plaza-3.webp', alt: 'Zonas comunes de las 81 viviendas de Ronda del Estero', label: 'Plaza interior, vista 2' },
      { src: '/images/vivienda/ronda-estero-81-plaza-4.webp', alt: 'Patio y galerías de las 81 viviendas de Ronda del Estero', label: 'Patio y galerías' },
    ],
    video: '/videos/vivienda/ronda-estero-81-dron.mp4',
    videoTitle: 'La obra vista desde el aire',
    videoText: 'Un recorrido con dron de 3 minutos y 25 segundos por la construcción de las 81 viviendas protegidas.',
    videoLabel: 'Vídeo con dron de la obra de 81 viviendas protegidas de Ronda del Estero',
    link: '/contacto',
    linkLabel: 'Consultar a HEMSA',
  },
];

function Promotion({ promotion }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const image = promotion.images[selectedImage];
  const isInternalLink = promotion.link.startsWith('/');

  return (
    <article className="promotion-detail" id={promotion.id} aria-labelledby={`${promotion.id}-title`}>
      <div className="promotion-heading">
        <div>
          <span className="pill"><Building2 size={14} />{promotion.status}</span>
          <h3 id={`${promotion.id}-title`}>{promotion.title}</h3>
        </div>
        <span className="property-location"><MapPin size={16} />{promotion.location}</span>
      </div>

      <div className="housing-detail-grid promotion-layout">
        <div className="promotion-media">
          <div className="housing-gallery promotion-gallery">
            <img src={image.src} alt={image.alt} />
            <span><Building2 size={17} />{image.label}</span>
          </div>
          <div className="promotion-thumbnails" role="group" aria-label={`Fotografías de ${promotion.title}`}>
            {promotion.images.map((thumbnail, index) => (
              <button
                type="button"
                key={thumbnail.src}
                className={selectedImage === index ? 'active' : ''}
                aria-pressed={selectedImage === index}
                aria-label={`Ver ${thumbnail.label.toLowerCase()}`}
                onClick={() => setSelectedImage(index)}
              >
                <img src={thumbnail.src} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        </div>

        <div className="housing-summary">
          <div className="property-summary-card">
            <span className="property-location"><MapPin size={16} />{promotion.location}</span>
            <div className="summary-numbers promotion-stats">
              {promotion.stats.map((stat) => <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}
            </div>
            <p>{promotion.description}</p>
            <p>{promotion.details}</p>
            {isInternalLink ? (
              <Link to={promotion.link} className="button">{promotion.linkLabel}<ArrowRight size={16} /></Link>
            ) : (
              <ExternalAnchor href={promotion.link} className="button">{promotion.linkLabel}<ExternalLink size={16} /></ExternalAnchor>
            )}
          </div>
        </div>
      </div>

      <div className="promotion-video">
        <div className="promotion-video-copy">
          <span className="eyebrow">Vídeo de la promoción</span>
          <h4>{promotion.videoTitle}</h4>
          <p>{promotion.videoText}</p>
        </div>
        <video controls preload="none" playsInline poster={promotion.images[0].src} aria-label={promotion.videoLabel}>
          <source src={promotion.video} type="video/mp4" />
          Tu navegador no puede reproducir este vídeo.
        </video>
      </div>
    </article>
  );
}

export default function Housing() {
  return (
    <div className="housing-page">
      <PageHero
        eyebrow="Promociones de vivienda protegida"
        title="Conoce cada promoción"
        text="Consulta por separado las fotografías, los vídeos y las características de Residencial La Marina y de las 81 viviendas de Ronda del Estero."
      />

      <section className="section housing-promotions" id="promociones">
        <div className="container">
          <Promotion promotion={promotions[0]} />
          <aside className="future-promotion" aria-label="Otra promoción prevista">
            <Building2 size={22} />
            <div><strong>Residencial Hércules</strong><span>216 viviendas protegidas previstas en Ronda del Estero.</span></div>
          </aside>
          <Promotion promotion={promotions[1]} />
        </div>
      </section>
    </div>
  );
}
