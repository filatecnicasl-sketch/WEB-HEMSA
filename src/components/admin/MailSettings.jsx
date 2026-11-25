import { useEffect, useState } from 'react';
import { MailCheck, Save, Send } from 'lucide-react';
import { readableError } from '../../lib/api';

const EMPTY_FORM = {
  enabled: false,
  host: 'smtp.office365.com',
  port: '587',
  security: 'starttls',
  username: '',
  password: '',
  sender: '',
  recipient: '',
};

export default function MailSettings({ request }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [passwordSet, setPasswordSet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let activeRequest = true;
    request('/api/admin/mail-settings')
      .then((data) => {
        if (!activeRequest) return;
        const settings = data.settings;
        setForm({
          enabled: Boolean(settings.enabled),
          host: settings.host || '',
          port: String(settings.port || ''),
          security: settings.security || 'starttls',
          username: settings.username || '',
          password: '',
          sender: settings.sender || '',
          recipient: settings.recipient || '',
        });
        setPasswordSet(Boolean(settings.passwordSet));
      })
      .catch((reason) => { if (activeRequest) setError(readableError(reason)); })
      .finally(() => { if (activeRequest) setLoading(false); });
    return () => { activeRequest = false; };
  }, [request]);

  const update = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setNotice('');
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setFields({});
    setNotice('');
    try {
      const data = await request('/api/admin/mail-settings', {
        method: 'POST',
        body: { ...form, port: form.port === '' ? '' : Number(form.port) },
      });
      setPasswordSet(Boolean(data.settings.passwordSet));
      setForm((previous) => ({ ...previous, password: '' }));
      setNotice('Configuración guardada correctamente.');
    } catch (reason) {
      setError(readableError(reason));
      setFields(reason.fields || {});
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    setTesting(true);
    setError('');
    setNotice('');
    try {
      const data = await request('/api/admin/mail-settings/test', { method: 'POST' });
      setNotice(`Correo de prueba enviado a ${data.recipient} (referencia ${data.reference}). Revisa la bandeja de entrada y la carpeta de correo no deseado.`);
    } catch (reason) {
      setError(readableError(reason));
      setFields(reason.fields || {});
    } finally {
      setTesting(false);
    }
  };

  const fieldError = (key) => fields[key] ? <small className="admin-error" role="alert">{fields[key]}</small> : null;

  if (loading) return <p className="admin-loading">Cargando la configuración de correo…</p>;

  return <div className="admin-card">
    <div className="admin-card-title"><MailCheck size={20} /><h2>Buzón de envío de la web</h2></div>
    <p>Es el correo que usan los formularios de <strong>contacto</strong> y <strong>cita previa</strong> para entregar los mensajes en HEMSA. La contraseña nunca se muestra: escribe una nueva solo si quieres cambiarla.</p>
    <div className="local-demo-notice"><p><strong>Aviso importante:</strong> en el servidor de pruebas gratuito (Render) el envío de correo está bloqueado y los cambios pueden perderse al reiniciarse. Esta configuración funcionará por completo cuando la web pase al servidor definitivo.</p></div>

    <form onSubmit={save} className="admin-mail-form">
      <label className="admin-toggle">
        <input type="checkbox" checked={form.enabled} onChange={(event) => update('enabled', event.target.checked)} />
        <span><strong>Envío de correo activado</strong><small>Si está desactivado, los formularios avisan de que el correo no está configurado.</small></span>
      </label>

      <div className="form-row form-row-three">
        <label>Servidor de correo saliente (SMTP)
          <input type="text" value={form.host} onChange={(event) => update('host', event.target.value)} maxLength={160} placeholder="smtp.office365.com" autoComplete="off" />
          {fieldError('host')}
        </label>
        <label>Puerto
          <input type="number" min="1" max="65535" value={form.port} onChange={(event) => update('port', event.target.value)} placeholder="587" />
          {fieldError('port')}
        </label>
        <label>Seguridad
          <select value={form.security} onChange={(event) => update('security', event.target.value)}>
            <option value="starttls">STARTTLS (recomendado, puerto 587)</option>
            <option value="ssl">SSL/TLS (puerto 465)</option>
            <option value="none">Sin cifrado (no recomendado)</option>
          </select>
          {fieldError('security')}
        </label>
      </div>

      <div className="form-row">
        <label>Usuario del buzón
          <input type="text" value={form.username} onChange={(event) => update('username', event.target.value)} maxLength={160} placeholder="notificaciones@hemsasanfernando.es" autoComplete="off" />
          {fieldError('username')}
        </label>
        <label>Contraseña {passwordSet && <small>Guardada — escribe solo si quieres cambiarla</small>}
          <input type="password" value={form.password} onChange={(event) => update('password', event.target.value)} maxLength={256} placeholder={passwordSet ? 'Dejar en blanco para conservar la actual' : 'Contraseña del buzón'} autoComplete="new-password" />
          {fieldError('password')}
        </label>
      </div>

      <div className="form-row">
        <label>Remitente (de)
          <input type="email" value={form.sender} onChange={(event) => update('sender', event.target.value)} maxLength={160} placeholder="notificaciones@hemsasanfernando.es" />
          {fieldError('sender')}
        </label>
        <label>Destinatario de los formularios (para)
          <input type="email" value={form.recipient} onChange={(event) => update('recipient', event.target.value)} maxLength={160} placeholder="correo@hemsasanfernando.es" />
          {fieldError('recipient')}
        </label>
      </div>

      {error && <div className="form-status admin-error" role="alert">{error}</div>}
      {notice && <div className="form-status admin-saved" role="status">{notice}</div>}

      <div className="admin-actions">
        <button type="submit" className="button" disabled={saving}><Save size={17} />{saving ? 'Guardando…' : 'Guardar configuración'}</button>
        <button type="button" className="button button-secondary" onClick={sendTest} disabled={testing || saving}><Send size={17} />{testing ? 'Enviando prueba…' : 'Enviar correo de prueba'}</button>
      </div>
      <small>La prueba usa la configuración ya guardada y la envía al destinatario indicado. Si no llega, revisa los datos y la carpeta de correo no deseado.</small>
    </form>
  </div>;
}
