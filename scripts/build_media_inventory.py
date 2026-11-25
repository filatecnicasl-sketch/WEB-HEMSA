import csv
import json
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "backups/fase-1-20261124-190016/manifest.json"
OUT_DIR = ROOT / "migration/media-inventory"
PREVIEW_DIR = OUT_DIR / "previews"

PUBLIC_132 = "https://www.elcastillodesanfernando.es/2026/10/san-fernando-adjudica-por-186-millones-las-obras-de-las-132-viviendas-protegidas-de-residencial-la-marina/"
PUBLIC_81 = "https://herysan2007.com/formalizada-la-adjudicacion-de-81-viviendas-en-ronda-del-estero/"

promotions = {
    "la-marina-132": {
        "name": "Residencial La Marina — 132 viviendas protegidas",
        "units": 132,
        "location": "Ronda del Estero y avenida de La Marina, San Fernando",
        "tenure": "Venta",
        "proposed_section": "Vivienda > Promociones > Residencial La Marina (132 viviendas)",
        "evidence": [PUBLIC_132],
    },
    "ronda-estero-81": {
        "name": "Ronda del Estero — 81 viviendas protegidas",
        "units": 81,
        "location": "Ronda del Estero, San Fernando",
        "tenure": "Alquiler con opción a compra",
        "proposed_section": "Vivienda > Promociones > Ronda del Estero (81 viviendas)",
        "evidence": [PUBLIC_81],
    },
}

classification = {
    "132ViviendasVPO_Hemsa_mods.mp4": {
        "promotion_id": "la-marina-132",
        "content": "Vídeo promocional de 72 segundos: entorno de San Fernando, ubicación, fachadas, zonas comunes, terraza, interior y logotipos de HEMSA y San Fernando.",
        "proposed_use": "Vídeo principal de la ficha de Residencial La Marina.",
        "basis": "El nombre identifica 132 viviendas VPO y sus fotogramas reproducen la arquitectura del grupo M02; la vista de zonas comunes coincide con PatioContra_M02.jpg.",
        "evidence": [PUBLIC_132, "migration/media-inventory/previews/video-1-contacto.jpg", "migration/media-inventory/references/infografia-132.jpeg"],
        "preview": "migration/media-inventory/previews/video-1-contacto.jpg",
    },
    "1_Exterior.png": {
        "promotion_id": "ronda-estero-81",
        "content": "Render exterior desde la calle del conjunto blanco y gris.",
        "proposed_use": "Imagen de portada o primera imagen de la galería de las 81 viviendas.",
        "basis": "La fachada y la configuración del edificio coinciden con la obra real identificada como 81 viviendas en el vídeo con dron. También aparecía en la antigua página de garajes y trasteros de Ronda del Estero.",
        "evidence": [PUBLIC_81, "research/garajes-y-trasteros.html:557-559", "research/garajes-y-trasteros.html:1212", "migration/media-inventory/previews/video-2-contacto.jpg"],
        "preview": "migration/media-inventory/previews/fotografias-contacto.jpg",
    },
    "2_Plaza.png": {
        "promotion_id": "ronda-estero-81",
        "content": "Render del patio o plaza interior del conjunto blanco y gris.",
        "proposed_use": "Galería de zonas comunes de las 81 viviendas.",
        "basis": "Las galerías abiertas, fachadas blancas y grises y patio interior coinciden con las imágenes de obra del vídeo identificado como 81 viviendas.",
        "evidence": [PUBLIC_81, "migration/media-inventory/previews/fotografias-contacto.jpg", "migration/media-inventory/previews/video-2-contacto.jpg"],
        "preview": "migration/media-inventory/previews/fotografias-contacto.jpg",
    },
    "3_Plaza.png": {
        "promotion_id": "ronda-estero-81",
        "content": "Render del patio o plaza interior del conjunto blanco y gris desde otro ángulo.",
        "proposed_use": "Galería de zonas comunes de las 81 viviendas.",
        "basis": "Pertenece al mismo conjunto arquitectónico que 1_Exterior, 2_Plaza y 4_Plaza; sus galerías y fachadas coinciden con la obra de 81 viviendas del vídeo con dron. La antigua portada enlazaba esta imagen con venta-vivienda.",
        "evidence": [PUBLIC_81, "original-home.html:1016", "migration/media-inventory/previews/video-2-contacto.jpg"],
        "preview": "migration/media-inventory/previews/fotografias-contacto.jpg",
    },
    "4_Plaza.png": {
        "promotion_id": "ronda-estero-81",
        "content": "Render frontal del patio interior y de las galerías del conjunto blanco y gris.",
        "proposed_use": "Galería de zonas comunes de las 81 viviendas.",
        "basis": "Las galerías y fachadas coinciden con el vídeo de obra de 81 viviendas. La web antigua usaba esta misma imagen en la página de promociones de Ronda del Estero.",
        "evidence": [PUBLIC_81, "research/venta-vivienda.html:1137-1154", "migration/media-inventory/previews/video-2-contacto.jpg"],
        "preview": "migration/media-inventory/previews/fotografias-contacto.jpg",
    },
    "Entrada_M02.jpg": {
        "promotion_id": "la-marina-132",
        "content": "Render del acceso y exterior del conjunto blanco con zócalo y elementos marrones/anaranjados.",
        "proposed_use": "Imagen de acceso en la galería de Residencial La Marina.",
        "basis": "Pertenece al grupo M02, cuya arquitectura aparece en el vídeo de 132 viviendas; la infografía pública de La Marina coincide exactamente con Plaza_M02.jpg del mismo conjunto.",
        "evidence": [PUBLIC_132, "migration/media-inventory/references/infografia-132.jpeg", "migration/media-inventory/previews/video-1-contacto.jpg"],
        "preview": "migration/media-inventory/previews/fotografias-contacto.jpg",
    },
    "Interior_M02.jpg": {
        "promotion_id": "la-marina-132",
        "content": "Render de una zona común interior con accesos señalados como 6 y 2.",
        "proposed_use": "Galería de zonas comunes de Residencial La Marina.",
        "basis": "Pertenece al conjunto M02 identificado como La Marina; los números de acceso son compatibles con los seis edificios descritos para la promoción de 132 viviendas.",
        "evidence": [PUBLIC_132, "migration/media-inventory/references/infografia-132.jpeg", "migration/media-inventory/previews/video-1-contacto.jpg"],
        "preview": "migration/media-inventory/previews/fotografias-contacto.jpg",
    },
    "PatioContra_M02.jpg": {
        "promotion_id": "la-marina-132",
        "content": "Render del recorrido peatonal y patio interior, con el acceso 2 visible.",
        "proposed_use": "Galería de patio y zonas comunes de Residencial La Marina.",
        "basis": "La misma vista y arquitectura aparecen en el fotograma 00:28 del vídeo de 132 viviendas; el grupo M02 coincide con la infografía pública de La Marina.",
        "evidence": [PUBLIC_132, "migration/media-inventory/previews/video-1-contacto.jpg", "migration/media-inventory/references/infografia-132.jpeg"],
        "preview": "migration/media-inventory/previews/fotografias-contacto.jpg",
    },
    "Plaza_M02.jpg": {
        "promotion_id": "la-marina-132",
        "content": "Render exterior de un edificio blanco con balcones oscuros y zócalo marrón.",
        "proposed_use": "Imagen principal o de fachada en la ficha de Residencial La Marina.",
        "basis": "Coincide con la infografía publicada expresamente como promoción de 132 viviendas de Residencial La Marina.",
        "evidence": [PUBLIC_132, "migration/media-inventory/references/infografia-132.jpeg"],
        "preview": "migration/media-inventory/previews/fotografias-contacto.jpg",
    },
    "Rotonda_M02.jpg": {
        "promotion_id": "la-marina-132",
        "content": "Render exterior del conjunto desde la rotonda, con fachadas blancas y marrones.",
        "proposed_use": "Imagen de ubicación y exterior en la galería de Residencial La Marina.",
        "basis": "Pertenece al grupo M02; la misma arquitectura y perspectiva de conjunto aparecen en el vídeo de 132 viviendas, y Plaza_M02.jpg coincide con la infografía pública de La Marina.",
        "evidence": [PUBLIC_132, "migration/media-inventory/references/infografia-132.jpeg", "migration/media-inventory/previews/video-1-contacto.jpg"],
        "preview": "migration/media-inventory/previews/fotografias-contacto.jpg",
    },
    "436950 SAN FERNANDO UTE SERROT HERYSAN 2026 ORIGEN CON DRON.mp4": {
        "promotion_id": "ronda-estero-81",
        "content": "Vídeo con dron de 205,12 segundos (aprox. 3:25): evolución y vistas aéreas de la obra, con logotipos de Serrot, Herysan, HEMSA y San Fernando.",
        "proposed_use": "Vídeo de obra y recorrido con dron en la ficha de las 81 viviendas.",
        "basis": "El fotograma inicial dice literalmente 'Construcción de 81 viviendas protegidas'. Herysan confirma que ejecutó con Serrot esta promoción de HEMSA en Ronda del Estero.",
        "evidence": [PUBLIC_81, "migration/media-inventory/previews/video-2-contacto.jpg"],
        "preview": "migration/media-inventory/previews/video-2-contacto.jpg",
    },
}

manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
originals = {entry["name"]: entry for entry in manifest["original_media"]}
missing = set(originals) - set(classification)
extra = set(classification) - set(originals)
if missing or extra:
    raise RuntimeError(f"Clasificación incompleta. Faltan={sorted(missing)}; sobran={sorted(extra)}")

files = []
for name, original in originals.items():
    item = classification[name]
    promotion = promotions[item["promotion_id"]]
    files.append({
        "file": name,
        "type": "video" if name.lower().endswith(".mp4") else "image",
        "bytes": original["bytes"],
        "sha256": original["sha256"],
        "promotion_id": item["promotion_id"],
        "promotion": promotion["name"],
        "association_status": "confirmada",
        "content": item["content"],
        "proposed_section": promotion["proposed_section"],
        "proposed_use": item["proposed_use"],
        "confirmation_basis": item["basis"],
        "evidence": item["evidence"],
        "backup_path": original["backup_path"],
        "preview": item["preview"],
        "integration_status": "no_incorporado_pendiente_de_autorizacion_expresa",
    })

inventory = {
    "created_at": datetime.now().astimezone().isoformat(),
    "scope": "Clasificación documental y visual de los 11 archivos originales. No integra ni modifica contenido de la web.",
    "web_files_modified": False,
    "file_count": len(files),
    "image_count": sum(item["type"] == "image" for item in files),
    "video_count": sum(item["type"] == "video" for item in files),
    "promotions": promotions,
    "files": files,
    "not_represented": [{
        "name": "Residencial Hércules — 216 viviendas protegidas",
        "status": "Ninguno de estos 11 archivos se asigna a esta promoción."
    }],
}

OUT_DIR.mkdir(parents=True, exist_ok=True)
json_path = OUT_DIR / "media-inventory.json"
json_path.write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

csv_path = OUT_DIR / "media-inventory.csv"
with csv_path.open("w", encoding="utf-8-sig", newline="") as handle:
    writer = csv.DictWriter(handle, fieldnames=[
        "archivo", "tipo", "promocion", "asociacion", "contenido",
        "seccion_propuesta", "uso_propuesto", "fundamento", "evidencia",
        "ruta_respaldo", "vista_previa", "integracion"
    ])
    writer.writeheader()
    for item in files:
        writer.writerow({
            "archivo": item["file"],
            "tipo": item["type"],
            "promocion": item["promotion"],
            "asociacion": item["association_status"],
            "contenido": item["content"],
            "seccion_propuesta": item["proposed_section"],
            "uso_propuesto": item["proposed_use"],
            "fundamento": item["confirmation_basis"],
            "evidencia": " | ".join(item["evidence"]),
            "ruta_respaldo": item["backup_path"],
            "vista_previa": item["preview"],
            "integracion": item["integration_status"],
        })

print(f"Inventario JSON: {json_path}")
print(f"Inventario CSV: {csv_path}")
print(f"Archivos clasificados: {len(files)} (9 imágenes y 2 vídeos)")
print("Archivos web modificados: no")
