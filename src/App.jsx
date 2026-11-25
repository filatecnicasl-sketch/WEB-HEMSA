import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Housing from './pages/Housing';
import HousingRegistry from './pages/HousingRegistry';
import HousingPurchase from './pages/HousingPurchase';
import Grants from './pages/Grants';
import Services from './pages/Services';
import HomeCare from './pages/HomeCare';
import Garages from './pages/Garages';
import Transparency from './pages/Transparency';
import Employment from './pages/Employment';
import Contact from './pages/Contact';
import Appointment from './pages/Appointment';
import SadPortal from './pages/SadPortal';
import Admin from './pages/Admin';
import LegalNotice from './pages/LegalNotice';
import Cookies from './pages/Cookies';
import NotFound from './pages/NotFound';
import DesignGallery from './pages/designs/DesignGallery';
import DesignOne from './pages/designs/DesignOne';
import DesignTwo from './pages/designs/DesignTwo';
import DesignThree from './pages/designs/DesignThree';
import DesignFour from './pages/designs/DesignFour';

function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const timer = window.setTimeout(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
      return () => window.clearTimeout(timer);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <Routes>
        <Route path="alternativas" element={<DesignGallery />} />
        <Route path="propuesta-1" element={<DesignOne />} />
        <Route path="propuesta-2" element={<DesignTwo />} />
        <Route path="propuesta-3" element={<DesignThree />} />
        <Route path="propuesta-4" element={<DesignFour />} />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="sobre-nosotros" element={<About />} />
          <Route path="vivienda" element={<Housing />} />
          <Route path="vivienda/registro" element={<HousingRegistry />} />
          <Route path="vivienda/compra" element={<HousingPurchase />} />
          <Route path="ayudas-y-subvenciones" element={<Grants />} />
          <Route path="servicios" element={<Services />} />
          <Route path="ayuda-a-domicilio" element={<HomeCare />} />
          <Route path="garajes-trasteros" element={<Garages />} />
          <Route path="transparencia" element={<Transparency />} />
          <Route path="empleo" element={<Employment />} />
          <Route path="contacto" element={<Contact />} />
          <Route path="cita-previa" element={<Appointment />} />
          <Route path="area-sad" element={<SadPortal />} />
          <Route path="gestor" element={<Admin />} />
          <Route path="aviso-legal" element={<LegalNotice />} />
          <Route path="cookies" element={<Cookies />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
