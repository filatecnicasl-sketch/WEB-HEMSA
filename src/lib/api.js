import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  adapter: async () => {
    const detail = "Copia recuperada: el servidor original no está conectado. No se ha enviado ni guardado ningún dato. Contacta con HEMSA por teléfono o correo electrónico.";
    const error = new Error(detail);
    error.response = { data: { detail } };
    throw error;
  },
});

export function formatApiError(err) {
  const detail = err?.response?.data?.detail;
  if (detail == null) return "Ha ocurrido un error. Inténtelo de nuevo.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => e?.msg || JSON.stringify(e)).join(" ");
  return detail.msg || String(detail);
}
