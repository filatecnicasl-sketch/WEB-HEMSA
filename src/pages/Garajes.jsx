import { MapPin } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Card, CtaBand, DocList, PrimaryLink } from "@/components/site/Blocks";
import { IMG } from "@/data/content";

const DOCS = [
  { label: "Anuncio de venta de garajes y trasteros Ronda del Estero", href: "/docs/anuncio-garajes-trasteros.pdf" },
  { label: "Bases de adjudicación de garajes y trasteros", href: "/docs/bases-adjudicacion-garajes-trasteros.pdf" },
  { label: "Plano de ventas de garajes y trasteros", href: "/docs/plano-venta-garajes.pdf" },
];

export default function Garajes() {
  return (
    <div data-testid="garajes-page">
      <PageHero eyebrow="Garajes y trasteros" title="Venta de garajes y trasteros" intro="Más espacio para lo tuyo, cerca de casa. Plazas de garaje y trasteros en venta en Ronda del Estero, esquina calle El Carmen." img={IMG.garajes} imgAlt="Garajes y trasteros en Ronda del Estero">
        <PrimaryLink to="/cita-previa?motivo=garajes" testId="garajes-cita-button">Pedir información</PrimaryLink>
      </PageHero>
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-5" testId="garajes-ubicacion">
            <MapPin className="h-7 w-7 text-[var(--hemsa)]" />
            <h2 className="mt-4 text-2xl font-bold text-[var(--hemsa-ink)]">Ubicación</h2>
            <p className="mt-2 text-lg text-[var(--hemsa-ink)]">Ronda del Estero esquina calle El Carmen</p>
            <p className="mt-1 text-[var(--hemsa-grey)]">San Fernando (Cádiz)</p>
            <p className="mt-6 text-sm text-[var(--hemsa-grey)] leading-relaxed">Consulta en el anuncio y en las bases las condiciones, los precios y la forma de adjudicación. En el plano puedes ver la situación de cada plaza y trastero.</p>
          </Card>
          <Card className="lg:col-span-7" testId="garajes-documentos">
            <h2 className="text-2xl font-bold text-[var(--hemsa-ink)]">Documentación</h2>
            <div className="mt-6"><DocList docs={DOCS} /></div>
          </Card>
        </div>
      </section>
      <CtaBand title="¿Te interesa una plaza o un trastero?" text="Pide cita y te enseñamos el plano y las plazas disponibles." motivo="garajes" />
    </div>
  );
}
