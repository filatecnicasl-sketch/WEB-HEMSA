import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { LogOut, RefreshCw, Inbox, Clock, CheckCircle2, XCircle } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { IMG, MOTIVOS } from "@/data/content";
import { ESTADOS, FilterSelect } from "@/components/admin/AdminBits";
import { CitasTable } from "@/components/admin/CitasTable";

const STATS = [
  ["total", "Total", Inbox],
  ["pendiente", "Pendientes", Clock],
  ["atendida", "Atendidas", CheckCircle2],
  ["descartada", "Descartadas", XCircle],
];

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const [citas, setCitas] = useState([]);
  const [stats, setStats] = useState({});
  const [motivo, setMotivo] = useState("todos");
  const [estado, setEstado] = useState("todos");

  const load = useCallback(async () => {
    const params = {};
    if (motivo !== "todos") params.motivo = motivo;
    if (estado !== "todos") params.estado = estado;
    try {
      const [c, s] = await Promise.all([api.get("/citas", { params }), api.get("/citas/stats")]);
      setCitas(c.data);
      setStats(s.data);
    } catch (err) {
      toast.error(formatApiError(err));
    }
  }, [motivo, estado]);

  useEffect(() => { load(); }, [load]);

  const onStatus = async (id, value) => {
    try {
      await api.patch(`/citas/${id}`, { estado: value });
      toast.success("Estado actualizado");
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  return (
    <div data-testid="admin-panel" className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/"><img src={IMG.logoH} alt="HEMSA" className="h-11 w-auto" /></Link>
          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm text-[var(--hemsa-grey)]" data-testid="admin-user-email">{user.email}</span>
            <button data-testid="admin-logout-button" onClick={logout} className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-slate-300 hover:border-[var(--hemsa)] hover:text-[var(--hemsa)] text-sm font-semibold transition-colors"><LogOut className="h-4 w-4" />Salir</button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-[var(--hemsa-ink)]">Solicitudes de cita previa</h1>
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(([k, l, I]) => (
            <div key={k} data-testid={`stat-${k}`} className="bg-white rounded-3xl border border-slate-200 p-6">
              <I className="h-5 w-5 text-[var(--hemsa)]" />
              <p className="mt-3 text-3xl font-bold text-[var(--hemsa-ink)]">{stats[k] ?? 0}</p>
              <p className="text-sm text-[var(--hemsa-grey)]">{l}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:items-center">
          <FilterSelect testId="filter-motivo" value={motivo} onChange={setMotivo} options={MOTIVOS} placeholder="Todos los motivos" />
          <FilterSelect testId="filter-estado" value={estado} onChange={setEstado} options={ESTADOS} placeholder="Todos los estados" />
          <button data-testid="admin-refresh-button" onClick={load} className="sm:ml-auto inline-flex items-center gap-2 h-11 px-5 rounded-full bg-[var(--hemsa)] hover:bg-[var(--hemsa-dark)] text-white text-sm font-semibold transition-colors"><RefreshCw className="h-4 w-4" />Actualizar</button>
        </div>
        <div className="mt-4"><CitasTable citas={citas} onStatus={onStatus} /></div>
      </main>
    </div>
  );
}
