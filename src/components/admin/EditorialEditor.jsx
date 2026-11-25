import { useCallback, useEffect, useState } from 'react';
import {
  Archive, ArrowUpRight, BriefcaseBusiness, Check, ChevronDown, FilePlus2,
  FileText, History, Megaphone, Plus, Save, Send, Trash2, Upload, X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { readableError } from '../../lib/api';
import { RevisionList } from './HistoryPanel';

const NEW_ITEM = '__new__';
const documentKinds = {
  bases: 'Bases', formulario: 'Formulario', listado: 'Listado',
  resolucion: 'Resolución', resultado: 'Resultado', otro: 'Otro documento',
};
const statusNames = { draft: 'Borrador privado', published: 'Publicado', archived: 'Archivado' };
const clone = (value) => JSON.parse(JSON.stringify(value));
const slugify = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function emptyItem(kind) {
  const today = new Date().toISOString().slice(0, 10);
  if (kind === 'grants') return {
    id: '', category: '', title: '', summary: '', publicationDate: today,
    deadlineDate: null, deadlineLabel: 'Fin de solicitudes', note: '',
    contentUpdatedAt: null, sourceUrl: null, sourceLabel: '', icon: 'Megaphone', documents: [],
  };
  return {
    id: '', title: '', description: '', publicationDate: null, deadlineDate: null,
    statusLabel: 'Convocatoria', displayGroup: 'current', documents: [],
  };
}

function ItemHistory({ kind, item, request, onSaved }) {
  const [revisions, setRevisions] = useState([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setBusy('load');
    try {
      const data = await request(`/api/admin/${kind}/${encodeURIComponent(item.draft.id)}/revisions`);
      setRevisions(data.revisions);
    } catch (reason) {
      setError(readableError(reason));
    } finally {
      setBusy('');
    }
  }, [item.draft.id, kind, request]);

  useEffect(() => { load(); }, [load]);

  const restore = async (revision) => {
    if (!window.confirm('¿Restaurar esta versión al borrador? El contenido público no cambiará.')) return;
    setBusy(revision.id);
    try {
      const result = await request(`/api/admin/${kind}/${encodeURIComponent(item.draft.id)}/restore`, {
        method: 'POST', body: { revisionId: revision.id, baseVersion: item.version },
      });
      onSaved(kind, result.item);
      setMessage('Versión restaurada al borrador. Revísala y publícala cuando quieras.');
    } catch (reason) {
      setError(readableError(reason));
    } finally {
      setBusy('');
    }
  };

  return <div className="item-history">
    <h3><History size={18} />Versiones de este contenido</h3>
    {message && <div className="form-status admin-saved" role="status">{message}</div>}
    {error && <div className="form-status admin-error" role="alert">{error}</div>}
    {busy === 'load' ? <p className="admin-empty">Cargando versiones…</p> : <RevisionList revisions={revisions} onRestore={restore} busy={busy} />}
  </div>;
}

export default function EditorialEditor({ kind, items, request, onSaved }) {
  const [selectedId, setSelectedId] = useState(items[0]?.draft.id || NEW_ITEM);
  const current = items.find((entry) => entry.draft.id === selectedId);
  const isNew = selectedId === NEW_ITEM;
  const [draft, setDraft] = useState(() => current?.draft || emptyItem(kind));
  const [idLocked, setIdLocked] = useState(false);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState(null);
  const [upload, setUpload] = useState({ title: '', description: '', pages: '', kind: 'bases' });

  useEffect(() => {
    if (!selectedId && items[0]) setSelectedId(items[0].draft.id);
  }, [items, selectedId]);

  useEffect(() => {
    setDraft(clone(current?.draft || emptyItem(kind)));
    setIdLocked(false);
    setShowHistory(false);
    setShowUpload(false);
  }, [current?.version, isNew, kind, selectedId]);

  const dirty = isNew || JSON.stringify(draft) !== JSON.stringify(current?.draft);
  const label = kind === 'grants' ? 'ayuda' : 'convocatoria';
  const publicBase = kind === 'grants' ? '/ayudas-y-subvenciones' : '/empleo';

  const select = (id) => {
    if (dirty && !window.confirm('Hay cambios sin guardar en el formulario. ¿Cambiar de contenido y perder esos cambios locales?')) return;
    setSelectedId(id);
  };

  const update = (field, value) => {
    setDraft((previous) => {
      const next = { ...previous, [field]: value };
      if (field === 'title' && isNew && !idLocked) next.id = slugify(value);
      return next;
    });
    setMessage('');
    setError('');
  };

  const save = async (event) => {
    event.preventDefault();
    setBusy('save');
    setError('');
    try {
      const result = await request(isNew ? `/api/admin/${kind}` : `/api/admin/${kind}/${encodeURIComponent(current.draft.id)}`, {
        method: 'POST',
        body: isNew ? { item: draft } : { item: draft, baseVersion: current.version },
      });
      onSaved(kind, result.item);
      setSelectedId(result.item.draft.id);
      setMessage(`La ${label} se ha guardado como borrador privado. La web pública no ha cambiado.`);
    } catch (reason) {
      setError(readableError(reason));
    } finally {
      setBusy('');
    }
  };

  const publish = async () => {
    if (!current || dirty || !window.confirm(`¿Publicar el último borrador guardado de esta ${label}?`)) return;
    setBusy('publish');
    try {
      const result = await request(`/api/admin/${kind}/${encodeURIComponent(current.draft.id)}/publish`, {
        method: 'POST', body: { baseVersion: current.version },
      });
      onSaved(kind, result.item);
      setMessage('Publicación completada. El contenido y sus documentos ya están visibles en la web.');
    } catch (reason) {
      setError(readableError(reason));
    } finally {
      setBusy('');
    }
  };

  const archive = async () => {
    if (!current || dirty || !window.confirm(`¿Archivar esta ${label}? Dejará de aparecer en la web pública, pero conservará su historial.`)) return;
    setBusy('archive');
    try {
      const result = await request(`/api/admin/${kind}/${encodeURIComponent(current.draft.id)}/archive`, {
        method: 'POST', body: { baseVersion: current.version },
      });
      onSaved(kind, result.item);
      setMessage('Contenido archivado y retirado de la web pública. Puedes volver a publicarlo más adelante.');
    } catch (reason) {
      setError(readableError(reason));
    } finally {
      setBusy('');
    }
  };

  const openUpload = (documentKind = 'bases') => {
    setUpload({ title: '', description: '', pages: '', kind: documentKind });
    setFile(null);
    setShowUpload(true);
  };

  const uploadDocument = async (event) => {
    event.preventDefault();
    if (!file || !current || dirty) return;
    if (file.size > 15 * 1024 * 1024) {
      setError('El PDF supera el límite de 15 MB.');
      return;
    }
    const form = new FormData();
    form.set('ownerType', kind);
    form.set('ownerId', current.draft.id);
    form.set('baseVersion', String(current.version));
    form.set('title', upload.title);
    form.set('description', upload.description);
    form.set('pages', upload.pages);
    form.set('kind', upload.kind);
    form.set('file', file);
    setBusy('upload');
    setError('');
    try {
      const result = await request('/api/admin/documents', { method: 'POST', form });
      onSaved(kind, result.item);
      setShowUpload(false);
      setMessage(`«${result.document.title}» se ha añadido al borrador. Todavía no es público.`);
    } catch (reason) {
      setError(readableError(reason));
    } finally {
      setBusy('');
    }
  };

  const removeDocument = (documentId) => {
    setDraft((previous) => ({ ...previous, documents: previous.documents.filter((document) => document.id !== documentId) }));
    setMessage('Documento retirado del formulario. Guarda el borrador para confirmar el cambio.');
  };

  return <div className="editorial-editor">
    <aside className="editorial-list" aria-label={kind === 'grants' ? 'Ayudas existentes' : 'Convocatorias existentes'}>
      <button type="button" className="button button-full" onClick={() => select(NEW_ITEM)}><Plus size={16} />Nueva {label}</button>
      <div className="editorial-list-scroll">
        {items.map((entry) => <button type="button" key={entry.draft.id} className={selectedId === entry.draft.id ? 'selected' : ''} onClick={() => select(entry.draft.id)}>
          <span>{kind === 'grants' ? <Megaphone size={16} /> : <BriefcaseBusiness size={16} />}</span>
          <span><strong>{entry.draft.title}</strong><small>{statusNames[entry.status]}{entry.hasUnpublishedChanges ? ' · con cambios' : ''}</small></span>
        </button>)}
      </div>
    </aside>

    <div className="editorial-workspace">
      <div className="editor-state-bar">
        <span>{isNew ? `Nueva ${label}` : `${statusNames[current?.status] || 'Borrador'} · versión ${current?.version}`}</span>
        <span className={dirty || current?.hasUnpublishedChanges ? 'state-dot pending' : 'state-dot'}>{dirty ? 'Cambios sin guardar' : current?.hasUnpublishedChanges ? 'Pendiente de publicar' : 'Sin cambios pendientes'}</span>
      </div>

      <form className="admin-card editorial-fields" onSubmit={save}>
        <div className="admin-card-title">{kind === 'grants' ? <Megaphone size={21} /> : <BriefcaseBusiness size={21} />}<div><h2>{isNew ? `Crear ${label}` : 'Editar contenido'}</h2><p>Guarda primero un borrador. Nada se mostrará en la web hasta que lo publiques.</p></div></div>
        <div className="form-row">
          <label>Identificador estable<input value={draft.id} onChange={(event) => { setIdLocked(true); update('id', event.target.value); }} disabled={!isNew} maxLength={160} required /><small>{isNew ? 'Se creará desde el título; no uses barras.' : 'No se puede cambiar: conserva sus enlaces y anclas.'}</small></label>
          {kind === 'grants' ? <label>Categoría<input value={draft.category} onChange={(event) => update('category', event.target.value)} maxLength={120} required /></label> : <label>Estado visible<input value={draft.statusLabel} onChange={(event) => update('statusLabel', event.target.value)} maxLength={100} required /></label>}
        </div>
        <label>Título<textarea rows="2" value={draft.title} onChange={(event) => update('title', event.target.value)} maxLength={240} required /></label>
        <label>{kind === 'grants' ? 'Resumen' : 'Descripción'}<textarea rows="4" value={kind === 'grants' ? draft.summary : draft.description} onChange={(event) => update(kind === 'grants' ? 'summary' : 'description', event.target.value)} maxLength={1200} required /></label>
        <div className="form-row">
          <label>Fecha de publicación<input type="date" value={draft.publicationDate || ''} onChange={(event) => update('publicationDate', event.target.value || null)} required={kind === 'grants'} /></label>
          <label>Fecha de vencimiento<input type="date" value={draft.deadlineDate || ''} onChange={(event) => update('deadlineDate', event.target.value || null)} /></label>
        </div>
        {kind === 'grants' ? <>
          <div className="form-row"><label>Etiqueta del vencimiento<input value={draft.deadlineLabel} onChange={(event) => update('deadlineLabel', event.target.value)} maxLength={100} required /></label><label>Contenido actualizado el<input type="date" value={draft.contentUpdatedAt || ''} onChange={(event) => update('contentUpdatedAt', event.target.value || null)} /></label></div>
          <label>Nota informativa<textarea rows="4" value={draft.note} onChange={(event) => update('note', event.target.value)} maxLength={2400} /></label>
          <div className="form-row"><label>Fuente oficial (HTTPS)<input type="url" value={draft.sourceUrl || ''} onChange={(event) => update('sourceUrl', event.target.value || null)} placeholder="https://…" maxLength={1000} /></label><label>Texto de la fuente<input value={draft.sourceLabel} onChange={(event) => update('sourceLabel', event.target.value)} maxLength={180} /></label></div>
          <label>Icono<select value={draft.icon} onChange={(event) => update('icon', event.target.value)}><option value="Megaphone">Convocatoria</option><option value="Accessibility">Accesibilidad</option><option value="HeartHandshake">Apoyo social</option><option value="KeyRound">Primera vivienda</option><option value="Building2">Edificación</option></select></label>
        </> : <label>Agrupación en la web<select value={draft.displayGroup} onChange={(event) => update('displayGroup', event.target.value)}><option value="current">Convocatorias actuales</option><option value="archive">Histórico visible</option></select></label>}
        <div className="editorial-form-actions">
          <button type="submit" className="button button-secondary" disabled={Boolean(busy) || (!isNew && !dirty)}><Save size={16} />{busy === 'save' ? 'Guardando…' : 'Guardar borrador'}</button>
          {!isNew && <>
            <button type="button" className="button button-quiet" onClick={() => setShowHistory((value) => !value)} disabled={Boolean(busy)}><History size={16} />Historial</button>
            <button type="button" className="button" onClick={publish} disabled={Boolean(busy) || dirty} title={dirty ? 'Guarda primero el borrador' : ''}><Send size={16} />{busy === 'publish' ? 'Publicando…' : current?.status === 'archived' ? 'Volver a publicar' : 'Publicar'}</button>
          </>}
        </div>
      </form>

      {!isNew && <>
        <section className="admin-card admin-documents">
          <div className="admin-card-title"><FileText size={21} /><div><h2>Documentos PDF</h2><p>Los archivos añadidos o retirados solo cambian la web al publicar el borrador.</p></div></div>
          <div className="document-admin-actions">
            <button type="button" className="button button-secondary" onClick={() => openUpload('bases')} disabled={Boolean(busy) || dirty}><Upload size={16} />Subir PDF</button>
            {kind === 'jobs' && <button type="button" className="button" onClick={() => openUpload('resultado')} disabled={Boolean(busy) || dirty}><FilePlus2 size={16} />Añadir resultado</button>}
          </div>
          {dirty && <p className="editor-help">Guarda los cambios del formulario antes de gestionar documentos.</p>}
          {showUpload && <form className="upload-panel" onSubmit={uploadDocument}>
            <div className="upload-heading"><div><strong>{upload.kind === 'resultado' ? 'Añadir resultado a esta convocatoria' : 'Subir documento al borrador'}</strong><small>PDF real · máximo 15 MB · privado hasta publicar</small></div><button type="button" className="icon-button" onClick={() => setShowUpload(false)} aria-label="Cerrar subida"><X size={18} /></button></div>
            <label>Archivo PDF<input type="file" accept="application/pdf,.pdf" onChange={(event) => { const selected = event.target.files[0] || null; setFile(selected); if (selected && !upload.title) setUpload((previous) => ({ ...previous, title: selected.name.replace(/\.pdf$/i, '') })); }} required /></label>
            <div className="form-row"><label>Título del documento<input value={upload.title} onChange={(event) => setUpload((previous) => ({ ...previous, title: event.target.value }))} maxLength={220} required /></label><label>Tipo<select value={upload.kind} onChange={(event) => setUpload((previous) => ({ ...previous, kind: event.target.value }))}>{Object.entries(documentKinds).map(([value, text]) => <option value={value} key={value}>{text}</option>)}</select></label></div>
            <label>Descripción<textarea rows="2" value={upload.description} onChange={(event) => setUpload((previous) => ({ ...previous, description: event.target.value }))} maxLength={600} /></label>
            <label>Número de páginas (opcional)<input type="number" min="1" max="10000" value={upload.pages} onChange={(event) => setUpload((previous) => ({ ...previous, pages: event.target.value }))} /></label>
            <button type="submit" className="button" disabled={Boolean(busy)}><Upload size={16} />{busy === 'upload' ? 'Subiendo…' : 'Añadir PDF al borrador'}</button>
          </form>}
          <div className="admin-document-list">
            {draft.documents.length === 0 && <p className="admin-empty">Todavía no hay documentos en este borrador.</p>}
            {draft.documents.map((document) => {
              const isPublic = document.source === 'legacy' || (current?.status === 'published' && current.published?.documents.some((entry) => entry.id === document.id));
              return <article className="admin-document-row" key={document.id}>
                <span className="document-kind-icon"><FileText size={19} /></span>
                <div><strong>{document.title}</strong><small>{documentKinds[document.kind]} · PDF{document.pages ? ` · ${document.pages} páginas` : ''}{document.source === 'uploaded' && !isPublic ? ' · privado' : ''}</small>{document.description && <p>{document.description}</p>}</div>
                <div className="document-row-actions">
                  {isPublic && <a href={document.url} target="_blank" rel="noreferrer" aria-label={`Abrir ${document.title}`}><ArrowUpRight size={17} /></a>}
                  <button type="button" className="icon-button danger" onClick={() => removeDocument(document.id)} aria-label={`Quitar ${document.title} del borrador`} title="Quitar del borrador"><Trash2 size={17} /></button>
                </div>
              </article>;
            })}
          </div>
        </section>

        <div className="editorial-bottom-bar">
          <div>{current?.status === 'published' && <Link to={`${publicBase}#${current.draft.id}`} className="text-link">Ver en la web<ArrowUpRight size={15} /></Link>}</div>
          <button type="button" className="button button-quiet danger-text" onClick={archive} disabled={Boolean(busy) || dirty || current?.status === 'archived'}><Archive size={16} />{busy === 'archive' ? 'Archivando…' : 'Archivar y ocultar'}</button>
        </div>
        {showHistory && <ItemHistory kind={kind} item={current} request={request} onSaved={onSaved} />}
      </>}

      {message && <div className="form-status admin-saved" role="status"><Check size={18} />{message}</div>}
      {error && <div className="form-status admin-error" role="alert">{error}</div>}
    </div>
  </div>;
}
