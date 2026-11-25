import {
  ArrowUpRight, BadgeCheck, Building2, CalendarClock, CalendarDays, Check,
  ChevronDown, ClipboardCheck, Download, FileCheck2, FileText, HeartHandshake,
  Home, Info, Landmark, Mail, MapPin, Phone, RefreshCw, ShieldCheck,
  UserRoundCheck, UsersRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ExternalAnchor, PageHero, SectionHeading } from '../components/UI';
import { useSite } from '../context/SiteContext';

const registryUrl = 'https://hemsa-frontend.onrender.com/';
const applicationUrl = '/documents/vivienda/solicitud-de-inscripcion-registro-de-demandantes-2024-hemsa.pdf';
const ordinanceUrl = '/documents/vivienda/ordenanza-modificada-segun-sugerencias-consejeria.pdf';

const requirements = [
  {
    icon: UserRoundCheck,
    title: 'Personas solicitantes',
    text: 'Personas físicas mayores de edad, con capacidad jurídica y de obrar, que residan o tengan interés en residir en San Fernando.',
  },
  {
    icon: UsersRound,
    title: 'Una solicitud por unidad familiar',
    text: 'Las unidades familiares o de convivencia presentan una única solicitud, firmada por todas las personas mayores de edad.',
  },
  {
    icon: BadgeCheck,
    title: 'Ingresos y situación familiar',
    text: 'Los ingresos deben ajustarse a los límites del programa de vivienda correspondiente y la composición familiar debe quedar correctamente reflejada.',
  },
  {
    icon: Home,
    title: 'Titularidad de otra vivienda',
    text: 'Con carácter general, ningún miembro puede ser titular o disponer del uso vitalicio de otra vivienda. La ordenanza recoge excepciones justificadas.',
  },
];

const preparation = [
  'DNI, NIE o documento identificativo de todas las personas incluidas en la solicitud.',
  'Datos de contacto, domicilio y composición de la unidad familiar o de convivencia.',
  'Información sobre ingresos anuales y declaración del IRPF de cada miembro.',
  'Declaración responsable sobre la titularidad o el uso de otra vivienda.',
  'Régimen al que se opta: compra, alquiler o alquiler con opción a compra; dormitorios y necesidad de vivienda adaptada.',
  'Documentos que acrediten la situación de especial protección o la necesidad de vivienda, cuando corresponda.',
];

const steps = [
  {
    title: 'Revisa los requisitos',
    text: 'Comprueba tu situación personal, familiar y económica, y prepara los justificantes necesarios antes de comenzar.',
  },
  {
    title: 'Cumplimenta la solicitud',
    text: 'Puedes utilizar la plataforma online o descargar el modelo oficial. En una unidad familiar deben firmar todas las personas mayores de edad.',
  },
  {
    title: 'Presenta la documentación',
    text: 'Entrega la solicitud y los justificantes a través del canal habilitado. Si falta información, el Registro requerirá su subsanación.',
  },
  {
    title: 'Mantén tu inscripción activa',
    text: 'Comunica cualquier cambio, comprueba tus datos y renueva la inscripción antes de que finalice su periodo de vigencia.',
  },
];

const protectionGroups = [
  'Menores de 35 años',
  'Personas mayores de 65 años',
  'Familias monoparentales',
  'Víctimas de violencia de género',
  'Víctimas del terrorismo',
  'Ruptura de la unidad familiar',
  'Emigrantes retornados',
  'Personas en situación de dependencia',
  'Personas con discapacidad',
  'Situación o riesgo de exclusión social',
  'Unidades familiares con menores a su cargo',
  'Ingresos por debajo del umbral de pobreza',
];

const documents = [
  {
    title: 'Solicitud de inscripción',
    description: 'Modelo oficial de dos páginas, con declaración responsable, autorizaciones e información sobre protección de datos.',
    meta: 'PDF · 2 páginas · Versión 1/2024',
    url: applicationUrl,
  },
  {
    title: 'Ordenanza reguladora',
    description: 'Normas de inscripción, renovación, selección y adjudicación del Registro Municipal de San Fernando.',
    meta: 'PDF · 33 páginas · Documento oficial',
    url: ordinanceUrl,
  },
  {
    title: 'Instancia general HEMSA',
    description: 'Modelo general para exponer y solicitar otras gestiones relacionadas con tu expediente.',
    meta: 'PDF · 1 página',
    url: '/documents/vivienda/instancia-hemsa.pdf',
  },
  {
    title: 'Instancia ESISA',
    description: 'Modelo histórico de la Empresa de Suelo Isleña. Consulta previamente si es el formulario adecuado para tu trámite.',
    meta: 'PDF · 1 página',
    url: '/documents/vivienda/instancia-esisa-1-1.pdf',
  },
];

const faqs = [
  {
    question: '¿Es imprescindible estar inscrito para optar a una vivienda protegida?',
    answer: 'Sí. Con carácter general, la selección se realiza entre las personas inscritas que cumplan los requisitos del programa y, en su caso, los cupos establecidos. La inscripción no garantiza por sí misma la adjudicación de una vivienda.',
  },
  {
    question: '¿Cuánto tiempo dura la inscripción?',
    answer: 'La inscripción tiene una vigencia de tres años desde que se practica o desde la última actualización o modificación de datos. La renovación puede solicitarse durante los tres meses anteriores a su finalización.',
  },
  {
    question: '¿Qué cambios debo comunicar?',
    answer: 'Debes comunicar los cambios en los datos de la solicitud con documentación justificativa, normalmente en un plazo de tres meses. No es necesario comunicar variaciones de ingresos inferiores al 10 %. Los datos económicos se actualizan entre el 1 de julio y el 30 de septiembre del año siguiente al ejercicio concluido.',
  },
  {
    question: '¿Cómo se ordenan las solicitudes?',
    answer: 'La prelación general se establece por la mayor antigüedad en el Registro, aplicando los criterios de preferencia y los cupos de cada promoción. Determinados programas de vivienda pública en alquiler utilizan además criterios de baremación. Debes consultar siempre las bases de la convocatoria concreta.',
  },
  {
    question: '¿Qué requisitos se comprueban para las promociones en venta?',
    answer: 'Además de estar inscrito y tener los datos actualizados, se comprueban las condiciones del programa: ingresos, residencia o vinculación con San Fernando, situación patrimonial y demás requisitos de la convocatoria. En las promociones publicadas por HEMSA se indica un límite de 5,5 veces el IPREM y la necesidad de superar el estudio de viabilidad bancaria para la hipoteca.',
  },
  {
    question: '¿Puedo tener vivienda en propiedad y inscribirme?',
    answer: 'La ordenanza contempla excepciones, entre otras, cuando se necesita una vivienda adaptada por aumento de la composición familiar, discapacidad, movilidad reducida o dependencia sobrevenida; también en determinados casos de violencia de género, terrorismo o desplazamiento laboral. Estas situaciones deben acreditarse y pueden implicar la transmisión de la vivienda anterior dentro del plazo previsto.',
  },
];

export default function HousingRegistry() {
  const { content } = useSite();

  return (
    <div className="registry-page">
      <PageHero
        eyebrow="Vivienda protegida en San Fernando"
        title="Registro de Demandantes de Vivienda Protegida"
        text="Toda la información para inscribirte, actualizar tus datos y mantener activa tu solicitud. Un trámite claro, con atención municipal cercana cuando lo necesites."
      >
        <div className="registry-hero-actions">
          <ExternalAnchor href={registryUrl} className="button">
            Acceder al Registro<ArrowUpRight size={18} />
          </ExternalAnchor>
          <ExternalAnchor href={applicationUrl} className="button button-secondary" download>
            <Download size={18} />Descargar solicitud
          </ExternalAnchor>
        </div>
        <div className="registry-hero-meta" aria-label="Características del servicio">
          <span><ShieldCheck size={17} />Acceso ciudadano seguro</span>
          <span><Landmark size={17} />Servicio público municipal</span>
          <span><HeartHandshake size={17} />Atención presencial y telefónica</span>
        </div>
      </PageHero>

      <section className="section registry-intro" aria-labelledby="registry-intro-title">
        <div className="container">
          <div className="registry-intro-grid">
            <div className="registry-intro-copy">
              <span className="eyebrow">Tu primer paso hacia una vivienda protegida</span>
              <h2 id="registry-intro-title">Inscríbete y mantén siempre actualizada tu información</h2>
              <p>El Registro Público Municipal organiza la demanda de vivienda protegida en San Fernando y permite seleccionar a las personas solicitantes con criterios de igualdad, publicidad y concurrencia.</p>
              <p>Estar inscrito es necesario para participar en los procesos de adjudicación, pero también es importante que tus datos personales, familiares y económicos reflejen tu situación actual.</p>
              <a className="registry-source" href={ordinanceUrl} target="_blank" rel="noreferrer">
                Consultar la ordenanza municipal<ArrowUpRight size={15} />
              </a>
            </div>
            <aside className="registry-online-card" aria-label="Acceso a la plataforma online">
              <span className="registry-online-label"><span />Plataforma online</span>
              <ClipboardCheck size={35} />
              <h3>Gestiona tu inscripción desde casa</h3>
              <p>Accede a la plataforma municipal para informarte, inscribirte y mantener actualizados tus datos.</p>
              <ExternalAnchor href={registryUrl} className="button button-white">
                Acceso ciudadano<ArrowUpRight size={17} />
              </ExternalAnchor>
              <ExternalAnchor href={ordinanceUrl} className="registry-platform-link">
                Consultar la ordenanza del Registro
              </ExternalAnchor>
            </aside>
          </div>

          <div className="registry-key-facts" aria-label="Plazos esenciales">
            <article><strong>3 años</strong><span>de vigencia de la inscripción</span></article>
            <article><strong>3 meses</strong><span>para comunicar cambios y solicitar la renovación antes de caducar</span></article>
            <article><strong>2 meses</strong><span>de plazo previsto para practicar la inscripción desde la entrada de la solicitud</span></article>
          </div>
        </div>
      </section>

      <section className="section registry-requirements" aria-labelledby="registry-requirements-title">
        <div className="container">
          <SectionHeading
            eyebrow="Antes de comenzar"
            title="¿Quién puede inscribirse?"
            text="Estos son los requisitos generales de inscripción. Las condiciones concretas para ser adjudicatario dependen del programa y de cada convocatoria."
          />
          <div className="registry-requirements-grid">
            {requirements.map(({ icon: Icon, title, text }) => (
              <article key={title}>
                <span className="registry-card-icon"><Icon size={24} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <div className="registry-selection-note">
            <Info size={23} />
            <div>
              <h3>Inscripción y adjudicación no son lo mismo</h3>
              <p>Para optar a una promoción deberás cumplir además sus requisitos específicos. En la selección se comprueban, entre otras condiciones, los ingresos, la residencia o vinculación con San Fernando y las circunstancias familiares. La ordenanza establece con carácter general dos años de residencia, con excepciones por trabajo en el municipio, residencia anterior durante la mayor parte de la vida o retorno de emigrantes.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section registry-process" aria-labelledby="registry-process-title">
        <div className="container">
          <SectionHeading
            eyebrow="Paso a paso"
            title="Cómo completar tu inscripción"
            text="Prepara la solicitud con calma y conserva el justificante de presentación. Si necesitas ayuda, puedes pedir cita con el personal municipal."
          />
          <ol className="registry-steps">
            {steps.map(({ title, text }, index) => (
              <li key={title}>
                <span className="registry-step-number">{String(index + 1).padStart(2, '0')}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
          <div className="registry-process-actions">
            <ExternalAnchor href={registryUrl} className="button">Empezar en la plataforma<ArrowUpRight size={17} /></ExternalAnchor>
            <ExternalAnchor href={applicationUrl} className="button button-secondary" download><Download size={17} />Descargar el modelo oficial</ExternalAnchor>
          </div>
        </div>
      </section>

      <section className="section registry-preparation" aria-labelledby="registry-preparation-title">
        <div className="container registry-preparation-grid">
          <div>
            <span className="eyebrow">Prepara tu documentación</span>
            <h2 id="registry-preparation-title">Qué necesitas tener a mano</h2>
            <p className="registry-section-lead">La solicitud recoge los datos de la persona titular y de todos los miembros de la unidad familiar o de convivencia.</p>
            <ul className="registry-checklist">
              {preparation.map((item) => <li key={item}><Check size={18} /><span>{item}</span></li>)}
            </ul>
            <p className="registry-small-note">Si falta algún dato, el Registro comunicará los defectos advertidos y abrirá un plazo de diez días hábiles para subsanarlos antes de resolver.</p>
          </div>
          <aside className="registry-protection-card">
            <ShieldCheck size={30} />
            <h3>Especial protección</h3>
            <p>Si marcas alguna de estas circunstancias en la solicitud, deberás aportar el documento que la acredite.</p>
            <ul>
              {protectionGroups.map((group) => <li key={group}>{group}</li>)}
            </ul>
            <span>También puedes justificar otras situaciones de necesidad de vivienda, como desahucio, ruina, hacinamiento, alquiler elevado, precariedad o necesidad de vivienda adaptada.</span>
          </aside>
        </div>
      </section>

      <section className="registry-renewal" aria-labelledby="registry-renewal-title">
        <div className="container registry-renewal-grid">
          <div className="registry-renewal-heading">
            <CalendarClock size={38} />
            <span className="eyebrow light">Muy importante</span>
            <h2 id="registry-renewal-title">No dejes caducar tu inscripción</h2>
            <p>Si no renuevas dentro del plazo, la inscripción puede cancelarse. Guarda un recordatorio y revisa que tu correo y teléfono sean correctos.</p>
            <ExternalAnchor href={registryUrl} className="button button-white">Revisar mis datos<ArrowUpRight size={17} /></ExternalAnchor>
          </div>
          <div className="registry-renewal-points">
            <article><RefreshCw size={22} /><div><h3>Renueva cada tres años</h3><p>Puedes solicitar la renovación durante los tres meses anteriores a la finalización de la vigencia.</p></div></article>
            <article><FileCheck2 size={22} /><div><h3>Comunica los cambios</h3><p>Actualiza los datos en un plazo general de tres meses. Mantener información incorrecta puede suspender los efectos de la inscripción.</p></div></article>
            <article><BadgeCheck size={22} /><div><h3>Actualiza tus ingresos</h3><p>Los datos económicos se comunican entre el 1 de julio y el 30 de septiembre del año siguiente al ejercicio concluido.</p></div></article>
          </div>
        </div>
      </section>

      <section className="section registry-official" aria-labelledby="registry-official-title">
        <div className="container">
          <SectionHeading
            eyebrow="Documentos oficiales"
            title="Solicitudes y normativa para descargar"
            text="Consulta y descarga los documentos relacionados con el Registro. Utiliza preferentemente la solicitud oficial vigente y la plataforma online."
          />
          <div className="registry-documents-grid">
            {documents.map(({ title, description, meta, url }) => (
              <a href={url} target="_blank" rel="noreferrer" className="registry-document-card" key={title}>
                <span className="registry-document-icon"><FileText size={25} /></span>
                <span className="registry-document-content"><strong>{title}</strong><span>{description}</span><small>{meta}</small></span>
                <Download size={19} className="registry-download-icon" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section registry-faq" aria-labelledby="registry-faq-title">
        <div className="container registry-faq-grid">
          <div className="registry-faq-heading">
            <span className="eyebrow">Resolvemos tus dudas</span>
            <h2 id="registry-faq-title">Preguntas frecuentes</h2>
            <p>Respuestas basadas en la ordenanza municipal y en la información publicada por HEMSA.</p>
            <a href={ordinanceUrl} target="_blank" rel="noreferrer" className="registry-source">Consultar el texto completo<ArrowUpRight size={15} /></a>
          </div>
          <div className="registry-faq-list">
            {faqs.map(({ question, answer }, index) => (
              <details key={question} open={index === 0}>
                <summary>{question}<ChevronDown size={20} /></summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section registry-contact" aria-labelledby="registry-contact-title">
        <div className="container registry-contact-card">
          <div className="registry-contact-copy">
            <Building2 size={31} />
            <span className="eyebrow">Estamos para ayudarte</span>
            <h2 id="registry-contact-title">¿Necesitas ayuda con tu solicitud?</h2>
            <p>Te atendemos en las oficinas de HEMSA, por teléfono o por correo electrónico. Si prefieres atención presencial, solicita cita previa.</p>
            <div className="registry-contact-actions">
              <Link to="/cita-previa" className="button button-white"><CalendarDays size={17} />Pedir cita previa</Link>
              <a href={`tel:${content.contact.phone.replaceAll(' ', '')}`} className="button button-outline-white"><Phone size={17} />{content.contact.phone}</a>
            </div>
          </div>
          <div className="registry-contact-details">
            <a href={`mailto:${content.contact.email}`}><Mail size={20} /><span><small>Correo electrónico</small><strong>{content.contact.email}</strong></span></a>
            <a href="https://www.google.com/maps/search/?api=1&query=Avenida+San+Juan+Bosco+46+San+Fernando+Cadiz" target="_blank" rel="noreferrer"><MapPin size={20} /><span><small>Oficinas</small><strong>Avda. San Juan Bosco, 46</strong><span>11100 San Fernando (Cádiz)</span></span></a>
            <div><CalendarClock size={20} /><span><small>Horario de atención</small><strong>{content.contact.schedule}</strong></span></div>
          </div>
        </div>
      </section>
    </div>
  );
}
