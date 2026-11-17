import { useSearchParams } from "react-router-dom";
import { CitaB } from "@/components/site/CitaB";
import { MOTIVOS } from "@/data/content";

export default function CitaPrevia() {
  const [params] = useSearchParams();
  const m = params.get("motivo");
  const motivo = MOTIVOS.some((x) => x.value === m) ? m : "";
  return (
    <div data-testid="cita-previa-page" className="pt-4">
      <CitaB defaultMotivo={motivo} />
    </div>
  );
}
