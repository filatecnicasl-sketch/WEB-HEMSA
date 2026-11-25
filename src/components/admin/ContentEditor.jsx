import { useEffect, useState } from 'react';
import { Bell, Check, FileText, RotateCcw, Save, Send, Settings } from 'lucide-react';
import { readableError } from '../../lib/api';

export default function ContentEditor({ section, state, request, onState, onPublished }) {
  const [draft, setDraft] = useState(state.draft);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft(state.draft);
  }, [state]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(state.draft);
  const update = (area, field, value) => {
    setDraft((current) => ({ ...current, [area]: { ...current[area], [field]: value } }));
    setMessage('');
    setError('');
  };

  const save = async (event) => {
    event.preventDefault();
    setBusy('save');
    setError('');
    try {
      const result = await request('/api/admin/content/draft', {
        method: 'POST', body: { content: draft, baseVersion: state.version },
      });
      onState(result);
      setMessage('Borrador guardado en el servidor. La web pública no ha cambiado.');
    } catch (reason) {
      setError(readableError(reason));
    } finally {
      setBusy('');
    }
  };

  const publish = async () => {
    if (dirty || !window.confirm('¿Publicar el último borrador guardado? Esta acción sí actualizará la web pública.')) return;
    setBusy('publish');
    setError('');
    try {
      const result = await request('/api/admin/content/publish', {
        method: 'POST', body: { baseVersion: state.version },
      });
      onState(result);
      await onPublished();
      setMessage('Contenido publicado correctamente. La web pública ya está actualizada.');
    } catch (reason) {
      setError(readableError(reason));
    } finally {
      setBusy('');
    }
  };

  const discard = async () => {
    if (!window.confirm('¿Descartar el borrador y recuperar el contenido que está publicado actualmente?')) return;
    setBusy('discard');
    setError('');
    try {
      const result = await request('/api/admin/content/discard-draft', {
        method: 'POST', body: { baseVersion: state.version },
      });
      onState(result);
      setMessage('Se ha recuperado el contenido publicado y se ha descartado el borrador.');
    } catch (reason) {
      setError(readableError(reason));
    } finally {
      setBusy('');
    }
  };

  return (
    <form onSubmit={save} className="admin-form">
      <div className="editor-state-bar">
        <span>Versión {state.version}</span>
        <span className={dirty || state.hasUnpublishedChanges ? 'state-dot pending' : 'state-dot'}>
          {dirty ? 'Cambios sin guardar' : state.hasUnpublishedChanges ? 'Borrador pendiente de publicar' : 'Borrador y publicación coinciden'}
        </span>
      </div>

      {section === 'inicio' && <>
        <section className="admin-card" id="aviso">
          <div className="admin-card-title"><Bell size={21} /><div><h2>Aviso destacado</h2><p>Franja informativa opcional en la parte superior de la web.</p></div></div>
          <label className="admin-toggle"><input type="checkbox" checked={draft.notice.enabled} onChange={(event) => update('notice', 'enabled', event.target.checked)} /><span>Mostrar el aviso en la web al publicarlo</span></label>
          <div className="form-row"><label>Etiqueta<input value={draft.notice.label} onChange={(event) => update('notice', 'label', event.target.value)} maxLength={30} required /></label><label>Enlace<select value={draft.notice.link} onChange={(event) => update('notice', 'link', event.target.value)}><option value="/empleo">Empleo</option><option value="/vivienda">Vivienda</option><option value="/servicios">Áreas de actuación</option><option value="/contacto">Contacto</option><option value="/ayudas-y-subvenciones">Ayudas y subvenciones</option></select></label></div>
          <label>Texto del aviso<input value={draft.notice.text} onChange={(event) => update('notice', 'text', event.target.value)} maxLength={100} required /><small>{draft.notice.text.length}/100 caracteres</small></label>
        </section>

        <section className="admin-card" id="contenido-general">
          <div className="admin-card-title"><FileText size={21} /><div><h2>Bloque principal de Inicio</h2><p>Primer mensaje que verán las personas visitantes.</p></div></div>
          <label>Texto superior<input value={draft.hero.eyebrow} onChange={(event) => update('hero', 'eyebrow', event.target.value)} maxLength={70} required /></label>
          <label>Titular principal<textarea rows="3" value={draft.hero.title} onChange={(event) => update('hero', 'title', event.target.value)} maxLength={100} required /><small>{draft.hero.title.length}/100 caracteres</small></label>
          <label>Descripción<textarea rows="4" value={draft.hero.text} onChange={(event) => update('hero', 'text', event.target.value)} maxLength={240} required /><small>{draft.hero.text.length}/240 caracteres</small></label>
        </section>
      </>}

      {section === 'contacto' && <section className="admin-card" id="datos-contacto">
        <div className="admin-card-title"><Settings size={21} /><div><h2>Datos de contacto</h2><p>Información utilizada en los datos generales de contacto y en el pie de la web.</p></div></div>
        <div className="form-row"><label>Teléfono<input value={draft.contact.phone} onChange={(event) => update('contact', 'phone', event.target.value)} maxLength={30} required /></label><label>Correo electrónico<input type="email" value={draft.contact.email} onChange={(event) => update('contact', 'email', event.target.value)} maxLength={160} required /></label></div>
        <label>Dirección<input value={draft.contact.address} onChange={(event) => update('contact', 'address', event.target.value)} maxLength={160} required /></label>
        <label>Horario<input value={draft.contact.schedule} onChange={(event) => update('contact', 'schedule', event.target.value)} maxLength={120} required /></label>
      </section>}

      <div className="admin-actions admin-publish-actions">
        <button type="button" className="button button-quiet" onClick={discard} disabled={Boolean(busy)}><RotateCcw size={17} />Descartar borrador</button>
        <div>
          <button type="submit" className="button button-secondary" disabled={Boolean(busy) || !dirty}><Save size={17} />{busy === 'save' ? 'Guardando…' : 'Guardar borrador'}</button>
          <button type="button" className="button" onClick={publish} disabled={Boolean(busy) || dirty} title={dirty ? 'Guarda primero el borrador' : 'Publica el último borrador guardado'}><Send size={17} />{busy === 'publish' ? 'Publicando…' : 'Publicar'}</button>
        </div>
      </div>
      {dirty && <p className="editor-help">Guarda el borrador antes de poder publicarlo.</p>}
      {message && <div className="form-status admin-saved" role="status"><Check size={18} />{message}</div>}
      {error && <div className="form-status admin-error" role="alert">{error}</div>}
    </form>
  );
}
