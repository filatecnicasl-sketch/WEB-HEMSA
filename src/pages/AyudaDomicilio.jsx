import { HeartHandshake, Home, Building } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Card, CtaBand, PrimaryLink } from "@/components/site/Blocks";
import { HISTORY, IMG } from "@/data/content";

const POINTS = [
  [Home, "En tu propia casa", "Un servicio pensado para que las personas mayores y dependientes puedan seguir viviendo en su hogar con apoyo."],
  [HeartHandshake, "Trato cercano", "Profesionales que acompañan con calma, respeto y cariño en el día a día."],
  [Building, "Servicio municipal", "HEMSA presta el Servicio Municipal de Ayuda a Domicilio como Medio Propio del Ayuntamiento de San Fernando."],
];

export default function AyudaDomicilio() {
  return (
    <div data-testid="ayuda-page">
      <PageHero eyebrow="Ayuda a domicilio" title="Servicio Municipal de Ayuda a Domicilio" intro="Cuidamos de quienes más quieres, en su propia casa y con trato cercano." img={IMG.cuidado2} imgAlt="Cuidadora acompañando a una persona mayor">
        <PrimaryLink to="/cita-previa?motivo=ayuda_domicilio" testId="ayuda-cita-button">Pedir información</PrimaryLink>
      </PageHero>
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 grid md:grid-cols-3 gap-6" data-testid="ayuda-points">
          {POINTS.map(([I, t, d]) => (
            <Card key={t}>
              <span className="h-12 w-12 rounded-2xl bg-[var(--hemsa-mist)] text-[var(--hemsa)] grid place-items-center"><I className="h-6 w-6" /></span>
              <h2 className="mt-4 text-xl font-bold text-[var(--hemsa-ink)]">{t}</h2>
              <p className="mt-2 text-[var(--hemsa-grey)] leading-relaxed">{d}</p>
            </Card>
          ))}
        </div>
      </section>
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-6 items-stretch">
          <div className="rounded-[2rem] overflow-hidden min-h-[280px]">
            <img src={IMG.cuidado} alt="Una auxiliar del servicio de ayuda a domicilio junto a una vecina" className="h-full w-full object-cover" />
          </div>
          <Card testId="ayuda-info">
            <h2 className="text-2xl font-bold text-[var(--hemsa-ink)]">Una nueva etapa al servicio de las personas</h2>
            <p className="mt-4 text-[var(--hemsa-grey)] leading-relaxed">{HISTORY.p3}</p>
            <p className="mt-4 text-[var(--hemsa-grey)] leading-relaxed">Si quieres saber cómo acceder al servicio, pide cita previa o llámanos y una persona de nuestro equipo te informará.</p>
          </Card>
        </div>
      </section>
      <CtaBand title="¿Necesitas ayuda en casa para un familiar?" text="Pide cita y te contamos cómo funciona el servicio." motivo="ayuda_domicilio" />
    </div>
  );
}
