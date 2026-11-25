import { Link } from "react-router-dom";
import { ArrowRight, Heart, Home, ClipboardList } from "lucide-react";
import { IMG, REGISTRO_URL } from "@/data/content";

export const HeroB = () => (
  <section id="inicio" data-testid="hero-section" className="relative -mt-20 pt-32 pb-20 lg:pb-28 overflow-hidden">
    <div className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-[#00c18c]/15 blur-3xl" aria-hidden />
    <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-12 items-center relative">
      <div className="lg:col-span-6">
        <span className="rise inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--hemsa-dark)] shadow-sm">
          <Heart className="h-4 w-4 text-[var(--hemsa-accent)] fill-[var(--hemsa-accent)]" /> Tu empresa municipal en La Isla
        </span>
        <h1 className="rise d1 mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight text-[var(--hemsa-ink)]">
          Cerca de ti, <span className="text-[var(--hemsa)]">en cada etapa</span> de la vida
        </h1>
        <p className="rise d2 mt-6 text-base sm:text-lg text-[var(--hemsa-grey)] leading-relaxed max-w-lg">
          Te ayudamos a encontrar casa, a vender la tuya y a cuidar de tus mayores en su hogar. Somos HEMSA, y estamos aquí para las personas de San Fernando.
        </p>
        <div className="rise d3 mt-10 flex flex-wrap gap-3">
          <Link to="/cita-previa" data-testid="hero-cita-button" className="inline-flex items-center gap-2 rounded-full bg-[var(--hemsa)] hover:bg-[var(--hemsa-dark)] text-white font-semibold px-7 h-14 shadow-lg shadow-[#00805e]/25 transition-colors">
            Pide tu cita previa <ArrowRight className="h-5 w-5" />
          </Link>
          <a href="#servicios" data-testid="hero-services-button" className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-[var(--hemsa-mist)] text-[var(--hemsa-dark)] font-semibold px-7 h-14 transition-colors">
            Cómo te ayudamos
          </a>
          <a href={REGISTRO_URL} target="_blank" rel="noreferrer" data-testid="hero-registro-button" className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--hemsa)] text-[var(--hemsa-dark)] hover:bg-[var(--hemsa)] hover:text-white font-semibold px-7 h-14 transition-colors">
            <ClipboardList className="h-5 w-5" /> Registro de Vivienda Protegida
          </a>
        </div>
      </div>
      <div className="lg:col-span-6 relative rise d2">
        <div className="rounded-[2.5rem] overflow-hidden aspect-[4/3.4] shadow-2xl shadow-[#00805e]/20">
          <img src={IMG.cuidado} alt="Una auxiliar del servicio de ayuda a domicilio ríe junto a una vecina" className="h-full w-full object-cover" />
        </div>
        <div className="absolute -left-4 sm:-left-10 bottom-10 bg-white rounded-3xl shadow-xl p-5 flex items-center gap-4 max-w-[260px]">
          <span className="h-12 w-12 rounded-2xl bg-[var(--hemsa-mist)] grid place-items-center"><Home className="h-6 w-6 text-[var(--hemsa)]" /></span>
          <p className="text-sm font-semibold text-[var(--hemsa-ink)] leading-snug">Vivienda asequible para familias isleñas</p>
        </div>
        <div className="absolute -right-2 sm:-right-6 top-8 bg-[var(--hemsa)] text-white rounded-3xl shadow-xl px-5 py-4">
          <p className="text-3xl font-bold">30</p>
          <p className="text-xs text-white/85">años al servicio de La Isla</p>
        </div>
      </div>
    </div>
  </section>
);
