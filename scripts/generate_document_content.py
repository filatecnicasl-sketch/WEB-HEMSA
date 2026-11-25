from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "migration" / "manifest.json"
OUTPUT = ROOT / "src" / "content" / "documents.js"

GROUP_META = {
    "informacion-organizativa": ("Información institucional y organizativa", "Estatutos, órganos de gobierno, estructura y normativa interna."),
    "contratos-": ("Contratos", "Contratos formalizados y documentación asociada."),
    "contratos": ("Contratación: datos estadísticos", "Información estadística sobre contratación."),
    "contratos27ba540a": ("Contratos formalizados", "Relaciones de contratos publicados por HEMSA."),
    "contratos-menores": ("Contratos menores", "Relaciones anuales de contratos menores."),
    "convenios": ("Convenios", "Convenios y acuerdos publicados."),
    "presupuestos": ("Presupuestos", "Presupuestos anuales de ESISA y HEMSA."),
    "cuentas": ("Cuentas anuales", "Cuentas anuales publicadas."),
    "control-finaciero-auditorias": ("Control financiero y auditorías", "Documentos de control financiero e informes de auditoría."),
    "gastos-publicos-en-publicidad": ("Gastos públicos en publicidad", "Detalle anual del gasto en publicidad."),
    "información-economica": ("Información económica", "Documentación económica y financiera."),
    "publicidad-activa": ("Publicidad activa", "Información sujeta a publicidad activa."),
    "bolsa-auxiliar-2026-octubre": ("Auxiliar SAD · Convocatoria 2026", "Anuncio, bases y formulario de solicitud."),
    "bolsa-coordinador-2026-octubre": ("Coordinación SAD · Convocatoria 2026", "Anuncio, bases y formulario de solicitud."),
    "bolsa-auxiliar-2025": ("Auxiliar SAD · Convocatoria 2025", "Bases, listados y resolución del proceso."),
    "bolsa-coordinador-2025": ("Coordinación SAD · Convocatoria 2025", "Bases, listados y resolución del proceso."),
    "bolsa-auxiliar": ("Auxiliar SAD · Bolsa de empleo 2024–2026", "Bases, formularios y sucesivos listados de la bolsa."),
    "bolsa-coordinador": ("Coordinación SAD · Bolsa de empleo 2024–2025", "Bases, formularios y sucesivos listados de la bolsa."),
    "promoción-interna-coordinación": ("Promoción interna de coordinación", "Documentación del proceso de promoción interna."),
    "registro-demandantes": ("Registro de Demandantes de Vivienda Protegida", "Ordenanza, solicitud e instancias."),
    "hemsa-compra-viviendas": ("Compra de viviendas", "Pliego y documentación de la convocatoria."),
    "ayudas-y-subvenciones": ("Ayudas y subvenciones", "Convocatorias, bases, resoluciones y formularios."),
    "venta-vivienda": ("Venta de vivienda protegida", "Documentación de las promociones en venta."),
    "viviendas": ("Viviendas", "Documentación general de vivienda."),
    "oficina-defensa-de-la-vivienda": ("Oficina de Defensa de la Vivienda", "Información y formularios para la ciudadanía."),
    "garajes-y-trasteros": ("Garajes y trasteros", "Anuncio, bases de adjudicación y plano de venta."),
    "garages-y-trasteros": ("Garajes y trasteros", "Anuncio, bases de adjudicación y plano de venta."),
    "locales-y-parcelas": ("Locales y parcelas", "Pliego, anuncio de licitación y plano de parcelas."),
    "privacy": ("Privacidad", "Política de privacidad del sitio web."),
}

EXCLUDED_PAGES = {
    "", "/", "aviso-legal", "ayuda-a-domicilio", "blog", "cita-previa", "contacto",
    "contacto-boton-inicio", "cookies", "empleo", "nueva-pagina", "sobre-nosotros", "sogescar",
}

TITLE_OVERRIDES = {
    "/transparencia/estatutos-hemsa.pdf": "Estatutos HEMSA refundidos",
    "/vivienda/pliego-adquisicion-viviendas-firmado.pdf": "Pliego de adquisición de viviendas",
    "/vivienda/instancia-hemsa.pdf": "Instancia HEMSA",
    "/vivienda/instancia-esisa-1-1.pdf": "Instancia ESISA",
    "/vivienda/solicitud-de-inscripcion-registro-de-demandantes-2024-hemsa.pdf": "Solicitud de inscripción en el Registro de Demandantes",
    "/empleo/coord-sad-acta-admitidos-24-10-2024-002.pdf": "Lista de admitidos/as · 24/10/2024",
    "/otros/politica-privacidad-pagina-web-rgpd-hemsa.pdf": "Política de privacidad del sitio web",
}


def clean_label(value: str) -> str:
    value = re.sub(r"\s*(Elemento de lista|Item Link)\s*\d*", "", value or "", flags=re.IGNORECASE)
    value = re.sub(r"\s+", " ", value).strip()
    value = re.sub(r"^(Presupuesto\s+(?:20\d{2})(?:\s+Prorrogados)?)(?:\s+Presupuesto.*)?$", r"\1", value, flags=re.IGNORECASE)
    value = re.sub(r"^(Cuentas\s+(?:20\d{2}))(?:\s+Cuentas.*)?$", r"\1", value, flags=re.IGNORECASE)
    return value


def page_slug(url: str) -> str:
    return (urlparse(url).path or "/").strip("/")


def fallback_title(group: str) -> str:
    return group.replace("-", " ").capitalize()


def main() -> None:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    grouped: dict[str, list[dict]] = defaultdict(list)
    for document in manifest["documents"]:
        if document["status"] != "ok":
            continue
        by_page: dict[str, list[str]] = defaultdict(list)
        for source in document["sources"]:
            slug = page_slug(source["page"])
            label = clean_label(source.get("text", ""))
            labels_for_page = by_page[slug]
            if label and label not in labels_for_page:
                labels_for_page.append(label)

        if document["local_path"] == "/transparencia/estatutos-hemsa.pdf":
            selected = {"informacion-organizativa": ["Estatutos HEMSA refundidos"]}
        else:
            selected = {
                slug: labels for slug, labels in by_page.items()
                if slug not in EXCLUDED_PAGES
                and not slug.startswith(("noticias/", "prueba-", "copia-de-"))
            }
            if not selected:
                # Conserva también los documentos que solo aparecen en páginas legales o genéricas.
                slug = next((item for item in ("privacy", "aviso-legal", "cookies") if item in by_page), next(iter(by_page)))
                selected = {slug: by_page[slug]}

        for slug, labels in selected.items():
            labels = sorted(labels, key=lambda label: (len(label) > 130, len(label)))
            title = TITLE_OVERRIDES.get(document["local_path"], labels[0] if labels else document["title"])
            grouped[slug].append({
                "title": title,
                "url": f"/documents{document['local_path']}",
                "pages": document["pages"],
                "bytes": document["bytes"],
            })

    order = list(GROUP_META)
    groups = []
    for slug in sorted(grouped, key=lambda item: order.index(item) if item in order else len(order)):
        title, description = GROUP_META.get(slug, (fallback_title(slug), "Documentación pública de HEMSA."))
        documents = sorted(grouped[slug], key=lambda item: item["title"].casefold())
        groups.append({"id": slug, "title": title, "description": description, "documents": documents})

    unique_urls = {document["url"] for group in groups for document in group["documents"]}
    if len(unique_urls) != manifest["unique_files"]:
        missing = {document["local_path"] for document in manifest["documents"]} - {url.removeprefix("/documents") for url in unique_urls}
        raise RuntimeError(f"Faltan documentos en el contenido generado: {sorted(missing)}")

    banner = "// Generado desde migration/manifest.json. No editar los nombres de archivo manualmente.\n"
    OUTPUT.write_text(
        banner
        + "export const documentGroups = "
        + json.dumps(groups, ensure_ascii=False, indent=2)
        + ";\n\nexport const getDocumentGroup = (id) => documentGroups.find((group) => group.id === id);\n",
        encoding="utf-8",
    )
    print(json.dumps({
        "groups": [{"id": group["id"], "documents": len(group["documents"])} for group in groups],
        "linked_documents": sum(len(group["documents"]) for group in groups),
        "unique_documents": len(unique_urls),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
