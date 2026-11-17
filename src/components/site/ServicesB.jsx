import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SERVICES } from "@/data/content";
import { Icon } from "@/components/shared/Icon";

const Card = ({ s, big }) => (
  <article data-testid={`service-card-${s.id}`} className={`group relative rounded-[2rem] overflow-hidden bg-white shadow-[0_10px_40px_rgba(0,128,94,0.08)] hover:shadow-[0_16px_50px_rgba(0,128,94,0.18)] hover:-translate-y-1 transition-[transform,box-shadow] duration-500 flex flex-col ${big ? "md:row-span-2" : ""}`}>
    <div className={`overflow-hidden ${big ? "aspect-[4/3] md:aspect-auto md:flex-1" : "aspect-[16/9]"}`}>
      <img src={s.img} alt={s.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
    </div>
    <div className="p-7">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--hemsa-mist)] text-[var(--hemsa)]"><Icon name={s.icon} className="h-6 w-6" /></span>
      <h3 className="mt-4 text-xl font-bold text-[var(--hemsa-ink)] leading-snug">{s.title}</h3>
      <p className="mt-2 text-[var(--hemsa-grey)] leading-relaxed">{s.warm}</p>
      <Link to={s.href} data-testid={`service-link-${s.id}`} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--hemsa-mist)] group-hover:bg-[var(--hemsa)] group-hover:text-white text-[var(--hemsa-dark)] font-semibold text-sm px-5 py-2.5 transition-colors">
        Más información <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  </article>
);

export const ServicesB = () => (
  <section id="servicios" data-testid="services-section" className="py-24 lg:py-32">
    <div className="max-w-7xl mx-auto px-6 lg:px-10">
      <div className="max-w-2xl mb-14">
        <p className="text-sm font-semibold text-[var(--hemsa)]">Cómo te ayudamos</p>
        <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-[var(--hemsa-ink)]">Servicios pensados para ti y para los tuyos</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6 md:auto-rows-fr">
        <Card s={SERVICES[3]} big />
        <Card s={SERVICES[0]} />
        <Card s={SERVICES[2]} />
        <div className="md:col-span-2"><Card s={SERVICES[1]} /></div>
      </div>
    </div>
  </section>
);
