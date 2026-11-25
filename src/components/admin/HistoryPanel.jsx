import { useCallback, useEffect, useState } from 'react';
import { Download, History, RotateCcw } from 'lucide-react';
import { readableError } from '../../lib/api';

const actionNames = { initial: 'Contenido inicial', publish: 'Publicación', backup: 'Versión anterior', archive: 'Archivo editorial' };

export function RevisionList({ revisions, onRestore, onDownload, busy }) {
  if (!revisions.length) return <p className="admin-empty">Todavía no hay revisiones.</p>;
  return <div className="revision-list">{revisions.map((revision) => (
    <article className="revision-row" key={revision.id}>
      <span className="revision-icon"><History size={18} /></span>
      <div><strong>{actionNames[revision.action] || revision.action}</strong><small>{new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(revision.createdAt))} · {revision.createdBy.email}</small></div>
      <div className="revision-actions">
        {onDownload && <button type="button" className="icon-button" onClick={() => onDownload(revision)} disabled={Boolean(busy)} title="Descargar copia JSON" aria-label="Descargar copia JSON"><Download size={17} /></button>}
        <button type="button" className="button button-small button-secondary" onClick={() => onRestore(revision)} disabled={Boolean(busy)}><RotateCcw size={15} />Restaurar al borrador</button>
      </div>
    </article>
  ))}</div>;
}

export default function HistoryPanel({ state, request, onState }) {
  const [revisions, setRevisions] = useState([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setBusy('load');
    try {
      const data = await request('/api/admin/content/revisions');
      setRevisions(data.revisions);
      setError('');
    } catch (reason) {
      setError(readableError(reason));
    } finally {
      setBusy('');
    }
  }, [request]);

  useEffect(() => { load(); }, [load]);

  const restore = async (revision) => {
    if (!window.confirm('¿Copiar esta versión al borrador? No se publicará hasta que pulses «Publicar».')) return;
    setBusy(revision.id);
    setError('');
    try {
      const result = await request('/api/admin/content/revisions/restore', {
        method: 'POST', body: { revisionId: revision.id, baseVersion: state.version },
      });
      onState(result);
      setMessage('La versión seleccionada ya está en el borrador. La web pública no ha cambiado.');
    } catch (reason) {
      setError(readableError(reason));
    } finally {
      setBusy('');
    }
  };

  const download = async (revision) => {
    setBusy(revision.id);
    try {
      const data = await request(`/api/admin/content/revisions/${encodeURIComponent(revision.id)}`);
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `hemsa-contenido-${revision.id}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (reason) {
      setError(readableError(reason));
    } finally {
      setBusy('');
    }
  };

  return <section className="admin-card">
    <div className="admin-card-title"><History size={21} /><div><h2>Historial de Inicio y Contacto</h2><p>Consulta, descarga o restaura una versión. Restaurar nunca publica automáticamente.</p></div></div>
    {message && <div className="form-status admin-saved" role="status">{message}</div>}
    {error && <div className="form-status admin-error" role="alert">{error}</div>}
    {busy === 'load' ? <p className="admin-empty">Cargando historial…</p> : <RevisionList revisions={revisions} onRestore={restore} onDownload={download} busy={busy} />}
  </section>;
}
