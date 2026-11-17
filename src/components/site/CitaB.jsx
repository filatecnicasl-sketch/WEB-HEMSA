import { Phone, Mail, Smile, MapPin } from "lucide-react";
import { CitaForm } from "@/components/shared/CitaForm";
import { CONTACT, IMG } from "@/data/content";

export const CitaB = ({ defaultMotivo = "" }) => (
  <section id="cita-previa" data-testid="cita-section" className="py-24 lg:py-32">
    <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-10 items-start">
      <div className="lg:col-span-5 lg:sticky lg:top-28">
        <p className="text-sm font-semibold text-[var(--hemsa)]">Hablemos</p>
        <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-[var(--hemsa-ink)]">Pide tu cita previa, te llamamos</h2>
        <p className="mt-5 text-[var(--hemsa-grey)] leading-relaxed">Cuéntanos qué necesitas. Una persona de nuestro equipo te llamará para confirmar el día y la hora que mejor te vengan.</p>
        <div className="mt-8 flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm">
          <img src={IMG.cuidado2} alt="" aria-hidden className="h-16 w-16 rounded-2xl object-cover" />
          <p className="text-sm text-[var(--hemsa-ink)] font-medium flex gap-2"><Smile className="h-5 w-5 text-[var(--hemsa)] shrink-0" />Te atenderemos con calma y sin prisas.</p>
        </div>
        <div className="mt-6 grid gap-3">
          <a href={`tel:${CONTACT.phoneHref}`} className="flex items-center gap-3 rounded-full bg-white px-5 py-3 font-medium hover:bg-[var(--hemsa)] hover:text-white transition-colors"><Phone className="h-4 w-4" />{CONTACT.phone}</a>
          <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-3 rounded-full bg-white px-5 py-3 font-medium hover:bg-[var(--hemsa)] hover:text-white transition-colors"><Mail className="h-4 w-4" />{CONTACT.email}</a>
          <p className="flex items-start gap-3 rounded-3xl bg-white px-5 py-3 text-sm"><MapPin className="h-4 w-4 mt-0.5 shrink-0" /><span>{CONTACT.address}<br /><span className="text-[var(--hemsa-grey)]">Horario de atención: {CONTACT.hours}</span></span></p>
        </div>
      </div>
      <div className="lg:col-span-7 bg-white rounded-[2.5rem] p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,128,94,0.12)]">
        <CitaForm key={defaultMotivo} defaultMotivo={defaultMotivo} />
      </div>
    </div>
  </section>
);
