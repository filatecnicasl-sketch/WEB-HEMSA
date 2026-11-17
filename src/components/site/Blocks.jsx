import { Link } from "react-router-dom";
import { ArrowRight, FileText, Download, CheckCircle2 } from "lucide-react";
import { CONTACT } from "@/data/content";

export const PrimaryLink = ({ to, children, testId }) => (
  <Link to={to} data-testid={testId} className="inline-flex items-center gap-2 rounded-full bg-[var(--hemsa)] hover:bg-[var(--hemsa-dark)] text-white font-semibold px-7 h-14 shadow-lg shadow-[#00805e]/25 transition-colors">
    {children} <ArrowRight className="h-5 w-5" />
  </Link>
);

export const SoftLink = ({ href, to, children, testId }) => {
  const cls = "inline-flex items-center gap-2 rounded-full bg-white hover:bg-white/70 text-[var(--hemsa-dark)] font-semibold px-7 h-14 transition-colors";
  return to ? <Link to={to} data-testid={testId} className={cls}>{children}</Link> : <a href={href} data-testid={testId} className={cls}>{children}</a>;
};

export const Card = ({ children, className = "", testId }) => (
  <div data-testid={testId} className={`bg-white rounded-[2rem] p-7 sm:p-10 shadow-[0_10px_40px_rgba(0,128,94,0.08)] ${className}`}>{children}</div>
);

export const CheckList = ({ items, testId }) => (
  <ul data-testid={testId} className="space-y-4">
    {items.map((t) => (
      <li key={t} className="flex gap-3 text-[var(--hemsa-grey)] leading-relaxed">
        <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-[var(--hemsa)]" /> <span>{t}</span>
      </li>
    ))}
  </ul>
);

export const DocList = ({ docs }) => (
  <ul className="grid gap-3" data-testid="doc-list">
    {docs.map((d, i) => (
      <li key={d.href}>
        <a href={d.href} target="_blank" rel="noreferrer" data-testid={`doc-link-${i}`} className="group flex items-center gap-4 rounded-3xl bg-[var(--hemsa-mist)] hover:bg-[var(--hemsa)] hover:text-white p-4 transition-colors">
          <span className="h-11 w-11 shrink-0 rounded-2xl bg-white text-[var(--hemsa)] grid place-items-center"><FileText className="h-5 w-5" /></span>
          <span className="flex-1 font-semibold text-sm">{d.label}<span className="block text-xs font-normal opacity-75">PDF</span></span>
          <Download className="h-5 w-5 opacity-60 group-hover:opacity-100" />
        </a>
      </li>
    ))}
  </ul>
);

export const CtaBand = ({ title, text, motivo }) => (
  <section className="pb-24 lg:pb-32" data-testid="cta-band">
    <div className="max-w-7xl mx-auto px-6 lg:px-10">
      <div className="relative grain overflow-hidden rounded-[2.5rem] bg-[var(--hemsa)] text-white p-8 sm:p-14 grid lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-8 relative">
          <h2 className="text-2xl sm:text-3xl font-bold">{title}</h2>
          <p className="mt-3 text-white/85 leading-relaxed max-w-2xl">{text} También puedes llamarnos al {CONTACT.phone}, {CONTACT.hours}.</p>
        </div>
        <div className="lg:col-span-4 lg:text-right relative">
          <Link to={`/cita-previa${motivo ? `?motivo=${motivo}` : ""}`} data-testid="cta-band-button" className="inline-flex items-center gap-2 rounded-full bg-white text-[var(--hemsa-dark)] hover:bg-[var(--hemsa-accent)] hover:text-[var(--hemsa-deep)] font-semibold px-7 h-14 transition-colors">
            Pedir cita previa <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  </section>
);
