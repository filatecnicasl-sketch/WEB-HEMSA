import { Link } from 'react-router-dom';
import {
  ArrowRight, CalendarDays, HeartHandshake, Home, LockKeyhole, MapPin,
  Phone, ShieldCheck, Sparkles, Users,
} from 'lucide-react';
import { PageHero } from '../components/UI';

export default function HomeCare() {
  return (
    <>
      <PageHero
        eyebrow="Servicios municipales"
        title="Ayuda a domicilio"
        text="Apoyo cercano y personalizado para mantener la autonomía, la seguridad y el bienestar en el propio hogar."
      />

      <section className="section service-detail sad-service" id="ayuda-a-domicilio">
        <div className="container">
          <div className="sad-intro-grid">
            <div className="sad-intro-copy">
              <span className="eyebrow">Bienestar y atención a las personas</span>
              <h2>Servicio Municipal de Ayuda a Domicilio</h2>
              <p className="sad-emotional-lead">Tu casa es donde están tus recuerdos, tus costumbres y tu manera de vivir. Cuando la vida se complica, recibir apoyo no debería significar renunciar a todo eso.</p>
              <p>HEMSA presta y gestiona este servicio como medio propio y servicio técnico del Ayuntamiento de San Fernando. Trabajamos para que cada persona pueda mantener su autonomía, sentirse segura y seguir formando parte de su entorno.</p>
              <div className="button-group">
                <Link to="/area-sad" className="button"><LockKeyhole size={17} />Acceder a mi área SAD</Link>
                <Link to="/cita-previa" className="button button-secondary"><CalendarDays size={17} />Solicitar cita previa</Link>
              </div>
            </div>
            <figure className="sad-illustration">
              <img src="/images/ayuda-domicilio-ilustracion.webp" alt="Una profesional y una persona mayor comparten una conversación cercana en el salón de su casa" />
              <figcaption><HeartHandshake size={25} /><span><strong>Escuchar también es cuidar.</strong> Atención cercana, respetuosa y adaptada a cada historia.</span></figcaption>
            </figure>
          </div>

          <div className="sad-care-articles">
            <article>
              <span className="sad-care-icon"><Home size={24} /></span>
              <h3>Tu vida, tus rutinas, tu hogar</h3>
              <p>Apoyamos las actividades de la vida diaria respetando tus hábitos, tus decisiones y tu ritmo. Se trata de ayudarte a hacer, no de hacerlo todo por ti: cada gesto de autonomía cuenta.</p>
            </article>
            <article>
              <span className="sad-care-icon"><ShieldCheck size={24} /></span>
              <h3>Compañía que da seguridad</h3>
              <p>Una conversación, una visita conocida o salir a pasear pueden cambiar el día. El acompañamiento y la prevención ayudan a detectar necesidades, reforzar la confianza y mantener el vínculo con el barrio.</p>
            </article>
            <article>
              <span className="sad-care-icon"><Users size={24} /></span>
              <h3>También cuidamos de quienes cuidan</h3>
              <p>Quien cuida también necesita sentirse acompañado. El servicio puede ser un apoyo para compartir responsabilidades, conciliar y afrontar la vida diaria con más tranquilidad.</p>
            </article>
          </div>

          <div className="sad-contact-agent-grid">
            <aside className="service-contact-card sad-contact-card">
              <span className="eyebrow">Atención directa SAD</span>
              <h3>Hablemos de lo que necesitas</h3>
              <a className="sad-direct-phone" href="tel:956945001"><Phone size={21} /><span><small>Teléfono exclusivo de Ayuda a Domicilio</small><strong>956 945 001</strong></span></a>
              <p><MapPin size={18} /><span><small>Oficinas</small>Avenida San Juan Bosco, 46</span></p>
              <p><CalendarDays size={18} /><span><small>Horario</small>Lunes a viernes, 9:00–13:30 h</span></p>
            </aside>
            <div className="sad-public-agent">
              <span className="sad-public-agent-icon"><Sparkles size={26} /></span>
              <div><span className="eyebrow">Nuevo · Atención personalizada</span><h3>Tu agente personal del servicio</h3><p>Consulta tus visitas, registra avisos, solicita cambios y pide ayuda a coordinación desde tu espacio privado.</p></div>
              <Link to="/area-sad" className="button button-secondary">Probar la demostración<ArrowRight size={17} /></Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
