import { ArrowUpRight, ClipboardList, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { REGISTRO_URL } from "@/data/content";

export const RegistroBand = () => (
  <section data-testid="registro-band" className="pb-4">
    <div className="max-w-7xl mx-auto px-6 lg:px-10">
      <div className="relative grain overflow-hidden rounded-[2.5rem] bg-[var(--hemsa-deep)] text-white p-8 sm:p-12 grid lg:grid-cols-12 gap-8 items-center">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#00c18c]/20 blur-3xl" aria-hidden />
        <div className="lg:col-span-1 relative">
          <span className="h-16 w-16 rounded-3xl bg-[var(--hemsa-accent)] text-[var(--hemsa-deep)] grid place-items-center"><ClipboardList className="h-8 w-8" /></span>
        </div>
        <div className="lg:col-span-7 relative">
          <p className="text-sm font-semibold text-[var(--hemsa-accent)] flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Plataforma online</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold">Registro Municipal de Demandantes de Vivienda Protegida</h2>
          <p className="mt-3 text-white/80 leading-relaxed max-w-2xl">Accede a la plataforma del Registro para gestionar las inscripciones de demandantes de vivienda protegida de San Fernando.</p>
        </div>
        <div className="lg:col-span-4 relative flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
          <a href={REGISTRO_URL} target="_blank" rel="noreferrer" data-testid="registro-band-button" className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--hemsa-accent)] text-[var(--hemsa-deep)] hover:bg-white font-semibold px-7 h-14 transition-colors">
            Acceder al Registro <ArrowUpRight className="h-5 w-5" />
          </a>
          <Link to="/registro-demandantes" data-testid="registro-band-info-link" className="inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 font-semibold px-7 h-14 transition-colors">
            Cómo inscribirse
          </Link>
        </div>
      </div>
    </div>
  </section>
);
