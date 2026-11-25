import { Clock, MapPin, Scale } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Card, CtaBand, DocList, PrimaryLink } from "@/components/site/Blocks";
import { CONTACT, IMG } from "@/data/content";

const DOCS = [{ label: "Pliego de adquisición de viviendas: forma de presentar la oferta, condiciones y documentación", href: "/docs/pliego-adquisicion-viviendas.pdf" }];
const PERFIL = "https://contrataciondelestado.es/wps/poc?uri=deeplink%3Adetalle_licitacion&idEvl=V7eTZXGLQQ%2FzAq95uGTrDQ%3D%3D";

const INFO = [
  [MapPin, "Dónde presentar la oferta", `En las oficinas de HEMSA, ${CONTACT.address}, ${CONTACT.hours}.`],
  [Clock, "Plazo de presentación", "El plazo de presentación de ofertas finaliza el día 29 de enero de 2026 a las 13:30 horas."],
  [Scale, "Cómo se valoran", "Las ofertas se valorarán por criterios de precio y estado de conservación de las viviendas."],
];

export default function CompraViviendas() {
  return (
    <div data-testid="compra-page">
      <PageHero eyebrow="HEMSA compra viviendas" title="HEMSA compra viviendas en San Fernando" intro="¿Quieres vender tu vivienda? HEMSA adquiere viviendas en San Fernando. Te escuchamos y te acompañamos en todo el proceso." img={IMG.llaves} imgAlt="Entrega de llaves de una vivienda">
        <PrimaryLink to="/cita-previa?motivo=venta_vivienda" testId="compra-cita-button">Quiero vender mi vivienda</PrimaryLink>
      </PageHero>
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 grid gap-4" data-testid="compra-info">
            {INFO.map(([I, t, d]) => (
              <div key={t} className="flex gap-5 bg-white rounded-3xl p-6">
                <span className="h-12 w-12 shrink-0 rounded-2xl bg-[var(--hemsa-mist)] text-[var(--hemsa)] grid place-items-center"><I className="h-6 w-6" /></span>
                <div>
                  <h2 className="font-bold text-lg text-[var(--hemsa-ink)]">{t}</h2>
                  <p className="mt-1 text-[var(--hemsa-grey)] leading-relaxed">{d}</p>
                </div>
              </div>
            ))}
          </div>
          <Card className="lg:col-span-5" testId="compra-documentos">
            <h2 className="text-2xl font-bold text-[var(--hemsa-ink)]">Documentación</h2>
            <div className="mt-6"><DocList docs={DOCS} /></div>
            <a href={PERFIL} target="_blank" rel="noreferrer" data-testid="compra-perfil-link" className="mt-6 inline-block text-sm font-semibold text-[var(--hemsa)] underline underline-offset-4">Ver la licitación en el perfil contratante de HEMSA (Plataforma de Contratación del Estado)</a>
          </Card>
        </div>
      </section>
      <CtaBand title="¿Tienes dudas antes de presentar tu oferta?" text="Pide cita y te explicamos las condiciones y la documentación necesaria." motivo="venta_vivienda" />
    </div>
  );
}
