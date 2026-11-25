import { useState } from 'react';
import {
  AlertCircle, ArrowUpRight, Building2, CalendarDays, CheckCircle2, Clock3, Mail,
  MapPin, Phone, Send,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHero } from '../components/UI';
import { useSite } from '../context/SiteContext';
import { apiRequest, readableError } from '../lib/api';

const initialForm = { name: '', email: '', phone: '', subject: 'Información general', message: '', privacy: false, website: '' };

export default function Contact() {
  const { content } = useSite();
  const [form, setForm] = useState(initialForm);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const update = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setResult(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    setResult(null);
    try {
      const response = await apiRequest('/api/public/contact', { method: 'POST', body: form });
      setForm(initialForm);
      setResult({ type: 'success', message: `Hemos recibido tu mensaje correctamente. Referencia: ${response.reference}. Te responderemos lo antes posible.` });
    } catch (error) {
      setResult({ type: 'error', message: `${readableError(error)} También puedes escribirnos a ${content.contact.email}.` });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Atención a la ciudadanía"
        title="Contacto"
        text="Estamos a tu disposición para resolver dudas, recibir sugerencias y facilitarte la información que necesites."
      />

      <section className="section contact-page">
        <div className="container contact-layout">
          <div className="contact-information">
            <span className="eyebrow">Hablemos</span>
            <h2>¿Cómo podemos ayudarte?</h2>
            <p>Puedes escribirnos, llamarnos o visitar nuestras oficinas durante el horario de atención.</p>
            <div className="contact-methods">
              <a href={`tel:${content.contact.phone.replaceAll(' ', '')}`} className="contact-method"><span><Phone /></span><div><small>Teléfono</small><strong>{content.contact.phone}</strong><p>Lunes a viernes, 9:00–13:30 h</p></div><ArrowUpRight /></a>
              <a href={`mailto:${content.contact.email}`} className="contact-method"><span><Mail /></span><div><small>Correo electrónico</small><strong>{content.contact.email}</strong><p>Consultas, quejas y sugerencias</p></div><ArrowUpRight /></a>
              <a href="https://www.google.com/maps/search/?api=1&query=Avenida+San+Juan+Bosco+46+San+Fernando+Cadiz" target="_blank" rel="noreferrer" className="contact-method"><span><MapPin /></span><div><small>Oficinas</small><strong>Avenida San Juan Bosco, 46</strong><p>11100 San Fernando (Cádiz)</p></div><ArrowUpRight /></a>
            </div>
            <div className="office-hours"><Clock3 size={22} /><div><strong>Horario de oficina</strong><p>{content.contact.schedule}</p><span>Sábados y domingos cerrado</span></div></div>
            <Link to="/cita-previa" className="button button-secondary"><CalendarDays size={17} />Solicitar cita previa</Link>
          </div>

          <div className="form-card">
            <div className="form-card-heading"><span><Building2 size={22} /></span><div><h2>Envíanos un mensaje</h2><p>Los campos marcados con * son obligatorios.</p></div></div>
            <form onSubmit={submit} aria-busy={sending}>
              <div className="form-row">
                <label>Nombre y apellidos *<input name="name" value={form.name} onChange={update} required minLength="2" maxLength="120" autoComplete="name" placeholder="Tu nombre completo" /></label>
                <label>Correo electrónico *<input name="email" type="email" value={form.email} onChange={update} required maxLength="160" autoComplete="email" placeholder="nombre@correo.es" /></label>
              </div>
              <div className="form-row">
                <label>Teléfono<input name="phone" type="tel" value={form.phone} onChange={update} maxLength="30" autoComplete="tel" placeholder="Tu teléfono de contacto" /></label>
                <label>Asunto *<select name="subject" value={form.subject} onChange={update} required><option>Información general</option><option>Vivienda y promociones</option><option>Ayuda a domicilio</option><option>Garajes, locales y parcelas</option><option>Empleo y convocatorias</option><option>Quejas y sugerencias</option></select></label>
              </div>
              <label>Mensaje *<textarea name="message" value={form.message} onChange={update} required minLength="10" maxLength="4000" rows="6" placeholder="Cuéntanos en qué podemos ayudarte…" /></label>
              <label className="checkbox-label"><input name="privacy" type="checkbox" checked={form.privacy} onChange={update} required /><span>He leído y acepto la <a href="/documents/otros/politica-privacidad-pagina-web-rgpd-hemsa.pdf" target="_blank" rel="noreferrer">política de privacidad</a> y el tratamiento de mis datos para atender esta solicitud. *</span></label>
              <label className="form-honeypot" aria-hidden="true">No rellenar<input name="website" value={form.website} onChange={update} tabIndex="-1" autoComplete="off" /></label>
              <button type="submit" className="button form-submit" disabled={sending}><Send size={17} />{sending ? 'Enviando…' : 'Enviar mensaje'}</button>
              <p className="form-note">El mensaje se enviará directamente a HEMSA. No necesitas abrir tu aplicación de correo.</p>
              {result && <div className={`form-status ${result.type === 'error' ? 'is-error' : ''}`} role={result.type === 'error' ? 'alert' : 'status'}>{result.type === 'error' ? <AlertCircle size={19} /> : <CheckCircle2 size={19} />}<span>{result.message}</span></div>}
            </form>
          </div>
        </div>
      </section>

      <section className="section contact-map-section" aria-labelledby="contact-map-title">
        <div className="container">
          <div className="contact-map-heading">
            <div>
              <span className="eyebrow">Estamos en La Isla</span>
              <h2 id="contact-map-title">Mapa de situación</h2>
              <p>Oficinas de HEMSA en Avenida San Juan Bosco, 46, 11100 San Fernando (Cádiz).</p>
            </div>
            <a href="https://www.google.com/maps/dir/?api=1&destination=Avenida%20San%20Juan%20Bosco%2046%2C%2011100%20San%20Fernando%2C%20C%C3%A1diz%2C%20Espa%C3%B1a" target="_blank" rel="noreferrer" className="button button-secondary">Cómo llegar<ArrowUpRight size={17} /></a>
          </div>
          <div className="contact-map-frame">
            <iframe
              title="Mapa de situación de las oficinas de HEMSA San Fernando"
              src="https://www.google.com/maps?q=Avenida%20San%20Juan%20Bosco%2046%2C%2011100%20San%20Fernando%2C%20C%C3%A1diz%2C%20Espa%C3%B1a&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </section>
    </>
  );
}
