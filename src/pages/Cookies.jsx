import { Link } from 'react-router-dom';
import { PageHero } from '../components/UI';

const sections = [
  { id: 'que-son', title: '1. Qué son las cookies' },
  { id: 'tipos', title: '2. Tipos de cookies' },
  { id: 'uso', title: '3. Qué utiliza esta web' },
  { id: 'terceros', title: '4. Contenido de terceros' },
  { id: 'gestion', title: '5. Cómo gestionarlas' },
  { id: 'consentimiento', title: '6. Consentimiento y actualizaciones' },
];

const storageItems = [
  {
    name: 'hemsa-cookie-choice',
    type: 'Almacenamiento local propio',
    purpose: 'Recordar que el aviso de cookies ha sido aceptado o cerrado.',
    duration: 'Hasta que elimine los datos del sitio en su navegador.',
  },
  {
    name: 'hemsa-large-text',
    type: 'Almacenamiento local propio',
    purpose: 'Recordar su preferencia de tamaño de texto.',
    duration: 'Hasta que elimine los datos del sitio en su navegador.',
  },
  {
    name: 'hemsa-admin-session',
    type: 'Almacenamiento de sesión propio',
    purpose: 'Mantener la sesión del acceso personal al gestor de contenidos.',
    duration: 'Solo mientras permanezca abierta esta pestaña; la sesión del servidor caduca en un máximo de 12 horas.',
  },
];

export default function Cookies() {
  return (
    <div className="legal-page cookies-page">
      <PageHero
        eyebrow="Privacidad y preferencias"
        title="Política de cookies"
        text="Qué información se guarda en su navegador, para qué se utiliza y cómo puede gestionarla."
      />

      <section className="legal-main">
        <div className="container legal-container">
          <nav className="legal-index" aria-label="Contenido de la política de cookies">
            <span>En esta página</span>
            <div>
              {sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}
            </div>
          </nav>

          <article className="legal-document">
            <section id="que-son" className="legal-section">
              <h2>1. ¿Qué son las cookies y las tecnologías similares?</h2>
              <p>Una cookie es un pequeño archivo de texto que se almacena en su dispositivo cuando visita un sitio web. Permite recordar acciones y preferencias, como el idioma o el tamaño de letra, durante un período de tiempo para que no tenga que configurarlas de nuevo al volver al sitio o navegar entre páginas.</p>
              <p>El <strong>almacenamiento local del navegador</strong> cumple una función similar: permite guardar información en el dispositivo para recordar preferencias. Esta web utiliza esa tecnología para las finalidades que se detallan a continuación.</p>
            </section>

            <section id="tipos" className="legal-section">
              <h2>2. Tipos de cookies</h2>
              <h3>Según la entidad que las gestiona</h3>
              <ul>
                <li><strong>Propias:</strong> se envían al dispositivo desde un equipo o dominio gestionado por el propio editor del sitio.</li>
                <li><strong>De terceros:</strong> se envían desde un equipo o dominio gestionado por otra entidad, que trata los datos obtenidos.</li>
              </ul>
              <h3>Según su finalidad</h3>
              <ul>
                <li><strong>Técnicas:</strong> permiten navegar por la página y utilizar sus diferentes opciones o servicios.</li>
                <li><strong>De personalización:</strong> permiten recordar características de acceso o visualización elegidas por el usuario.</li>
                <li><strong>De análisis:</strong> permiten el seguimiento y análisis del comportamiento de los usuarios.</li>
                <li><strong>Publicitarias y de publicidad comportamental:</strong> gestionan espacios publicitarios o elaboran perfiles para mostrar publicidad.</li>
              </ul>
              <h3>Según el tiempo que permanecen activas</h3>
              <ul>
                <li><strong>De sesión:</strong> recaban y almacenan datos mientras el usuario accede a una página web.</li>
                <li><strong>Persistentes:</strong> mantienen los datos almacenados durante un período definido por su responsable.</li>
              </ul>
            </section>

            <section id="uso" className="legal-section">
              <h2>3. ¿Qué utiliza este sitio web?</h2>
              <p>Esta web <strong>no instala actualmente cookies propias de análisis ni de publicidad</strong>. Utiliza almacenamiento local para recordar sus preferencias y almacenamiento de sesión para mantener el acceso personal al gestor de contenidos.</p>
              <div className="storage-table" role="table" aria-label="Tecnologías de almacenamiento utilizadas">
                <div className="storage-row storage-header" role="row">
                  <span role="columnheader">Identificador</span>
                  <span role="columnheader">Tipo</span>
                  <span role="columnheader">Finalidad</span>
                  <span role="columnheader">Duración</span>
                </div>
                {storageItems.map((item) => (
                  <div className="storage-row" role="row" key={item.name}>
                    <span role="cell" data-label="Identificador"><code>{item.name}</code></span>
                    <span role="cell" data-label="Tipo">{item.type}</span>
                    <span role="cell" data-label="Finalidad">{item.purpose}</span>
                    <span role="cell" data-label="Duración">{item.duration}</span>
                  </div>
                ))}
              </div>
              <p>La información guardada en el almacenamiento local permanece en su navegador y no constituye por sí misma una cuenta de usuario ni una sincronización con otros dispositivos.</p>
            </section>

            <section id="terceros" className="legal-section">
              <h2>4. Contenido de terceros: Google Maps</h2>
              <p>La página de contacto incorpora un mapa de <strong>Google Maps</strong> para mostrar la ubicación de las oficinas de HEMSA. Al acceder a ese contenido, Google puede utilizar cookies o tecnologías similares conforme a sus propias condiciones y políticas.</p>
              <p>Puede consultar más información en la <a href="https://policies.google.com/technologies/cookies?hl=es" target="_blank" rel="noreferrer">política de cookies de Google</a>. Los enlaces a Google Maps para buscar la dirección o calcular una ruta también están sujetos a las condiciones de ese proveedor.</p>
            </section>

            <section id="gestion" className="legal-section">
              <h2>5. ¿Cómo puede configurar o eliminar las cookies y los datos almacenados?</h2>
              <p>Puede permitir, bloquear o eliminar las cookies y borrar los datos almacenados por este sitio mediante la configuración de su navegador. Las opciones habituales se encuentran en los apartados de privacidad, seguridad o datos de navegación:</p>
              <ul>
                <li><strong>Google Chrome:</strong> Configuración → Privacidad y seguridad → Eliminar datos de navegación o Configuración de sitios.</li>
                <li><strong>Mozilla Firefox:</strong> Ajustes → Privacidad y seguridad → Cookies y datos del sitio.</li>
                <li><strong>Microsoft Edge:</strong> Configuración → Cookies y permisos del sitio o Privacidad, búsqueda y servicios.</li>
                <li><strong>Safari:</strong> Ajustes o Preferencias → Privacidad → Gestionar datos de sitios web.</li>
              </ul>
              <p>Si bloquea o elimina el almacenamiento local, algunas preferencias, como el tamaño de texto o la aceptación del aviso, dejarán de recordarse.</p>
            </section>

            <section id="consentimiento" className="legal-section">
              <h2>6. Consentimiento y actualización de esta política</h2>
              <p>Al pulsar «Aceptar» o cerrar el aviso inicial, se guarda su elección en este navegador para evitar que el aviso vuelva a aparecer en cada visita. Puede retirar esa preferencia eliminando los datos del sitio desde la configuración del navegador.</p>
              <p>HEMSA puede actualizar esta política para adaptarla a cambios técnicos o normativos. Le recomendamos revisarla periódicamente para estar informado sobre cómo y para qué se utilizan las cookies y tecnologías similares.</p>
            </section>
          </article>

          <div className="legal-related">
            <p>Si tiene alguna duda, puede <Link to="/contacto">contactar con HEMSA</Link> o consultar el <Link to="/aviso-legal">aviso legal</Link>.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
