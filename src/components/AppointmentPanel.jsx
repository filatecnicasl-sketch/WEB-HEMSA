import { useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, HeartHandshake, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { apiRequest, readableError } from '../lib/api';

const initialForm = { name: '', phone: '', email: '', service: '', date: '', notes: '', privacy: false, website: '' };

export default function AppointmentPanel() {
  const { content } = useSite();
  const [form, setForm] = useState(initialForm);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const today = new Date().toLocaleDateString('sv-SE');

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
      const response = await apiRequest('/api/public/appointments', { method: 'POST', body: form });
      setForm(initialForm);
      setResult({ type: 'success', message: `Hemos recibido tu solicitud. Referencia: ${response.reference}. Te llamaremos para confirmar el día y la hora.` });
    } catch (error) {
      setResult({ type: 'error', message: `${readableError(error)} También puedes llamarnos al ${content.contact.phone}.` });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="r-appointment-layout">
      <div className="r-appointment-copy">
        <span className="r-eyebrow">Hablemos</span>
        <h2>Pide tu cita previa, te llamamos</h2>
        <p>Cuéntanos qué necesitas. Una persona de nuestro equipo te llamará para confirmar el día y la hora que mejor te vengan.</p>
        <div className="r-calm-note"><img src="/images/hemsa-hero-personas.jpg" alt="" /><span><HeartHandshake size={20} />Te atenderemos con calma y sin prisas.</span></div>
        <a className="r-contact-line" href={`tel:${content.contact.phone.replaceAll(' ', '')}`}><Phone size={18} /><strong>{content.contact.phone}</strong></a>
        <a className="r-contact-line" href={`mailto:${content.contact.email}`}><Mail size={18} /><strong>{content.contact.email}</strong></a>
        <div className="r-contact-line r-address"><MapPin size={18} /><span>{content.contact.address}<small>Horario de atención: <strong>{content.contact.schedule}</strong></small></span></div>
      </div>

      <form className="r-appointment-form" onSubmit={submit} aria-busy={sending}>
        <label className="r-field-full">Nombre y apellidos<input name="name" value={form.name} onChange={update} required minLength="2" maxLength="120" autoComplete="name" placeholder="María García López" /></label>
        <label>Teléfono<input name="phone" type="tel" value={form.phone} onChange={update} required minLength="7" maxLength="30" autoComplete="tel" placeholder="600 000 000" /></label>
        <label>Email<input name="email" type="email" value={form.email} onChange={update} required maxLength="160" autoComplete="email" placeholder="nombre@correo.es" /></label>
        <label>Motivo<select name="service" value={form.service} onChange={update} required><option value="" disabled>Selecciona un motivo</option><option>Información general</option><option>Vivienda y registro de demandantes</option><option>Servicio de Ayuda a Domicilio</option><option>Venta de mi vivienda</option><option>Garajes y trasteros</option><option>Locales y parcelas</option><option>Empleo y convocatorias</option><option>Transparencia y documentación</option></select></label>
        <label>Fecha preferida<input name="date" type="date" min={today} value={form.date} onChange={update} /></label>
        <label className="r-field-full">Comentario <span>(opcional)</span><textarea name="notes" value={form.notes} onChange={update} maxLength="2000" rows="4" placeholder="Cuéntanos brevemente en qué podemos ayudarte" /></label>
        <label className="r-privacy-check r-field-full"><input name="privacy" type="checkbox" checked={form.privacy} onChange={update} required /><span>Tus datos se usarán solo para gestionar tu cita, según nuestra <a href="/documents/otros/politica-privacidad-pagina-web-rgpd-hemsa.pdf" target="_blank" rel="noreferrer">política de privacidad</a>. Te llamaremos para confirmar día y hora.</span></label>
        <label className="form-honeypot" aria-hidden="true">No rellenar<input name="website" value={form.website} onChange={update} tabIndex="-1" autoComplete="off" /></label>
        <div className="r-form-bottom r-field-full"><small>La cita no quedará confirmada hasta recibir respuesta de HEMSA.</small><button type="submit" className="r-button" disabled={sending}><Send size={16} />{sending ? 'Enviando…' : 'Solicitar cita'}<ArrowRight size={16} /></button></div>
        {result && <div className={`r-form-status r-field-full ${result.type === 'error' ? 'is-error' : ''}`} role={result.type === 'error' ? 'alert' : 'status'}>{result.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}<span>{result.message}</span></div>}
      </form>
    </div>
  );
}
