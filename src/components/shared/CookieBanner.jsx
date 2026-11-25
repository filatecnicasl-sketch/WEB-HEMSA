import { useState } from "react";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";
import { LEGAL } from "@/data/content";

export const CookieBanner = ({ rounded = false }) => {
  const [open, setOpen] = useState(() => !localStorage.getItem("hemsa-cookies"));
  if (!open) return null;
  const close = () => {
    localStorage.setItem("hemsa-cookies", "ok");
    setOpen(false);
  };
  return (
    <div
      data-testid="cookie-banner"
      className={`fixed z-50 bottom-4 right-4 left-4 sm:left-auto sm:max-w-md bg-white border border-slate-200 shadow-2xl p-5 flex gap-4 items-start ${rounded ? "rounded-3xl" : "rounded-none border-l-4 border-l-[var(--hemsa)]"}`}
    >
      <Cookie className="h-6 w-6 shrink-0 text-[var(--hemsa)]" aria-hidden />
      <div className="text-sm text-[var(--hemsa-grey)] leading-relaxed">
        Este sitio web utiliza cookies para proporcionarle la mejor experiencia en línea. Al utilizar nuestro sitio web, acepta el uso de cookies.{" "}
        <Link to={LEGAL[1].href} data-testid="cookie-more-info-link" className="font-semibold text-[var(--hemsa)] underline underline-offset-2">Más información</Link>.
        <button
          data-testid="cookie-accept-button"
          onClick={close}
          className={`mt-3 block bg-[var(--hemsa)] hover:bg-[var(--hemsa-dark)] text-white font-semibold px-5 py-2 transition-colors ${rounded ? "rounded-full" : ""}`}
        >
          Aceptar
        </button>
      </div>
      <button data-testid="cookie-close-button" onClick={close} aria-label="Cerrar aviso de cookies" className="text-slate-500 hover:text-slate-900">
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};
