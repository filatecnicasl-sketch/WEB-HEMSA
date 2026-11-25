import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ArrowUpRight, CalendarDays, ChevronDown, ChevronRight, Cookie, ExternalLink,
  Mail, MapPin, Menu, Phone, Type, X,
} from 'lucide-react';
import { useSite } from '../context/SiteContext';

const navigation = [
  { label: 'Inicio', to: '/', end: true },
  {
    label: 'Áreas de actuación', to: '/servicios',
    children: [
      { label: 'Viviendas', to: '/vivienda' },
      { label: 'Garajes y trasteros', to: '/garajes-trasteros' },
      { label: 'Ayuda a domicilio', to: '/ayuda-a-domicilio' },
      { label: 'Parcelas en Fadricas II', to: '/servicios#locales' },
      { label: 'Registro de demandantes', to: '/vivienda/registro' },
    ],
  },
  { label: 'Ayudas y subvenciones', to: '/ayudas-y-subvenciones' },
  {
    label: 'Transparencia', to: '/transparencia',
    children: [
      { label: 'Información institucional y organizativa', to: '/transparencia#institucional' },
      {
        label: 'Contratos, convenios y subvenciones', to: '/transparencia#contratacion',
        children: [
          { label: 'Contratos', to: '/transparencia#contratos' },
          { label: 'Contratos menores', to: '/transparencia#contratos-menores' },
          { label: 'Convenios y subvenciones', to: '/transparencia#convenios' },
        ],
      },
      {
        label: 'Información económica y presupuestaria', to: '/transparencia#economica',
        children: [
          { label: 'Presupuestos', to: '/transparencia#presupuestos' },
          { label: 'Cuentas anuales', to: '/transparencia#cuentas' },
          { label: 'Control financiero y auditorías', to: '/transparencia#control-financiero-auditorias' },
          { label: 'Gastos públicos en publicidad', to: '/transparencia#gastos-publicidad' },
        ],
      },
      { label: 'Canal de denuncias', to: 'https://whistleblowersoftware.com/secure/canaldenunciashemsa', external: true },
    ],
  },
  { label: 'Empleo', to: '/empleo' },
  { label: 'Sobre nosotros', to: '/sobre-nosotros' },
  { label: 'Contacto', to: '/contacto' },
];

function Destination({ item, className, children }) {
  if (item.external) {
    return <a href={item.to} className={className} target="_blank" rel="noreferrer">{children || item.label}</a>;
  }
  return <Link to={item.to} className={className}>{children || item.label}</Link>;
}

function TopDestination({ item }) {
  const content = <>{item.label}{item.children && <ChevronDown size={12} aria-hidden="true" />}</>;
  if (item.external) return <a href={item.to} className="nav-link" target="_blank" rel="noreferrer">{content}</a>;
  return <NavLink to={item.to} end={item.end} className="nav-link">{content}</NavLink>;
}

export default function Layout() {
  const { content } = useSite();
  const [menuOpen, setMenuOpen] = useState(false);
  const [largeText, setLargeText] = useState(() => localStorage.getItem('hemsa-large-text') === 'true');
  const [showCookies, setShowCookies] = useState(() => localStorage.getItem('hemsa-cookie-choice') !== 'accepted');
  const location = useLocation();

  useEffect(() => { setMenuOpen(false); }, [location.pathname, location.hash]);
  useEffect(() => {
    document.documentElement.classList.toggle('large-text', largeText);
    localStorage.setItem('hemsa-large-text', String(largeText));
  }, [largeText]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const acceptCookies = () => {
    localStorage.setItem('hemsa-cookie-choice', 'accepted');
    setShowCookies(false);
  };

  return (
    <div className="site-shell">
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <header className="main-header">
        <div className="container header-inner">
          <Link to="/" className="brand" aria-label="HEMSA San Fernando, inicio"><img className="brand-symbol" src="/images/hemsa-simbolo.webp" alt="" /><img className="brand-wordmark" src="/images/hemsa-texto.webp" alt="Hemsa" /></Link>
          <nav className="desktop-nav" aria-label="Navegación principal">
            {navigation.map((item) => (
              <div className={`nav-item${item.children ? ' has-children' : ''}`} key={item.label}>
                <TopDestination item={item} />
                {item.children && (
                  <div className="dropdown">
                    {item.children.map((child) => (
                      <div className={child.children ? 'dropdown-item has-children' : 'dropdown-item'} key={child.label}>
                        <Destination item={child}>{child.label}{child.children && <ChevronRight size={13} aria-hidden="true" />}</Destination>
                        {child.children && (
                          <div className="dropdown dropdown-nested">
                            {child.children.map((grandchild) => <Destination item={grandchild} key={grandchild.label} />)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <Link to="/cita-previa" className="button button-sm header-cta"><CalendarDays size={16} />Pide tu cita</Link>
          <button type="button" className="mobile-menu-button" aria-expanded={menuOpen} aria-controls="mobile-menu" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setMenuOpen((value) => !value)}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
      </header>

      {content.notice.enabled && <div className="notice-bar"><div className="container notice-inner"><span className="notice-label">{content.notice.label}</span><Link to={content.notice.link}>{content.notice.text}<ArrowUpRight size={14} /></Link></div></div>}

      {menuOpen && (
        <div className="mobile-menu" id="mobile-menu">
          <nav className="container" aria-label="Navegación móvil">
            {navigation.map((item) => (
              <div className="nav-item" key={item.label}>
                <Destination item={item} className="nav-link"><span>{item.label}</span>{item.children ? <ChevronDown size={16} /> : <ArrowUpRight size={17} />}</Destination>
                {item.children && (
                  <div className="mobile-submenu">
                    {item.children.map((child) => (
                      <div className={child.children ? 'mobile-nav-group' : ''} key={child.label}>
                        <Destination item={child}>{child.label}{child.children && <ChevronRight size={13} />}</Destination>
                        {child.children && (
                          <div className="mobile-submenu mobile-submenu-nested">
                            {child.children.map((grandchild) => <Destination item={grandchild} key={grandchild.label} />)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Link to="/cita-previa" className="button"><CalendarDays size={18} />Solicitar cita previa</Link>
            <button type="button" className="mobile-text-size" onClick={() => setLargeText((value) => !value)}><Type size={17} />{largeText ? 'Usar texto normal' : 'Aumentar tamaño del texto'}</button>
          </nav>
        </div>
      )}

      <main id="contenido"><Outlet /></main>

      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <span className="footer-kicker">Empresa pública municipal</span>
            <div className="footer-logo" aria-label="HEMSA San Fernando">
              <img className="footer-brand-symbol" src="/images/hemsa-simbolo-transparente.png?v=2" alt="" />
              <img className="footer-brand-wordmark" src="/images/hemsa-texto-transparente.png?v=2" alt="Hemsa" />
            </div>
            <p>Empresa pública del Ayuntamiento de San Fernando al servicio de las personas.</p>
          </div>

          <nav className="footer-column footer-interest" aria-label="Enlaces de interés">
            <h2>Enlaces de interés</h2>
            <div className="footer-links">
              <a href="https://www.juntadeandalucia.es/organismos/fomentoinfraestructurasyordenaciondelterritorio.html" target="_blank" rel="noreferrer"><span>Consejería de Fomento, Infraestructuras y Ordenación del Territorio</span><ExternalLink size={13} aria-hidden="true" /></a>
              <a href="https://www.mivau.gob.es/" target="_blank" rel="noreferrer"><span>Ministerio de Vivienda y Agenda Urbana</span><ExternalLink size={13} aria-hidden="true" /></a>
              <a href="https://www.sanfernando.es/ayto/" target="_blank" rel="noreferrer"><span>Ayuntamiento de San Fernando</span><ExternalLink size={13} aria-hidden="true" /></a>
              <Link to="/transparencia"><span>Perfil contratante HEMSA</span><ArrowUpRight size={14} aria-hidden="true" /></Link>
              <a href="/documents/transparencia/estatutos-hemsa.pdf" target="_blank" rel="noreferrer"><span>Estatutos HEMSA refundidos</span><ExternalLink size={13} aria-hidden="true" /></a>
              <Link to="/empleo"><span>Empleo y convocatorias</span><ArrowUpRight size={14} aria-hidden="true" /></Link>
            </div>
          </nav>

          <div className="footer-column footer-contact">
            <h2>Contacto</h2>
            <a href={`tel:${content.contact.phone.replaceAll(' ', '')}`}>
              <Phone size={17} aria-hidden="true" />
              <span><small>Teléfono</small>{content.contact.phone}</span>
            </a>
            <a href={`mailto:${content.contact.email}`}>
              <Mail size={17} aria-hidden="true" />
              <span><small>Correo electrónico</small>{content.contact.email}</span>
            </a>
            <p>
              <MapPin size={17} aria-hidden="true" />
              <span><small>Dirección</small>{content.contact.address}</span>
            </p>
            <Link to="/cita-previa" className="footer-appointment">Pide tu cita<ArrowUpRight size={15} aria-hidden="true" /></Link>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© 2026 HEMSA San Fernando. Todos los derechos reservados.</span>
          <div className="footer-credit">
            <span>Creada por</span>
            <a href="https://filanex.es/" target="_blank" rel="noreferrer" aria-label="Visitar la web de Filanex">
              <img src="/images/filanex.svg" alt="" />
              <span className="footer-filanex-word">FILANE<span className="footer-filanex-x">X</span></span>
            </a>
          </div>
          <div className="footer-legal">
            <Link to="/aviso-legal">Aviso legal</Link>
            <Link to="/cookies">Política de cookies</Link>
            <a href="/documents/otros/politica-privacidad-pagina-web-rgpd-hemsa.pdf" target="_blank" rel="noreferrer">Política de privacidad</a>
            <Link to="/gestor" className="admin-link">Acceso personal</Link>
          </div>
        </div>
      </footer>

      {showCookies && <aside className="cookie-banner" aria-label="Aviso de privacidad"><Cookie size={22} /><button type="button" className="cookie-close" onClick={acceptCookies} aria-label="Cerrar aviso"><X size={16} /></button><p>Este sitio utiliza almacenamiento local para recordar tus preferencias y ofrecerte una mejor experiencia. Consulta la <Link to="/cookies">política de cookies</Link>.</p><button type="button" className="button button-sm" onClick={acceptCookies}>Aceptar</button></aside>}
    </div>
  );
}
