from __future__ import annotations

import argparse
import hashlib
import json
import re
import time
import unicodedata
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import unquote, urlparse, urlunparse

import requests
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
INVENTORY = ROOT / "migration" / "inventory" / "report.json"
DESTINATION = ROOT / "public" / "documents"
MANIFEST = ROOT / "migration" / "manifest.json"
USER_AGENT = "Mozilla/5.0 (compatible; HEMSA-Website-Migration/1.0; document migration)"

GENERIC_PAGES = {
    "/", "/aviso-legal", "/ayuda-a-domicilio", "/blog", "/cita-previa",
    "/contacto", "/contacto-boton-inicio", "/cookies", "/empleo", "/empleo/",
    "/nueva-pagina", "/privacy", "/sobre-nosotros", "/sogescar",
}

CATEGORY_RULES = [
    (("bolsa-", "promoción-interna", "prueba-de-empleo", "copia-de-empleo"), "empleo"),
    (("garajes-", "garages-"), "garajes"),
    (("venta-vivienda", "viviendas", "registro-demandantes", "ayudas-y-subvenciones", "oficina-defensa", "compra-viviendas", "prueba-vivienda"), "vivienda"),
    (("contratos", "contratos-", "convenios"), "contratacion"),
    (("ayuda-a-domicilio",), "sad"),
    (("aviso-legal", "privacy", "cookies"), "legal"),
    (("informacion-", "información-", "presupuestos", "cuentas", "control-finaciero", "publicidad", "gastos-publicos"), "transparencia"),
]


def canonical_url(url: str) -> str:
    parsed = urlparse(url)
    # Unifica caracteres Unicode y su equivalente codificado sin romper el doble
    # escape (%2520) que utiliza el CDN de IONOS para algunos nombres.
    normalized_path = requests.utils.quote(unquote(parsed.path), safe="/%")
    return urlunparse((parsed.scheme, parsed.netloc.lower(), normalized_path, "", "", ""))


def page_path(url: str) -> str:
    return urlparse(url).path or "/"


def source_key(source: dict) -> tuple[str, str]:
    return source.get("page", ""), source.get("text", "")


def category_for(document: dict) -> str:
    name = unquote(unquote(urlparse(document["canonical_url"]).path)).lower()
    if "estatutos" in name and "hemsa" in name:
        return "transparencia"
    paths = [page_path(source["page"]) for source in document["sources"]]
    specific = [path for path in paths if path not in GENERIC_PAGES and not path.startswith("/noticias/")]
    for path in specific + paths:
        for needles, category in CATEGORY_RULES:
            if any(needle in path.lower() for needle in needles):
                return category
    return "otros"


def decoded_file_name(url: str) -> str:
    name = Path(urlparse(url).path).name
    for _ in range(2):
        name = unquote(name)
    return name.replace("+", " ")


def slugify(value: str) -> str:
    value = re.sub(r"^report[_\s-]*", "", value, flags=re.IGNORECASE)
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return value or "documento"


def clean_title(value: str) -> str:
    value = re.sub(r"\s*(Elemento de lista|Item Link)\s*\d*", "", value or "", flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", value).strip()


def document_title(document: dict) -> str:
    labels = [clean_title(source.get("text", "")) for source in document["sources"]]
    labels = [label for label in labels if len(label) >= 4]
    if labels:
        labels.sort(key=lambda label: (len(label) > 120, len(label)))
        return labels[0]
    return Path(decoded_file_name(document["canonical_url"])).stem.replace("_", " ")


def group_inventory() -> list[dict]:
    report = json.loads(INVENTORY.read_text(encoding="utf-8"))
    grouped: dict[str, dict] = {}
    for item in report["pdfs"]:
        canonical = canonical_url(item["url"])
        document = grouped.setdefault(canonical, {
            "canonical_url": canonical,
            "original_url": item["url"],
            "signed_urls": [],
            "sources": [],
        })
        if item["url"] not in document["signed_urls"]:
            document["signed_urls"].append(item["url"])
        if urlparse(item["url"]).query and not urlparse(document["original_url"]).query:
            document["original_url"] = item["url"]
        for source in item["sources"]:
            if source_key(source) not in {source_key(existing) for existing in document["sources"]}:
                document["sources"].append(source)

    documents = list(grouped.values())
    used_paths: set[str] = set()
    for document in documents:
        document["category"] = category_for(document)
        document["title"] = document_title(document)
        original_name = decoded_file_name(document["canonical_url"])
        slug = slugify(Path(original_name).stem)
        digest = hashlib.sha256(document["canonical_url"].encode()).hexdigest()[:8]
        if len(slug) > 105:
            slug = f"{slug[:96].rstrip('-')}-{digest}"
        relative = Path(document["category"]) / f"{slug}.pdf"
        if str(relative).lower() in used_paths:
            relative = Path(document["category"]) / f"{slug}-{digest}.pdf"
        used_paths.add(str(relative).lower())
        document["local_path"] = "/" + relative.as_posix()
    return sorted(documents, key=lambda item: (item["category"], item["title"].lower(), item["canonical_url"]))


def download(document: dict) -> dict:
    destination = ROOT / "public" / "documents" / document["local_path"].lstrip("/")
    destination.parent.mkdir(parents=True, exist_ok=True)
    result = {**document, "status": "pending"}
    last_error = ""
    for attempt in range(3):
        try:
            response = requests.get(
                document["original_url"],
                headers={"User-Agent": USER_AGENT, "Accept": "application/pdf,*/*;q=0.8"},
                timeout=60,
            )
            content_type = response.headers.get("Content-Type", "")
            if not response.ok:
                raise ValueError(f"HTTP {response.status_code}")
            if not response.content.startswith(b"%PDF"):
                raise ValueError(f"La respuesta no tiene firma PDF ({content_type or 'sin Content-Type'})")
            destination.write_bytes(response.content)
            reader = PdfReader(destination)
            result.update({
                "status": "ok",
                "content_type": content_type,
                "bytes": len(response.content),
                "sha256": hashlib.sha256(response.content).hexdigest(),
                "pages": len(reader.pages),
                "encrypted": bool(reader.is_encrypted),
            })
            return result
        except Exception as error:  # Se registra cada fallo; no se sustituye por un archivo vacío.
            last_error = str(error)
            destination.unlink(missing_ok=True)
            if attempt < 2:
                time.sleep(1.2 * (attempt + 1))
    result.update({"status": "error", "error": last_error})
    return result


def merge_duplicates(results: list[dict]) -> tuple[list[dict], list[dict]]:
    by_hash: dict[str, list[dict]] = defaultdict(list)
    for result in results:
        if result["status"] == "ok":
            by_hash[result["sha256"]].append(result)
    duplicates = []
    rejected: set[int] = set()
    for items in by_hash.values():
        if len(items) < 2:
            continue
        items.sort(key=lambda item: (len(item["local_path"]), item["local_path"]))
        winner = items[0]
        for duplicate in items[1:]:
            duplicates.append({
                "sha256": winner["sha256"],
                "kept": winner["local_path"],
                "removed": duplicate["local_path"],
                "canonical_url": duplicate["canonical_url"],
            })
            (ROOT / "public" / "documents" / duplicate["local_path"].lstrip("/")).unlink(missing_ok=True)
            rejected.add(id(duplicate))
            winner["signed_urls"] = sorted(set(winner["signed_urls"] + duplicate["signed_urls"]))
            known_sources = {source_key(source) for source in winner["sources"]}
            winner["sources"].extend(source for source in duplicate["sources"] if source_key(source) not in known_sources)
            winner.setdefault("content_aliases", []).append(duplicate["canonical_url"])
    return [result for result in results if id(result) not in rejected], duplicates


def main() -> None:
    parser = argparse.ArgumentParser(description="Descarga y verifica los PDF inventariados de la web pública de HEMSA.")
    parser.add_argument("--dry-run", action="store_true", help="Solo agrupa y resume el inventario; no descarga archivos.")
    args = parser.parse_args()
    documents = group_inventory()
    print(json.dumps({
        "signed_links": sum(len(document["signed_urls"]) for document in documents),
        "unique_paths": len(documents),
        "by_category": dict(sorted(Counter(document["category"] for document in documents).items())),
        "source_pages_with_documents": len({source["page"] for document in documents for source in document["sources"]}),
    }, ensure_ascii=False, indent=2))
    if args.dry_run:
        for document in documents:
            print(f"{document['category']:14} {document['local_path']}  <-  {document['title'][:85]}")
        return

    DESTINATION.mkdir(parents=True, exist_ok=True)
    results = []
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {executor.submit(download, document): document for document in documents}
        for index, future in enumerate(as_completed(futures), start=1):
            result = future.result()
            results.append(result)
            print(f"[{index:03}/{len(documents):03}] {result['status'].upper():5} {result['local_path']}")

    unique_results, duplicates = merge_duplicates(results)
    unique_results.sort(key=lambda item: (item["category"], item["title"].lower(), item["canonical_url"]))
    errors = [result for result in unique_results if result["status"] != "ok"]
    manifest = {
        "source": "https://www.hemsasanfernando.es/",
        "signed_links_in_inventory": sum(len(document["signed_urls"]) for document in documents),
        "unique_source_paths": len(documents),
        "unique_files": len(unique_results) - len(errors),
        "failed_files": len(errors),
        "content_duplicates_removed": len(duplicates),
        "total_bytes": sum(result.get("bytes", 0) for result in unique_results),
        "categories": dict(sorted(Counter(result["category"] for result in unique_results if result["status"] == "ok").items())),
        "documents": unique_results,
        "duplicates": duplicates,
    }
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({key: value for key, value in manifest.items() if key not in {"documents", "duplicates"}}, ensure_ascii=False, indent=2))
    if errors:
        for error in errors:
            print(f"ERROR {error['canonical_url']}: {error.get('error', 'desconocido')}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
