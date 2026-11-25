import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { CalendarHeart, Menu, X } from "lucide-react";
import { IMG } from "@/data/content";

const NAV = [
  ["Vivienda", "/promociones-vivienda"],
  ["Garajes y trasteros", "/garajes-trasteros"],
  ["Vender mi vivienda", "/hemsa-compra-viviendas"],
  ["Ayuda a domicilio", "/ayuda-domicilio"],
  ["Quiénes somos", "/#historia"],
];
const slug = (l) => l.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, "-");
const navCls = ({ isActive }) => `px-3.5 py-2 rounded-full transition-colors ${isActive ? "bg-[var(--hemsa-mist)] text-[var(--hemsa-dark)]" : "hover:bg-[var(--hemsa-mist)] hover:text-[var(--hemsa-dark)]"}`;

export const BrandB = ({ light = false }) => (
  <span className="flex items-center gap-3">
    <img src={IMG.mark} alt="" aria-hidden className="h-11 w-11 rounded-full" />
    <span className="leading-none">
      <span className={`block text-2xl font-bold tracking-tight ${light ? "text-white" : "text-[var(--hemsa-accent)]"}`} style={{ color: light ? undefined : "#00A878" }}>Hemsa</span>
      <span className={`block text-[11px] font-semibold mt-1 ${light ? "text-white/80" : "text-[var(--hemsa-grey)]"}`}>Servicios Públicos Municipales · San Fernando</span>
    </span>
  </span>
);

export const HeaderB = () => {
  const [open, setOpen] = useState(false);
  return (
    <header data-testid="main-header" className="sticky top-3 z-30 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto bg-white/85 backdrop-blur-xl rounded-full shadow-[0_8px_30px_rgba(0,128,94,0.12)] border border-white pl-4 pr-2 h-16 flex items-center justify-between">
        <Link to="/" data-testid="header-logo-link" aria-label="HEMSA inicio"><BrandB /></Link>
        <nav className="hidden xl:flex items-center gap-0.5 text-sm font-medium text-[var(--hemsa-grey)]">
          {NAV.map(([l, h]) => (
            <NavLink key={l} to={h} end data-testid={`nav-${slug(l)}`} className={(s) => navCls({ isActive: s.isActive && !h.includes("#") })}>{l}</NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <Link to="/cita-previa" data-testid="header-cita-button" aria-label="Pide tu cita previa" className="inline-flex items-center gap-2 rounded-full bg-[var(--hemsa)] hover:bg-[var(--hemsa-dark)] text-white text-sm font-semibold px-5 h-12 transition-colors">
            <CalendarHeart className="h-4 w-4" /> <span className="hidden sm:inline">Pide tu cita</span>
          </Link>
          <button data-testid="mobile-menu-toggle" className="xl:hidden p-3" onClick={() => setOpen(!open)} aria-label="Menú">{open ? <X /> : <Menu />}</button>
        </div>
      </div>
      {open && (
        <nav data-testid="mobile-menu" className="xl:hidden mt-2 max-w-7xl mx-auto bg-white rounded-3xl shadow-lg p-4 grid gap-1">
          {NAV.map(([l, h]) => <Link key={l} to={h} data-testid={`mobile-nav-${slug(l)}`} onClick={() => setOpen(false)} className="px-4 py-3 rounded-2xl font-medium hover:bg-[var(--hemsa-mist)]">{l}</Link>)}
        </nav>
      )}
    </header>
  );
};
