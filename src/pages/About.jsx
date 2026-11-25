import {
  Award, Building2, Hammer, Home, Landmark, MapPinned, ParkingSquare, UsersRound,
} from 'lucide-react';
import HistoryCarousel from '../components/HistoryCarousel';

const saleDevelopments = [
  '1ª fase de La Magdalena · 96 viviendas',
  '2ª fase de La Magdalena · 76 viviendas',
  '3ª fase de La Magdalena · 76 viviendas',
  '4ª fase de La Magdalena · 76 viviendas',
  '5ª fase de La Magdalena · 33 viviendas',
  '56 VPP cofinanciadas en Coronación',
  '74 VPO RE en La Magdalena · Edificio Zaporito',
  '44 VPO RE en La Milagrosa · Edificio La Arboledilla',
  '26 VPO RE en Buen Pastor · Edificio Casablanca',
  '25 VPORG en San Onofre',
  '30 VPORG en la parcela Q del sector III de Camposoto',
  '13 VPORG en la parcela 2 de la UE-54-B',
  '55 VP RE en la Ronda del Estero · Edificio Salinas del Sur',
  '61 VP RG en la Ronda del Estero · Edificio La Ronda',
];

const rentalDevelopments = [
  '85 VPP en La Magdalena',
  '60 RAPPA en La Magdalena',
  '28 RAPPA en San Juan de la Cruz',
  '26 VPP en Coronación',
  '42 RAPPA en Coronación',
  '31 viviendas para la integración social en Coronación',
  '15 viviendas VPRE en San Onofre 16B · Antigua Alsedo 51',
];

const transformationPrograms = [
  {
    title: 'Primer programa', total: '24 viviendas',
    items: ['Alsedo nº 51 · 6 viviendas', 'Carmen nº 50 · 3 viviendas', 'Santa Gertrudis nº 2 · 4 viviendas', 'Hernán Cortés nº 5 y nº 7 · 1 y 6 viviendas, respectivamente', 'Marconi nº 10 · 4 viviendas'],
  },
  {
    title: 'Segundo programa', total: '52 viviendas',
    items: ['Florencio Montojo nº 33 · 8 viviendas', 'Cellier nº 17 · 10 viviendas', 'Lope de Vega nº 12 · 12 viviendas', 'Velarde nº 6 · 4 viviendas', 'Velarde nº 8 · 5 viviendas', 'Marconi nº 12 · 13 viviendas'],
  },
  {
    title: 'Tercer programa', total: '30 viviendas',
    items: ['Real nº 158 · 10 viviendas', 'San José nº 9 · 6 viviendas', 'San Ignacio nº 4 · 10 viviendas', 'San Pedro Apóstol nº 24 · 4 viviendas'],
  },
  {
    title: 'Cuarto programa', total: '25 viviendas',
    items: ['Bazán nº 3 · 6 viviendas', 'Carmen nº 9 · 7 viviendas', 'Lezo nº 13 · 5 viviendas', 'Magallanes nº 92 · 7 viviendas'],
  },
];

const autonomousRehabilitation = [
  'Reparación de fachadas de 512 viviendas · 4ª fase, Barriada Madariaga',
  '1ª fase Barriada Puerto de Palos · 62 viviendas afectadas de los bloques nº 5, 6, 7, 8 y 9',
  '2ª fase Barriada Puerto de Palos · 61 viviendas afectadas de los bloques nº 1, 2, 3 y 4',
  '223 actuaciones en distintas zonas de San Fernando, tanto en zonas comunes de bloques como en interiores de viviendas',
];

const infrastructures = [
  'Mercado de Abastos · Mercado y primera planta destinada a oficinas y locales comerciales',
  'Aparcamiento subterráneo en el edificio del Mercado Central de Abastos · 260 plazas',
  'Obras de soterramiento de la estación de bombeo',
  'Realojo de distintas dependencias municipales · Alcaldía, Servicios de Informática, Economía y Hacienda',
];

const parkings = ['Plaza Emperador Carlos', 'Barriada Coronación'];

const urbanizations = [
  '1ª fase Ronda del Estero',
  '2ª fase Ronda del Estero',
  'Calle Almirante Cervera – Ronda del Estero',
  'Prolongación calle Santiago – Ronda del Estero',
  'Prolongación calle Alsedo con Ronda del Estero',
  'Prolongación calle San Nicolás',
  'UE-44 · Prolongación calle Alsedo',
  'UE-36 · Cine San Fernando',
  'Polígono industrial Puente de Hierro',
  'Polígono industrial Fábricas II',
];

const rehousing = [
  'Albardonero – Prolongación Almirante Cervera · 6 familias',
  'Entorno «Castillo de San Romualdo» · 14 familias',
  'Parque Empresarial «Puente de Hierro» · 6 familias',
  'Estación Depuradora de Aguas Residuales · EDAR, avenida Constitución · 3 familias',
  'Viviendas prefabricadas · Entorno Buen Pastor · 42 familias',
  'Ramiro de Maeztu · Obtención de zona verde · 3 familias',
  'Manuel de la Puente · Entorno Zaporito · 5 familias',
  'UE-53 A · Conexiones Ronda del Estero · 8 familias',
  'UE-54 · Conexiones Ronda del Estero · 3 familias',
  'UE-44 · Apertura semáforo San Onofre · 9 familias',
  'UE-36 · Cine San Fernando · 3 familias',
  'Juan de Austria esquina Carraca · Ampliación de calzada · 1 familia',
  'Estación de bombeo Coronación · 1 familia',
];

function ActionList({ items, className = '' }) {
  return <ul className={`r-action-list ${className}`}>{items.map((item) => <li key={item}><span>{item}</span></li>)}</ul>;
}

function SectionHeading({ eyebrow, title, text }) {
  return <div className="r-about-heading"><span className="r-eyebrow">{eyebrow}</span><h2>{title}</h2>{text && <p>{text}</p>}</div>;
}

export default function About() {
  return (
    <div className="r-about">
      <h1 className="sr-only">Sobre nosotros</h1>
      <section className="r-history" id="historia" aria-labelledby="history-title">
        <div className="container r-history-grid">
          <HistoryCarousel />
          <div className="r-history-copy"><span className="r-eyebrow">Nuestra historia</span><h2 id="history-title">HEMSA, un nuevo nombre para una nueva etapa</h2><p><strong>HUB EMPRESA MUNICIPAL DE SAN FERNANDO MP S.A. (HEMSA)</strong> es la nueva denominación de la histórica empresa pública del Ayuntamiento de San Fernando, Empresa de Suelo Isleña S.A. (ESISA).</p><p>Comienza así una nueva etapa para convertirse en una empresa de gestión de Servicios Públicos. Como Medio Propio y Servicio Técnico del Ayuntamiento de San Fernando, podemos recibir encargos de servicios que se encuentren en nuestro objeto social, ampliado con el Servicio Municipal de Ayuda a Domicilio.</p>
            <ol className="r-timeline">
              <li><span>1996</span><div><h3>Nace ESISA</h3><p>El Ayuntamiento constituye la Empresa de Suelo Isleña para la construcción de viviendas y la gestión de suelo.</p></div></li>
              <li><span>2024</span><div><h3>Nace HEMSA</h3><p>La Junta General aprueba el 22 de marzo la declaración como Medio Propio y el cambio de denominación a HEMSA.</p></div></li>
              <li><span>Hoy</span><div><h3>Servicios públicos</h3><p>Vivienda, garajes y trasteros, compra de viviendas y Servicio Municipal de Ayuda a Domicilio.</p></div></li>
            </ol>
          </div>
        </div>
      </section>

      <section className="r-about-overview" aria-label="Trayectoria de HEMSA en cifras">
        <div className="container">
          <p className="r-about-intro">Durante estos años, ESISA ha impulsado, promovido y gestionado multitud de actuaciones encaminadas a dar fin a su objeto social, centrado hasta ahora en urbanismo, suelo y vivienda.</p>
          <div className="r-about-metrics">
            <div><strong>741</strong><span>viviendas<br />en venta</span></div>
            <div><strong>323</strong><span>viviendas<br />en alquiler</span></div>
            <div><strong>131</strong><span>viviendas de transformación<br />de la infravivienda</span></div>
            <div><strong>21</strong><span>viviendas en<br />actuaciones singulares</span></div>
          </div>
          <nav className="r-about-nav" aria-label="Contenido de nuestra trayectoria">
            <a href="#vivienda">Vivienda</a><a href="#infravivienda">Infravivienda</a><a href="#rehabilitacion">Rehabilitación</a><a href="#infraestructuras">Infraestructuras</a><a href="#realojos">Realojos</a>
          </nav>
        </div>
      </section>

      <section className="r-about-section" id="vivienda" aria-labelledby="housing-history-title">
        <div className="container">
          <div id="housing-history-title"><SectionHeading eyebrow="Promociones de vivienda" title="Viviendas para San Fernando" text="El detalle de las promociones impulsadas por ESISA para venta y alquiler." /></div>
          <div className="r-about-card-grid">
            <article className="r-about-card r-sale-card"><div className="r-about-card-heading"><Home size={23} /><h3>Promociones en venta</h3><span>741 viviendas</span></div><ActionList items={saleDevelopments} /></article>
            <article className="r-about-card r-rental-card"><div className="r-about-card-heading"><Building2 size={23} /><h3>Promociones en alquiler</h3><span>323 viviendas</span></div><ActionList items={rentalDevelopments} /></article>
          </div>
        </div>
      </section>

      <section className="r-about-section r-about-muted" id="infravivienda" aria-labelledby="transformation-title">
        <div className="container">
          <div id="transformation-title"><SectionHeading eyebrow="Transformación de la infravivienda" title="Cuatro programas, 131 viviendas" text="Actuaciones de transformación desarrolladas en distintos puntos del municipio." /></div>
          <div className="r-program-grid">
            {transformationPrograms.map((program) => <article className="r-about-card r-program-card" key={program.title}><div className="r-about-card-heading"><Hammer size={21} /><h3>{program.title}</h3><span>{program.total}</span></div><ActionList items={program.items} /></article>)}
          </div>
          <article className="r-about-card r-singular-card"><div className="r-about-card-heading"><Home size={22} /><h3>Actuaciones singulares</h3><span>21 viviendas</span></div><ActionList items={['Real nº 185 · Casa Micolta · 17 viviendas', 'Amargura nº 43 · 4 viviendas']} /></article>
        </div>
      </section>

      <section className="r-about-section" id="rehabilitacion" aria-labelledby="rehabilitation-title">
        <div className="container">
          <div id="rehabilitation-title"><SectionHeading eyebrow="Rehabilitación" title="Conservar y mejorar el parque de viviendas" text="Actuaciones autonómicas —antes denominadas preferentes— y expedientes de rehabilitación estatal." /></div>
          <div className="r-rehab-layout">
            <article className="r-about-card"><div className="r-about-card-heading"><Hammer size={22} /><h3>Rehabilitación autonómica</h3></div><ActionList items={autonomousRehabilitation} /></article>
            <div className="r-rehab-numbers">
              <article><strong>99</strong><span>expedientes tramitados</span><h3>Rehabilitación estatal</h3></article>
              <article><strong>12</strong><span>expedientes tramitados</span><h3>Rehabilitación de edificios</h3></article>
              <article><strong>18</strong><span>expedientes tramitados</span><h3>Adecuación funcional</h3></article>
            </div>
          </div>
        </div>
      </section>

      <section className="r-about-section r-about-muted" id="infraestructuras" aria-labelledby="infrastructure-title">
        <div className="container">
          <div id="infrastructure-title"><SectionHeading eyebrow="Infraestructuras y urbanización" title="Actuaciones que transforman la ciudad" text="Equipamientos, aparcamientos y actuaciones urbanísticas desarrollados a lo largo de nuestra trayectoria." /></div>
          <div className="r-city-grid">
            <article className="r-about-card"><div className="r-about-card-heading"><Landmark size={22} /><h3>Infraestructuras</h3></div><ActionList items={infrastructures} /></article>
            <article className="r-about-card"><div className="r-about-card-heading"><ParkingSquare size={22} /><h3>Aparcamientos</h3></div><ActionList items={parkings} /></article>
            <article className="r-about-card r-urban-card"><div className="r-about-card-heading"><MapPinned size={22} /><h3>Urbanización</h3></div><ActionList items={urbanizations} className="r-about-two-columns" /></article>
          </div>
        </div>
      </section>

      <section className="r-about-section" id="realojos" aria-labelledby="rehousing-title">
        <div className="container">
          <div id="rehousing-title"><SectionHeading eyebrow="Realojos por expropiaciones urbanísticas" title="Acompañamiento a las familias" text="Actuaciones de realojo vinculadas al desarrollo urbanístico de San Fernando." /></div>
          <article className="r-about-card r-rehousing-card"><div className="r-about-card-heading"><UsersRound size={22} /><h3>Familias realojadas por actuación</h3></div><ActionList items={rehousing} className="r-about-two-columns" /></article>
        </div>
      </section>

      <section className="r-about-award" aria-label="Premio nacional de vivienda de 2005">
        <div className="container r-about-award-inner">
          <span className="r-award-icon"><Award size={37} /></span>
          <div><span className="r-award-year">2005 · Reconocimiento nacional</span><h2>Premio a la mejor política municipal de vivienda</h2><p>ESISA ganó el premio nacional convocado por el Grupo Planner en el apartado de transformación de la infravivienda.</p></div>
        </div>
      </section>
    </div>
  );
}
