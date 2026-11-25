import { useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { Loader2, LogIn, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { formatApiError } from "@/lib/api";
import { IMG } from "@/data/content";

export default function AdminLogin() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      nav("/admin");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:block relative bg-[var(--hemsa)] grain">
        <img src={IMG.banner} alt="HEMSA Servicios Públicos Municipales San Fernando" className="absolute inset-0 h-full w-full object-contain" />
      </div>
      <div className="flex items-center justify-center p-6 bg-white">
        <form data-testid="admin-login-form" onSubmit={submit} className="w-full max-w-sm">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-[var(--hemsa-grey)] hover:text-[var(--hemsa)]"><ArrowLeft className="h-4 w-4" />Volver</Link>
          <img src={IMG.logoV} alt="HEMSA" className="h-24 mt-8" />
          <h1 className="mt-6 text-2xl font-bold text-[var(--hemsa-ink)]">Panel privado HEMSA</h1>
          <p className="text-sm text-[var(--hemsa-grey)] mt-1">Acceso para el personal de HEMSA.</p>
          <div className="mt-8 space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" data-testid="admin-login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-2xl" />
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" data-testid="admin-login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-2xl" />
          </div>
          {error && <p data-testid="admin-login-error" className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl p-3">{error}</p>}
          <button data-testid="admin-login-submit" disabled={loading} className="mt-6 w-full h-12 rounded-full inline-flex items-center justify-center gap-2 bg-[var(--hemsa)] hover:bg-[var(--hemsa-dark)] text-white font-semibold disabled:opacity-60 transition-colors">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
