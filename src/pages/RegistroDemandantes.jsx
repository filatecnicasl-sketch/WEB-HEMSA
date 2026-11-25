import { BellRing } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Card, CheckList, CtaBand, DocList, PrimaryLink } from "@/components/site/Blocks";
import { CONTACT } from "@/data/content";

const DOCS = [
  { label: "Solicitud de inscripción en el Registro de Demandantes", href: "/docs/solicitud-inscripcion-registro-demandantes.pdf" },
  { label: "Ordenanza reguladora RMDVP San Fernando", href: "/docs/ordenanza-rmdvp-san-fernando.pdf" },
  { label: "Instancia HEMSA", href: "/docs/instancia-hemsa.pdf" },
];

const DOCUMENTACION = [
  "Copia del DNI o documento de identidad de la persona solicitante y, en su caso, de todos los integrantes de la unidad familiar o de convivencia (libro de familia si hay menores).",
  "Copia de la declaración de la renta (IRPF) si hay obligación de presentarla. Si no, certificado de vida laboral y certificado de ingresos del último año completo.",
  "Si pertenece a algún grupo de especial protección (menores de 35, mayores de 65, discapacidad o movilidad reducida, familias numerosas o monoparentales, víctimas de violencia de género…), su acreditación.",
  "Justificación de la necesidad de vivienda (vivienda en ruina, desahucio, alojamiento con familiares, vivienda inadecuada, renta elevada, nueva unidad familiar u otros).",
];

const DENEGACION = [
  "No aportar los datos requeridos o no cumplir los requisitos establecidos.",
  "La falsedad manifiesta en los datos o documentación aportada.",
  "Estar inscrito previamente como demandante, a título individual o en otra unidad familiar o de convivencia.",
  "Estar inscrito simultáneamente en 3 Registros Públicos de Demandantes de Viviendas.",
  "No haber transcurrido tres años desde la cancelación por haber renunciado voluntariamente dos veces a la vivienda protegida adjudicada.",
];

export default function RegistroDemandantes() {
  return (
    <div data-testid="registro-page">
      <PageHero eyebrow="Registro de Demandantes" title="Registro de Demandantes de Vivienda Protegida" intro="El Registro es el mecanismo que regula la adjudicación de viviendas protegidas en San Fernando. Está permanentemente abierto: no hay plazo para inscribirse, modificar, actualizar o cancelar la inscripción.">
        <PrimaryLink to="/cita-previa?motivo=vivienda" testId="registro-cita-button">Pedir cita para inscribirme</PrimaryLink>
      </PageHero>
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 grid gap-6">
            <Card className="!bg-[var(--hemsa-deep)] text-white" testId="registro-aviso">
              <BellRing className="h-6 w-6 text-[var(--hemsa-accent)]" />
              <h2 className="mt-3 text-xl font-bold">Recuerda: la inscripción caduca a los tres años</h2>
              <p className="mt-2 text-white/80 leading-relaxed">Si ya estás inscrito, interésate por su renovación llamando al {CONTACT.phone} ({CONTACT.hours}) o escribiendo a {CONTACT.email}.</p>
            </Card>
            <Card testId="registro-procedimiento">
              <h2 className="text-2xl font-bold text-[var(--hemsa-ink)]">Cómo inscribirse</h2>
              <p className="mt-4 text-[var(--hemsa-grey)] leading-relaxed">Pueden solicitar la inscripción las personas mayores de edad con interés en residir en el municipio. Si varias personas forman una unidad familiar o de convivencia, presentan una única solicitud firmada por todos los mayores de edad.</p>
              <p className="mt-4 text-[var(--hemsa-grey)] leading-relaxed">Cumplimenta la solicitud (puedes descargarla aquí o recogerla en HEMSA) y presenta la documentación:</p>
              <ul className="mt-4 space-y-2 text-[var(--hemsa-ink)]">
                <li><strong>De forma presencial</strong> en las oficinas de HEMSA, {CONTACT.address}, con cita previa.</li>
                <li><strong>Por correo electrónico</strong> a {CONTACT.email}, solo si todos los mayores de 18 años incluidos en la solicitud la firman digitalmente.</li>
              </ul>
              <h3 className="mt-8 text-lg font-bold text-[var(--hemsa-ink)]">Documentación necesaria</h3>
              <div className="mt-4"><CheckList items={DOCUMENTACION} testId="registro-doc-list" /></div>
            </Card>
          </div>
          <div className="lg:col-span-5 grid gap-6 content-start">
            <Card testId="registro-descargas">
              <h2 className="text-2xl font-bold text-[var(--hemsa-ink)]">Descargas</h2>
              <div className="mt-6"><DocList docs={DOCS} /></div>
            </Card>
            <Card testId="registro-denegacion">
              <h2 className="text-lg font-bold text-[var(--hemsa-ink)]">Causas de denegación</h2>
              <ul className="mt-4 space-y-3 text-sm text-[var(--hemsa-grey)] list-disc pl-5">{DENEGACION.map((t) => <li key={t}>{t}</li>)}</ul>
            </Card>
          </div>
        </div>
      </section>
      <CtaBand title="¿Te ayudamos con la inscripción?" text="Pide cita y revisamos contigo la solicitud y la documentación." motivo="vivienda" />
    </div>
  );
}
