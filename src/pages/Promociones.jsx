import { Users, Wallet, MapPin, Landmark } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Card, CheckList, CtaBand, PrimaryLink, SoftLink } from "@/components/site/Blocks";
import { IMG } from "@/data/content";

const REQ = [
  "Estar inscrito en el Registro de Demandantes con todos los datos actualizados.",
  "Ingresos máximos de 5,5 veces el IPREM.",
  "Estar empadronado en San Fernando con antigüedad de más de dos años, excepto en el caso de trabajar en San Fernando o el de haber residido la mayor parte de su vida en San Fernando y que por motivos laborales estén residiendo fuera (*).",
  "Pasar el estudio de viabilidad con la entidad bancaria a efectos de la hipoteca. Los solicitantes que la entidad bancaria considere no aptos no podrán ser adjudicatarios.",
];

const FACTS = [
  [Landmark, "348 viviendas", "Dos promociones: una de 132 y otra de 216 viviendas"],
  [MapPin, "Ronda del Estero", "Ambas promociones en San Fernando"],
  [Users, "Por antigüedad", "Respetando los cupos (menores de 35 años, familias monoparentales…)"],
  [Wallet, "Hasta 5,5 IPREM", "Ingresos máximos para optar"],
];

export default function Promociones() {
  return (
    <div data-testid="promociones-page">
      <PageHero eyebrow="Promociones de vivienda" title="Promociones de vivienda en Ronda del Estero" intro="Dos promociones, una de 132 viviendas y otra de 216, ambas en Ronda del Estero. La adjudicación se realiza a través del Registro de Demandantes de Vivienda Protegida de San Fernando según las ordenanzas municipales." img={IMG.promociones2} imgAlt="Recreación del patio interior de la promoción de viviendas de Ronda del Estero">
        <PrimaryLink to="/cita-previa?motivo=vivienda" testId="promociones-cita-button">Pedir información</PrimaryLink>
        <SoftLink to="/registro-demandantes" testId="promociones-registro-button">Inscribirme en el Registro</SoftLink>
      </PageHero>
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="promociones-facts">
          {FACTS.map(([I, t, d]) => (
            <div key={t} className="bg-white rounded-3xl p-6">
              <I className="h-6 w-6 text-[var(--hemsa)]" />
              <p className="mt-3 text-xl font-bold text-[var(--hemsa-ink)]">{t}</p>
              <p className="text-sm text-[var(--hemsa-grey)] mt-1">{d}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-7" testId="promociones-requisitos">
            <h2 className="text-2xl font-bold text-[var(--hemsa-ink)]">Requisitos para ser adjudicatario</h2>
            <div className="mt-6"><CheckList items={REQ} testId="promociones-req-list" /></div>
            <p className="mt-6 text-sm text-[var(--hemsa-grey)] leading-relaxed">(*) Solo tras la adjudicación o renuncia de las personas que acrediten las circunstancias anteriormente señaladas, el Registro podrá ofrecer las viviendas disponibles a las personas que no estén en los anteriores supuestos.</p>
          </Card>
          <div className="lg:col-span-5 grid gap-6">
            <Card className="bg-[var(--hemsa-deep)] !shadow-none text-white">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--hemsa-accent)]">Imprescindible</p>
              <h2 className="mt-3 text-2xl font-bold">Estar inscrito en el Registro Municipal de Demandantes</h2>
              <p className="mt-3 text-white/80 leading-relaxed">Para optar a estas viviendas es imprescindible estar inscrito en el Registro Municipal de Demandantes de Vivienda Protegida con todos los datos actualizados.</p>
              <SoftLink to="/registro-demandantes" testId="promociones-registro-link">Ver cómo inscribirme</SoftLink>
            </Card>
            <div className="rounded-[2rem] overflow-hidden aspect-[16/10]">
              <img src={IMG.promociones} alt="Recreación exterior de la promoción de viviendas" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>
      <CtaBand title="¿Tienes dudas sobre las promociones?" text="Pide cita y te explicamos en persona los requisitos y los próximos pasos." motivo="vivienda" />
    </div>
  );
}
