import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  ArrowUpRight, CalendarDays, ExternalLink, Mail, MapPin, Menu, Phone, X,
} from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import DesignSwitcher from './DesignSwitcher';

const navigation = [
  { label: 'Vivienda', to: '/vivienda' },
  { label: 'Servicios', to: '/servicios' },
  { label: 'Transparencia', to: '/transparencia' },
  { label: 'Empleo', to: '/empleo' },
  { label: 'Contacto', to: '/contacto' },
];

export default function DesignShell({ variant, title, children }) {
  const { content } = useSite();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.title = `${title} | HEMSA San Fernando`;
  }, [title]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <div className={`design-page design-${variant}`}>
      <a className="skip-link" href="#design-content">Saltar al contenido</a>
      <div className="design-utility">
        <div className="design-wrap">
          <span>Empresa pública del Ayuntamiento de San Fernando</span>
          <div>
            <a href={`tel:${content.contact.phone.replaceAll(' ', '')}`}><Phone size={13} />{content.contact.phone}</a>
            <Link to="/transparencia">Acceso a la información</Link>
          </div>
        </div>
      </div>
      <header className="design-header">
        <div className="design-wrap design-header-inner">
          <Link to="/" className="design-brand" aria-label="HEMSA San Fernando, volver a la web actual">
            <img src="/images/hemsa-footer.jpg" alt="HEMSA. Servicios Públicos Municipales de San Fernando" />
          </Link>
          <nav className="design-desktop-nav" aria-label="Navegación principal">
            {navigation.map((item) => <NavLink key={item.to} to={item.to}>{item.label}</NavLink>)}
          </nav>
          <Link to="/cita-previa" className="design-header-cta"><CalendarDays size={17} />Cita previa</Link>
          <button
            className="design-menu-button"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="design-mobile-menu"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {menuOpen && (
          <nav id="design-mobile-menu" className="design-mobile-nav" aria-label="Navegación móvil">
            <div className="design-wrap">
              {navigation.map((item) => <Link key={item.to} to={item.to}>{item.label}<ArrowUpRight size={18} /></Link>)}
              <Link to="/cita-previa"><CalendarDays size={18} />Solicitar cita previa</Link>
            </div>
          </nav>
        )}
      </header>

      <main id="design-content">{children}</main>

      <footer className="design-footer">
        <div className="design-wrap design-footer-grid">
          <div className="design-footer-brand">
            <img src="/images/hemsa-footer.jpg" alt="HEMSA San Fernando" />
            <p>Servicios públicos para las personas y para el desarrollo de San Fernando.</p>
          </div>
          <div>
            <h2>Servicios</h2>
            <Link to="/vivienda">Vivienda protegida</Link>
            <Link to="/ayuda-a-domicilio">Ayuda a domicilio</Link>
            <Link to="/garajes-trasteros">Garajes y trasteros</Link>
            <Link to="/servicios#locales">Parcelas en Fadricas II</Link>
          </div>
          <div>
            <h2>HEMSA</h2>
            <Link to="/transparencia">Transparencia</Link>
            <Link to="/empleo">Empleo</Link>
            <Link to="/contacto">Contacto</Link>
            <a href="https://www.sanfernando.es/ayto/" target="_blank" rel="noreferrer">Ayuntamiento<ExternalLink size={12} /></a>
          </div>
          <div className="design-footer-contact">
            <h2>Estamos cerca</h2>
            <p><MapPin size={16} />{content.contact.address}</p>
            <a href={`tel:${content.contact.phone.replaceAll(' ', '')}`}><Phone size={15} />{content.contact.phone}</a>
            <a href={`mailto:${content.contact.email}`}><Mail size={15} />{content.contact.email}</a>
          </div>
        </div>
        <div className="design-wrap design-footer-bottom">
          <span>© 2026 HEMSA San Fernando</span>
          <span>Propuesta conceptual de diseño · Contenido y enlaces funcionales</span>
        </div>
      </footer>
      <DesignSwitcher />
    </div>
  );
}
