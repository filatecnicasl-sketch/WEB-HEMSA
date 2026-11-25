import { Outlet } from "react-router-dom";
import { HeaderB } from "@/components/site/HeaderB";
import { FooterB } from "@/components/site/FooterB";
import { CookieBanner } from "@/components/shared/CookieBanner";

export const SiteLayout = () => (
  <div data-testid="site-layout" className="bg-[var(--hemsa-mist)] min-h-screen">
    <HeaderB />
    <main>
      <Outlet />
    </main>
    <FooterB />
    <CookieBanner rounded />
  </div>
);
