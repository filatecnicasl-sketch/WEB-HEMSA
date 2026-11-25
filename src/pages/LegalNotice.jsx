import { Link } from 'react-router-dom';
import { PageHero } from '../components/UI';

const sections = [
  { id: 'informacion-general', title: '1. Información general' },
  { id: 'propiedad-intelectual', title: '2. Propiedad intelectual' },
  { id: 'proteccion-datos', title: '3. Protección de datos personales' },
  { id: 'responsabilidad-usuario', title: '4. Responsabilidad del usuario' },
  { id: 'enlaces-terceros', title: '5. Enlaces a terceros' },
  { id: 'limitacion-responsabilidad', title: '6. Limitación de responsabilidad' },
  { id: 'modificaciones', title: '7. Modificaciones del aviso legal' },
  { id: 'legislacion', title: '8. Ley aplicable y jurisdicción' },
];

export default function LegalNotice() {
  return (
    <div className="legal-page">
      <PageHero
        eyebrow="Información legal"
        title="Aviso legal"
        text="Información sobre la titularidad, las condiciones de uso y el marco legal de este sitio web."
      />

      <section className="legal-main">
        <div className="container legal-container">
          <nav className="legal-index" aria-label="Contenido del aviso legal">
            <span>En esta página</span>
            <div>
              {sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}
            </div>
          </nav>

          <article className="legal-document">
            <section id="informacion-general" className="legal-section">
              <h2>1. Información general</h2>
              <p>Este sitio web es operado por <strong>HUB EMPRESA MUNICIPAL DE SAN FERNANDO MP S.A.</strong> (en adelante, «HEMSA»), con domicilio en Avenida San Juan Bosco 44, 11100 San Fernando (Cádiz), y CIF A11376548.</p>
              <dl className="legal-identity">
                <div><dt>Titular</dt><dd>HUB EMPRESA MUNICIPAL DE SAN FERNANDO MP S.A.</dd></div>
                <div><dt>CIF</dt><dd>A11376548</dd></div>
                <div><dt>Domicilio</dt><dd>Avenida San Juan Bosco 44, 11100 San Fernando (Cádiz)</dd></div>
                <div><dt>Teléfono</dt><dd><a href="tel:956945000">956 945 000</a></dd></div>
                <div><dt>Correo electrónico</dt><dd><a href="mailto:correo@hemsasanfernando.es">correo@hemsasanfernando.es</a></dd></div>
              </dl>
            </section>

            <section id="propiedad-intelectual" className="legal-section">
              <h2>2. Propiedad intelectual</h2>
              <p>Todo el contenido presente en este sitio web, incluyendo textos, imágenes, gráficos, logotipos, iconos, software y cualquier otro material, es propiedad de HEMSA o de terceros que han autorizado su uso. Está prohibida la reproducción, distribución, transformación o cualquier otro uso no autorizado de los mismos, salvo consentimiento previo y por escrito de HEMSA.</p>
            </section>

            <section id="proteccion-datos" className="legal-section">
              <h2>3. Protección de datos personales</h2>
              <p>De conformidad con lo establecido en el Reglamento (UE) 2016/679 y la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD), le informamos de que los datos personales facilitados a través de este sitio web serán tratados por HEMSA con la finalidad establecida en el contrato.</p>
              <p>Puede ejercer sus derechos de acceso, rectificación, cancelación y oposición enviando una solicitud por escrito a Avenida San Juan Bosco 44, 11100 San Fernando (Cádiz), o a través del correo electrónico <a href="mailto:correo@hemsasanfernando.es">correo@hemsasanfernando.es</a>.</p>
              <p>Consulte la información detallada en nuestra <a href="/documents/otros/politica-privacidad-pagina-web-rgpd-hemsa.pdf" target="_blank" rel="noreferrer">política de privacidad</a>.</p>
            </section>

            <section id="responsabilidad-usuario" className="legal-section">
              <h2>4. Responsabilidad del usuario</h2>
              <p>El usuario se compromete a hacer un uso adecuado y lícito del sitio web y de sus contenidos, conforme a la legislación vigente, el presente aviso legal y las buenas costumbres. Queda prohibido el uso del sitio web con fines ilícitos o perjudiciales, o que puedan causar daño o impedir el normal funcionamiento del sitio web.</p>
            </section>

            <section id="enlaces-terceros" className="legal-section">
              <h2>5. Enlaces a terceros</h2>
              <p>Este sitio web puede contener enlaces a sitios web de terceros. HEMSA no se hace responsable del contenido, las políticas de privacidad o las prácticas de dichos sitios. La inclusión de estos enlaces no implica la aprobación o el respaldo de los mismos por parte de HEMSA.</p>
            </section>

            <section id="limitacion-responsabilidad" className="legal-section">
              <h2>6. Limitación de responsabilidad</h2>
              <p>HEMSA no garantiza la disponibilidad, continuidad ni la infalibilidad del funcionamiento del sitio web y, en consecuencia, excluye, en la medida permitida por la legislación vigente, cualquier responsabilidad por los daños y perjuicios de cualquier naturaleza que puedan deberse a la falta de disponibilidad o de continuidad del funcionamiento del sitio web y de los servicios habilitados en el mismo.</p>
            </section>

            <section id="modificaciones" className="legal-section">
              <h2>7. Modificaciones del aviso legal</h2>
              <p>HEMSA se reserva el derecho a modificar el presente aviso legal para adaptarlo a novedades legislativas o jurisprudenciales, así como a prácticas de la industria. En dichos supuestos, HEMSA anunciará en esta página los cambios introducidos con razonable antelación a su puesta en práctica.</p>
            </section>

            <section id="legislacion" className="legal-section">
              <h2>8. Ley aplicable y jurisdicción</h2>
              <p>Para la resolución de todas las controversias o cuestiones relacionadas con este sitio web o de las actividades en él desarrolladas, será de aplicación la legislación española, a la que se someten expresamente las partes, siendo competentes para la resolución de todos los conflictos derivados o relacionados con su uso los Juzgados y Tribunales de San Fernando (Cádiz).</p>
            </section>
          </article>

          <div className="legal-related">
            <p>Consulte también cómo gestionamos las preferencias de navegación en nuestra <Link to="/cookies">política de cookies</Link>.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
