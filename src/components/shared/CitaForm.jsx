import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, formatApiError } from "@/lib/api";
import { MOTIVOS } from "@/data/content";

const EMPTY = { nombre: "", telefono: "", email: "", motivo: "", fecha_preferida: "", comentario: "" };
const today = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });

const Success = ({ cita, onReset }) => (
  <div data-testid="cita-success" className="text-center py-8 rise">
    <CheckCircle2 className="h-14 w-14 mx-auto text-[var(--hemsa)]" />
    <h3 className="mt-4 text-2xl font-bold text-[var(--hemsa-ink)]">Solicitud recibida</h3>
    <p className="mt-2 text-[var(--hemsa-grey)]">Gracias, {cita.nombre.split(" ")[0]}. Te llamaremos para confirmar el día y la hora de tu cita. En unos minutos recibirás un email en <strong>{cita.email}</strong> con tu referencia y la documentación que debes traer.</p>
    <p className="mt-5 inline-block bg-[var(--hemsa-mist)] px-5 py-3 font-semibold text-[var(--hemsa-dark)]" data-testid="cita-success-reference">
      Referencia: {cita.referencia}
    </p>
    <button data-testid="cita-new-button" onClick={onReset} className={`mt-6 block mx-auto text-sm font-semibold text-[var(--hemsa)] underline underline-offset-4`}>
      Enviar otra solicitud
    </button>
  </div>
);

export const CitaForm = ({ defaultMotivo = "" }) => {
  const [form, setForm] = useState({ ...EMPTY, motivo: defaultMotivo });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));
  const field = "rounded-2xl h-12 bg-[var(--hemsa-mist)] border-transparent focus-visible:ring-[var(--hemsa-accent)]";

  const submit = async (e) => {
    e.preventDefault();
    if (!form.motivo) return toast.error("Selecciona el motivo de la cita");
    setLoading(true);
    try {
      const { data } = await api.post("/citas", form);
      setDone(data);
      setForm(EMPTY);
      toast.success(`Solicitud enviada. Referencia ${data.referencia}`);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (done) return <Success cita={done} onReset={() => setDone(null)} />;

  return (
    <form data-testid="cita-previa-form" onSubmit={submit} className="grid sm:grid-cols-2 gap-5">
      <p role="status" className="sm:col-span-2 text-sm text-[var(--hemsa-grey)]">
        Copia recuperada para revisión. Este formulario todavía no envía ni guarda solicitudes. Para pedir cita, contacta con HEMSA por teléfono o correo electrónico.
      </p>
      <div className="sm:col-span-2 space-y-2">
        <Label htmlFor={`nombre-cita`}>Nombre y apellidos</Label>
        <Input id={`nombre-cita`} data-testid="cita-input-nombre" required minLength={2} value={form.nombre} onChange={set("nombre")} className={field} placeholder="María García López" />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`tel-cita`}>Teléfono</Label>
        <Input id={`tel-cita`} data-testid="cita-input-telefono" type="tel" required minLength={6} value={form.telefono} onChange={set("telefono")} className={field} placeholder="600 000 000" />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`email-cita`}>Email</Label>
        <Input id={`email-cita`} data-testid="cita-input-email" type="email" required value={form.email} onChange={set("email")} className={field} placeholder="nombre@correo.es" />
      </div>
      <div className="space-y-2">
        <Label>Motivo</Label>
        <Select value={form.motivo} onValueChange={set("motivo")}>
          <SelectTrigger data-testid="cita-select-motivo" className={field}><SelectValue placeholder="Selecciona un motivo" /></SelectTrigger>
          <SelectContent>
            {MOTIVOS.map((m) => (
              <SelectItem key={m.value} value={m.value} data-testid={`cita-motivo-option-${m.value}`}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`fecha-cita`}>Fecha preferida</Label>
        <Input id={`fecha-cita`} data-testid="cita-input-fecha" type="date" required min={today()} value={form.fecha_preferida} onChange={set("fecha_preferida")} className={field} />
      </div>
      <div className="sm:col-span-2 space-y-2">
        <Label htmlFor={`com-cita`}>Comentario <span className="text-slate-500 font-normal">(opcional)</span></Label>
        <Textarea id={`com-cita`} data-testid="cita-input-comentario" rows={4} value={form.comentario} onChange={set("comentario")} className="rounded-2xl bg-[var(--hemsa-mist)] border-transparent" placeholder="Cuéntanos brevemente en qué podemos ayudarte" />
      </div>
      <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <p className="text-xs text-[var(--hemsa-grey)] max-w-sm">Tus datos se usarán solo para gestionar tu cita, según nuestra <Link to="/politica-privacidad" className="underline underline-offset-2 text-[var(--hemsa-dark)]">política de privacidad</Link>. Te llamaremos para confirmar día y hora.</p>
        <button
          type="submit"
          data-testid="cita-submit-button"
          disabled={loading}
          className={`inline-flex items-center justify-center gap-2 h-12 px-8 font-semibold text-white bg-[var(--hemsa)] hover:bg-[var(--hemsa-dark)] disabled:opacity-60 transition-colors rounded-full`}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Solicitar cita
        </button>
      </div>
    </form>
  );
};
