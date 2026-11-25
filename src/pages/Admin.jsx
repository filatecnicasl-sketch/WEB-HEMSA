import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowUpRight, Bell, BriefcaseBusiness, Database, FileText,
  History, Home, LayoutDashboard, LockKeyhole, LogOut, Megaphone,
  Settings, ShieldCheck,
} from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { ADMIN_SESSION_KEY, apiRequest, readableError } from '../lib/api';
import ContentEditor from '../components/admin/ContentEditor';
import EditorialEditor from '../components/admin/EditorialEditor';
import HistoryPanel from '../components/admin/HistoryPanel';
import '../styles/admin.css';

const sections = [
  { id: 'inicio', label: 'Inicio y aviso', icon: Home, title: 'Editar Inicio y aviso destacado', text: 'Modifica el primer mensaje de la web y controla cuándo se publica.' },
  { id: 'grants', label: 'Ayudas y subvenciones', icon: Megaphone, title: 'Gestionar ayudas y subvenciones', text: 'Crea noticias, actualiza plazos y reúne la documentación de cada expediente.' },
  { id: 'jobs', label: 'Empleo', icon: BriefcaseBusiness, title: 'Gestionar empleo y convocatorias', text: 'Publica convocatorias y añade listados o resultados al mismo proceso.' },
  { id: 'contacto', label: 'Contacto', icon: Settings, title: 'Editar datos de contacto', text: 'Actualiza los datos generales de atención a la ciudadanía.' },
  { id: 'history', label: 'Historial general', icon: History, title: 'Historial y copias de seguridad', text: 'Recupera versiones anteriores de Inicio y Contacto sin publicar automáticamente.' },
];

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const session = await apiRequest('/api/auth/login', { method: 'POST', body: { email, password } });
      sessionStorage.setItem(ADMIN_SESSION_KEY, session.token);
      onLogin(session);
    } catch (reason) {
      setError(readableError(reason));
    } finally {
      setBusy(false);
    }
  };

  return <section className="admin-login-page">
    <div className="admin-login-card">
      <Link to="/" className="admin-login-brand"><img src="/images/hemsa-simbolo.webp" alt="" /><img src="/images/hemsa-texto.webp" alt="HEMSA" /></Link>
      <span className="admin-login-icon"><LockKeyhole size={26} /></span>
      <span className="eyebrow">Acceso personal</span>
      <h1>Gestor de contenidos</h1>
      <p>Accede para editar y publicar los contenidos de la web.</p>
      <form onSubmit={submit}>
        <label>Correo electrónico<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={160} required autoFocus /></label>
        <label>Contraseña<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} maxLength={256} required /></label>
        {error && <div className="form-status admin-error" role="alert">{error}</div>}
        <button type="submit" className="button button-full" disabled={busy}>{busy ? 'Comprobando…' : 'Entrar al gestor'}<ArrowUpRight size={17} /></button>
      </form>
      <small className="admin-login-security"><ShieldCheck size={15} />La sesión se guarda solo en esta pestaña y caduca automáticamente.</small>
      <Link to="/" className="admin-back"><ArrowLeft size={16} />Volver a la web</Link>
    </div>
  </section>;
}

export default function Admin() {
  const { refreshContent } = useSite();
  const [token, setToken] = useState(() => sessionStorage.getItem(ADMIN_SESSION_KEY) || '');
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(token));
  const [active, setActive] = useState('inicio');
  const [contentState, setContentState] = useState(null);
  const [collections, setCollections] = useState({ grants: [], jobs: [] });
  const [dataError, setDataError] = useState('');

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setToken('');
    setUser(null);
    setContentState(null);
  }, []);

  const request = useCallback(async (path, options = {}) => {
    try {
      return await apiRequest(path, { ...options, token });
    } catch (error) {
      if (error.status === 401) clearSession();
      throw error;
    }
  }, [token, clearSession]);

  const loadData = useCallback(async () => {
    setDataError('');
    try {
      const [content, grants, jobs] = await Promise.all([
        request('/api/admin/content'), request('/api/admin/grants'), request('/api/admin/jobs'),
      ]);
      setContentState(content);
      setCollections({ grants: grants.items, jobs: jobs.items });
    } catch (error) {
      setDataError(readableError(error));
    }
  }, [request]);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    let activeRequest = true;
    setChecking(true);
    request('/api/auth/me')
      .then((data) => {
        if (activeRequest) setUser(data.user);
        return loadData();
      })
      .catch(() => {})
      .finally(() => { if (activeRequest) setChecking(false); });
    return () => { activeRequest = false; };
  }, [token, request, loadData]);

  const logout = async () => {
    try { await request('/api/auth/logout', { method: 'POST' }); } catch { /* La sesión local también se cierra. */ }
    clearSession();
  };

  const editorialSaved = useCallback((kind, item) => {
    setCollections((previous) => {
      const exists = previous[kind].some((entry) => entry.draft.id === item.draft.id);
      return {
        ...previous,
        [kind]: exists
          ? previous[kind].map((entry) => entry.draft.id === item.draft.id ? item : entry)
          : [...previous[kind], item],
      };
    });
  }, []);

  if (!token || !user) {
    if (token && checking) return <section className="admin-login-page"><p className="admin-loading">Comprobando la sesión…</p></section>;
    return <Login onLogin={(session) => { setUser(session.user); setToken(session.token); }} />;
  }

  const section = sections.find((item) => item.id === active) || sections[0];

  return <section className="admin-page">
    <div className="container admin-shell">
      <aside className="admin-sidebar">
        <span className="admin-logo"><LayoutDashboard size={23} /></span>
        <div><strong>Gestor HEMSA</strong><small>Servidor local</small></div>
        <nav aria-label="Secciones del gestor">
          {sections.map(({ id, label, icon: Icon }) => <button type="button" key={id} className={active === id ? 'active' : ''} onClick={() => setActive(id)}><Icon size={17} />{label}</button>)}
        </nav>
        <div className="admin-user"><small>Sesión iniciada como</small><strong>{user.email}</strong></div>
        <button type="button" className="admin-logout" onClick={logout}><LogOut size={16} />Cerrar sesión</button>
        <Link to="/" className="admin-back"><ArrowLeft size={16} />Volver a la web</Link>
      </aside>

      <div className="admin-main">
        <div className="admin-heading"><div><span className="eyebrow">Panel de administración · entorno local</span><h1>{section.title}</h1><p>{section.text}</p></div><Link to="/" className="button button-secondary">Ver la web<ArrowUpRight size={16} /></Link></div>
        <div className="local-demo-notice"><Database size={20} /><p><strong>Datos guardados en este equipo:</strong> los borradores son privados y la web pública solo cambia al pulsar «Publicar». Nada se está enviando a un servidor en la nube.</p></div>

        {dataError && <div className="form-status admin-error" role="alert">{dataError}<button type="button" className="button button-small" onClick={loadData}>Reintentar</button></div>}
        {checking || !contentState ? <p className="admin-loading">Cargando contenidos…</p> : <>
          {(active === 'inicio' || active === 'contacto') && <ContentEditor section={active} state={contentState} request={request} onState={setContentState} onPublished={refreshContent} />}
          {(active === 'grants' || active === 'jobs') && <EditorialEditor key={active} kind={active} items={collections[active]} request={request} onSaved={editorialSaved} />}
          {active === 'history' && <HistoryPanel state={contentState} request={request} onState={setContentState} />}
        </>}
      </div>
    </div>
  </section>;
}
