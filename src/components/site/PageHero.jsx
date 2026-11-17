import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export const PageHero = ({ eyebrow, title, intro, img, imgAlt, children }) => (
  <section data-testid="page-hero" className="relative -mt-20 pt-32 pb-16 lg:pb-20 overflow-hidden">
    <div className="absolute -top-40 -right-40 h-[480px] w-[480px] rounded-full bg-[#00c18c]/15 blur-3xl" aria-hidden />
    <div className="max-w-7xl mx-auto px-6 lg:px-10 relative">
      <nav aria-label="Ruta" className="flex items-center gap-1.5 text-sm text-[var(--hemsa-grey)]" data-testid="breadcrumb">
        <Link to="/" className="hover:text-[var(--hemsa)]">Inicio</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[var(--hemsa-dark)] font-medium">{eyebrow}</span>
      </nav>
      <div className={`mt-8 grid gap-12 items-center ${img ? "lg:grid-cols-12" : ""}`}>
        <div className={img ? "lg:col-span-6" : "max-w-3xl"}>
          <h1 data-testid="page-title" className="rise text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight text-[var(--hemsa-ink)]">{title}</h1>
          {intro && <p className="rise d1 mt-6 text-base sm:text-lg text-[var(--hemsa-grey)] leading-relaxed max-w-xl">{intro}</p>}
          {children && <div className="rise d2 mt-8 flex flex-wrap gap-3">{children}</div>}
        </div>
        {img && (
          <div className="lg:col-span-6 rise d2">
            <div className="rounded-[2.5rem] overflow-hidden aspect-[4/3] shadow-2xl shadow-[#00805e]/20 bg-white">
              <img src={img} alt={imgAlt || ""} className="h-full w-full object-cover" />
            </div>
          </div>
        )}
      </div>
    </div>
  </section>
);
