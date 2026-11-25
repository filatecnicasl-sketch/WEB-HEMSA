import { LayoutGrid } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

const proposals = [
  { number: '01', label: 'Horizonte', to: '/propuesta-1' },
  { number: '02', label: 'Pulso ciudadano', to: '/propuesta-2' },
  { number: '03', label: 'Cercanía', to: '/propuesta-3' },
  { number: '04', label: 'San Fernando Vivo', to: '/propuesta-4' },
];

export default function DesignSwitcher() {
  return (
    <nav className="design-switcher" aria-label="Comparar propuestas de portada">
      <Link to="/alternativas" className="design-switcher-all" aria-label="Volver a la comparativa">
        <LayoutGrid size={17} />
        <span>Comparativa</span>
      </Link>
      <span className="design-switcher-divider" aria-hidden="true" />
      {proposals.map((proposal) => (
        <NavLink
          key={proposal.to}
          to={proposal.to}
          className={({ isActive }) => `design-switcher-item ${isActive ? 'active' : ''}`}
          aria-label={`Propuesta ${proposal.number}: ${proposal.label}`}
          title={proposal.label}
        >
          <span>{proposal.number}</span>
          <small>{proposal.label}</small>
        </NavLink>
      ))}
    </nav>
  );
}
