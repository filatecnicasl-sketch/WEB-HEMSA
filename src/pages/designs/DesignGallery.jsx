import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Check, MoveRight } from 'lucide-react';
import DesignSwitcher from '../../components/designs/DesignSwitcher';

const proposals = [
  { number: '01', name: 'Horizonte', type: 'Editorial · Arquitectónica', description: 'Una portada solemne y contemporánea, con gran tipografía, fotografía protagonista y una navegación serena.', features: ['Imagen institucional premium', 'Jerarquía editorial', 'Accesos directos y limpios'], to: '/propuesta-1', className: 'one' },
  { number: '02', name: 'Pulso ciudadano', type: 'Digital · Servicios', description: 'Una experiencia tecnológica y eficiente que convierte los trámites y la atención en el centro de la portada.', features: ['Panel de acceso ciudadano', 'Datos y servicios visibles', 'Agente de IA protagonista'], to: '/propuesta-2', className: 'two' },
  { number: '03', name: 'Cercanía', type: 'Humana · Accesible', description: 'Un lenguaje amable y formas orgánicas para acercar los servicios municipales y destacar la atención a las personas.', features: ['Recorridos por necesidades', 'Ayuda a Domicilio destacada', 'Tono cálido y cercano'], to: '/propuesta-3', className: 'three' },
  { number: '04', name: 'San Fernando Vivo', type: 'Modular · Contemporánea', description: 'Un sistema gráfico enérgico y flexible, con bloques expresivos, grandes cifras y una fuerte personalidad urbana.', features: ['Composición modular', 'Comunicación directa', 'Identidad urbana memorable'], to: '/propuesta-4', className: 'four' },
];

function Miniature({ variant }) {
  if (variant === 'one') return <div className="mini mini-one"><div className="mini-nav" /><div className="mini-one-grid"><div><i /><b>Construimos<br />ciudad.</b><span /></div><img src="/images/ronda-estero.webp" alt="" /></div><div className="mini-lines"><i /><i /><i /></div></div>;
  if (variant === 'two') return <div className="mini mini-two"><div className="mini-nav" /><div className="mini-two-grid"><div><i /><b>Tu ciudad.<br /><span>Sin esperas.</span></b><em /><em /></div><section><strong>¿Qué necesitas?</strong><i /><i /><i /><i /></section></div><div className="mini-two-stats"><i /><i /><i /></div></div>;
  if (variant === 'three') return <div className="mini mini-three"><div className="mini-nav" /><div className="mini-three-grid"><div><i /><b>Estamos aquí<br />para <span>ayudarte.</span></b><em /></div><img src="/images/ronda-estero.webp" alt="" /></div><div className="mini-three-cards"><i /><i /><i /><i /></div></div>;
  return <div className="mini mini-four"><div className="mini-nav" /><div className="mini-four-grid"><b>SAN FERNANDO<br /><span>AVANZA</span> CONTIGO.</b><img src="/images/ronda-estero.webp" alt="" /><i>1996</i><em>PEDIR CITA →</em></div><div className="mini-four-band">VIVIENDA · BIENESTAR · DESARROLLO</div></div>;
}

export default function DesignGallery() {
  useEffect(() => { document.title = 'Cuatro propuestas de portada | HEMSA San Fernando'; }, []);

  return (
    <div className="design-page design-gallery-page">
      <header className="gallery-header"><div className="design-wrap"><Link to="/" className="design-brand"><img src="/images/hemsa-footer.jpg" alt="HEMSA San Fernando" /></Link><Link to="/" className="gallery-back"><ArrowLeft size={17} />Volver a la web actual</Link></div></header>
      <main className="design-wrap gallery-main">
        <div className="gallery-intro"><span>HEMSA / NUEVA ETAPA DIGITAL</span><h1>Una identidad.<br /><em>Cuatro formas de avanzar.</em></h1><p>Cuatro conceptos de portada para una web municipal más clara, útil y memorable. Todas mantienen el logotipo, el verde corporativo y el vínculo con el Ayuntamiento de San Fernando.</p><div className="gallery-brand-check"><span><Check size={16} />Branding HEMSA intacto</span><span><Check size={16} />Contenido real</span><span><Check size={16} />Enlaces funcionales</span></div></div>
        <div className="gallery-grid">
          {proposals.map((proposal) => <article className="gallery-card" key={proposal.to}><Link to={proposal.to} className="gallery-preview" aria-label={`Abrir propuesta ${proposal.number}: ${proposal.name}`}><Miniature variant={proposal.className} /><span className="gallery-open">Ver propuesta<ArrowUpRight size={19} /></span></Link><div className="gallery-card-content"><div className="gallery-card-heading"><span>{proposal.number}</span><div><h2>{proposal.name}</h2><small>{proposal.type}</small></div></div><p>{proposal.description}</p><ul>{proposal.features.map((feature) => <li key={feature}>{feature}</li>)}</ul><Link to={proposal.to} className="gallery-card-link">Explorar esta dirección<MoveRight size={19} /></Link></div></article>)}
        </div>
        <div className="gallery-note"><span>Compara sin prisa</span><p>Usa el selector inferior para saltar de una propuesta a otra. La portada actual no se ha sustituido.</p></div>
      </main>
      <DesignSwitcher />
    </div>
  );
}
