import { Link } from "react-router-dom";
import { ArrowUpRight, Mail, Phone, MapPin } from "lucide-react";
import { LINKS, LEGAL, CONTACT } from "@/data/content";
import { BrandB } from "@/components/site/HeaderB";

export const FooterB = () => (
  <footer data-testid="main-footer" className="bg-[var(--hemsa)] text-white rounded-t-[3rem] relative grain overflow-hidden">
    <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-10 grid lg:grid-cols-12 gap-12 relative">
      <div className="lg:col-span-4">
        <BrandB light />
        <p className="mt-6 text-white/85 text-sm leading-relaxed max-w-xs">Empresa pública del Ayuntamiento de San Fernando al servicio de las personas.</p>
        <div className="mt-6 space-y-2 text-sm">
          <a href={`tel:${CONTACT.phoneHref}`} className="flex items-center gap-2 hover:text-[var(--hemsa-accent)]"><Phone className="h-4 w-4" />{CONTACT.phone}</a>
          <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2 hover:text-[var(--hemsa-accent)]"><Mail className="h-4 w-4" />{CONTACT.email}</a>
          <p className="flex items-start gap-2 text-white/85"><MapPin className="h-4 w-4 mt-0.5 shrink-0" />{CONTACT.address}</p>
        </div>
      </div>
      <div className="lg:col-span-8">
        <h2 className="font-bold">Enlaces de interés</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          {LINKS.map((l, i) => (
            <a key={l.href} href={l.href} target="_blank" rel="noreferrer" data-testid={`footer-link-${i}`} className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white hover:text-[var(--hemsa-dark)] px-5 py-3 text-sm font-medium transition-colors">
              {l.label} <ArrowUpRight className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
      <div className="lg:col-span-12 border-t border-white/20 pt-6 flex flex-col sm:flex-row justify-between gap-3 text-xs text-white/80">
        <span>© {new Date().getFullYear()} Todos los derechos reservados, Hemsa San Fernando</span>
        <div className="flex gap-5">
          {LEGAL.map((l) => <Link key={l.label} to={l.href} data-testid={`legal-link-${l.href.slice(1)}`} className="hover:text-white hover:underline underline-offset-4">{l.label}</Link>)}
          <Link to="/admin" data-testid="footer-admin-link" className="hover:text-white hover:underline underline-offset-4">Acceso personal</Link>
        </div>
      </div>
    </div>
  </footer>
);
