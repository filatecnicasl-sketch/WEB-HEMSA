from __future__ import annotations

import csv
import json
import re
import time
from collections import deque
from pathlib import Path
from urllib.parse import urldefrag, urljoin, urlparse, urlunparse

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "migration" / "inventory"
OUT.mkdir(parents=True, exist_ok=True)
BASE = "https://www.hemsasanfernando.es/"
ALLOWED_HOSTS = {"hemsasanfernando.es", "www.hemsasanfernando.es"}
MAX_PAGES = 250

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (compatible; HEMSA-Website-Migration/1.0; document inventory)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
})


def clean_page_url(url: str) -> str | None:
    url, _ = urldefrag(url)
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or parsed.hostname not in ALLOWED_HOSTS:
        return None
    path = re.sub(r"/+", "/", parsed.path or "/")
    if Path(path).suffix.lower() in {".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp", ".zip", ".doc", ".docx", ".xls", ".xlsx"}:
        return None
    return urlunparse(("https", "www.hemsasanfernando.es", path, "", parsed.query, ""))


def looks_like_pdf(url: str, content_type: str = "") -> bool:
    return urlparse(url).path.lower().endswith(".pdf") or "application/pdf" in content_type.lower()


queue = deque([BASE])
queued = {BASE}
pages: list[dict] = []
pdfs: dict[str, dict] = {}
errors: list[dict] = []

# El sitemap ayuda a descubrir páginas que no estén enlazadas desde la portada.
try:
    response = session.get(urljoin(BASE, "sitemap.xml"), timeout=30)
    sitemap_status = response.status_code
    if response.ok:
        soup = BeautifulSoup(response.content, "xml")
        for location in soup.find_all("loc"):
            page_url = clean_page_url(location.get_text(strip=True))
            if page_url and page_url not in queued:
                queue.append(page_url)
                queued.add(page_url)
except requests.RequestException as error:
    sitemap_status = str(error)

while queue and len(pages) < MAX_PAGES:
    page_url = queue.popleft()
    try:
        response = session.get(page_url, timeout=30)
        content_type = response.headers.get("Content-Type", "")
        if not response.ok:
            errors.append({"url": page_url, "status": response.status_code})
            continue
        if looks_like_pdf(response.url, content_type):
            pdfs.setdefault(response.url, {"url": response.url, "sources": []})["sources"].append({"page": page_url, "text": ""})
            continue
        if "text/html" not in content_type.lower():
            continue
        soup = BeautifulSoup(response.text, "html.parser")
        title = soup.title.get_text(" ", strip=True) if soup.title else ""
        pages.append({"url": page_url, "title": title})
        for anchor in soup.find_all("a", href=True):
            href = anchor.get("href", "").strip()
            if not href or href.startswith(("mailto:", "tel:", "javascript:", "#")):
                continue
            absolute = urljoin(response.url, href)
            absolute, _ = urldefrag(absolute)
            text = anchor.get_text(" ", strip=True)
            if looks_like_pdf(absolute):
                item = pdfs.setdefault(absolute, {"url": absolute, "sources": []})
                source = {"page": page_url, "text": text}
                if source not in item["sources"]:
                    item["sources"].append(source)
                continue
            internal = clean_page_url(absolute)
            if internal and internal not in queued:
                queue.append(internal)
                queued.add(internal)
        time.sleep(0.12)
    except requests.RequestException as error:
        errors.append({"url": page_url, "error": str(error)})

pdf_rows = []
for item in sorted(pdfs.values(), key=lambda entry: entry["url"]):
    if item["sources"]:
        for source in item["sources"]:
            pdf_rows.append({"pdf_url": item["url"], "source_page": source["page"], "anchor_text": source["text"]})
    else:
        pdf_rows.append({"pdf_url": item["url"], "source_page": "", "anchor_text": ""})

with (OUT / "pdfs.csv").open("w", encoding="utf-8-sig", newline="") as handle:
    writer = csv.DictWriter(handle, fieldnames=["pdf_url", "source_page", "anchor_text"])
    writer.writeheader()
    writer.writerows(pdf_rows)

report = {
    "base": BASE,
    "sitemap_status": sitemap_status,
    "pages_discovered": len(queued),
    "pages_read": len(pages),
    "unique_pdfs": len(pdfs),
    "max_pages_reached": bool(queue),
    "pages": pages,
    "pdfs": list(pdfs.values()),
    "errors": errors,
}
(OUT / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({key: value for key, value in report.items() if key not in {"pages", "pdfs"}}, ensure_ascii=False, indent=2))
for item in list(pdfs.values())[:25]:
    print(item["url"])
