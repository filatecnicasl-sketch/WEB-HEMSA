import { HeroB } from "@/components/site/HeroB";
import { RegistroBand } from "@/components/site/RegistroBand";
import { ServicesB } from "@/components/site/ServicesB";
import { HistoryB } from "@/components/site/HistoryB";
import { CitaB } from "@/components/site/CitaB";

export default function Home() {
  return (
    <div data-testid="home-page">
      <HeroB />
      <RegistroBand />
      <ServicesB />
      <HistoryB />
      <CitaB />
    </div>
  );
}
