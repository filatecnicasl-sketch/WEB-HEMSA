import { Phone, Mail } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motivoLabel } from "@/data/content";
import { ESTADOS, StatusBadge } from "@/components/admin/AdminBits";

const fmt = (iso) => new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
const EMAIL_TXT = { enviado: ["Confirmación enviada", "text-emerald-700"], pendiente: ["Enviando confirmación…", "text-slate-500"], error: ["No se pudo enviar la confirmación", "text-red-700"] };
const EmailStatus = ({ s = "pendiente", id }) => {
  const [t, cls] = EMAIL_TXT[s] || ["Envío pausado: revisar saldo o integración de email", "text-amber-700"];
  return <p data-testid={`email-status-${id}`} className={`text-[11px] mt-1 font-medium ${cls}`}>{t}</p>;
};
const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });

const Row = ({ c, onStatus }) => (
  <tr data-testid={`cita-row-${c.id}`} className="border-t border-slate-200 align-top hover:bg-slate-50">
    <td className="p-4">
      <p className="font-mono text-xs text-slate-500">{c.referencia}</p>
      <p className="text-xs text-slate-500 mt-1">{fmt(c.created_at)}</p>
    </td>
    <td className="p-4">
      <p className="font-semibold text-[var(--hemsa-ink)]">{c.nombre}</p>
      <a href={`tel:${c.telefono}`} className="flex items-center gap-1.5 text-xs mt-1 text-[var(--hemsa-grey)] hover:text-[var(--hemsa)]"><Phone className="h-3 w-3" />{c.telefono}</a>
      <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-xs mt-0.5 text-[var(--hemsa-grey)] hover:text-[var(--hemsa)]"><Mail className="h-3 w-3" />{c.email}</a>
      <EmailStatus s={c.email_estado} id={c.id} />
    </td>
    <td className="p-4 text-sm">{motivoLabel(c.motivo)}</td>
    <td className="p-4 text-sm whitespace-nowrap">{fmtDate(c.fecha_preferida)}</td>
    <td className="p-4 text-sm text-[var(--hemsa-grey)] max-w-xs">{c.comentario || <span className="text-slate-400">—</span>}</td>
    <td className="p-4"><StatusBadge estado={c.estado} testId={`status-badge-${c.id}`} /></td>
    <td className="p-4">
      <Select value={c.estado} onValueChange={(v) => onStatus(c.id, v)}>
        <SelectTrigger data-testid={`btn-change-status-${c.id}`} className="h-9 w-44 rounded-full text-xs"><span>Cambiar estado</span></SelectTrigger>
        <SelectContent>
          {ESTADOS.map((e) => <SelectItem key={e.value} value={e.value} data-testid={`status-option-${c.id}-${e.value}`}>{e.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </td>
  </tr>
);

export const CitasTable = ({ citas, onStatus }) => (
  <div className="bg-white rounded-3xl border border-slate-200 overflow-x-auto">
    <table data-testid="citas-table" className="w-full text-left min-w-[960px]">
      <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-600">
        <tr>{["Referencia", "Solicitante", "Motivo", "Fecha preferida", "Comentario", "Estado", "Acción"].map((h) => <th key={h} className="p-4 font-semibold">{h}</th>)}</tr>
      </thead>
      <tbody>
        {citas.map((c) => <Row key={c.id} c={c} onStatus={onStatus} />)}
        {!citas.length && <tr><td colSpan={7} className="p-12 text-center text-[var(--hemsa-grey)]" data-testid="citas-empty">No hay solicitudes con estos filtros.</td></tr>}
      </tbody>
    </table>
  </div>
);
