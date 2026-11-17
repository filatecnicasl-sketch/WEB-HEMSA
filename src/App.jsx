import "@/App.css";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { SiteLayout } from "@/components/site/SiteLayout";
import Home from "@/pages/Home";
import Promociones from "@/pages/Promociones";
import Garajes from "@/pages/Garajes";
import CompraViviendas from "@/pages/CompraViviendas";
import AyudaDomicilio from "@/pages/AyudaDomicilio";
import RegistroDemandantes from "@/pages/RegistroDemandantes";
import CitaPrevia from "@/pages/CitaPrevia";
import LegalPage from "@/pages/LegalPage";
import AdminLogin from "@/pages/AdminLogin";
import AdminPanel from "@/pages/AdminPanel";

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      return;
    }
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" }), 80);
    return () => clearTimeout(t);
  }, [pathname, hash]);
  return null;
};

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route element={<SiteLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/promociones-vivienda" element={<Promociones />} />
              <Route path="/garajes-trasteros" element={<Garajes />} />
              <Route path="/hemsa-compra-viviendas" element={<CompraViviendas />} />
              <Route path="/ayuda-domicilio" element={<AyudaDomicilio />} />
              <Route path="/registro-demandantes" element={<RegistroDemandantes />} />
              <Route path="/cita-previa" element={<CitaPrevia />} />
              <Route path="/aviso-legal" element={<LegalPage key="a" page="aviso-legal" />} />
              <Route path="/politica-cookies" element={<LegalPage key="c" page="politica-cookies" />} />
              <Route path="/politica-privacidad" element={<LegalPage key="p" page="politica-privacidad" />} />
            </Route>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </div>
  );
}

export default App;
