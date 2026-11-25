from __future__ import annotations

import hashlib
import hmac
import json
import mimetypes
import os
import re
import secrets
import shutil
import smtplib
import sqlite3
import ssl
import sys
import threading
import time
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from email.parser import BytesParser
from email.policy import default
from email.utils import formatdate, make_msgid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import quote, unquote, urlencode, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
LOCAL = ROOT / "local-server"
DATA = Path(os.environ.get("HEMSA_DATA_DIR", str(LOCAL / "data"))).expanduser().resolve()
PRIVATE = Path(
    os.environ.get(
        "HEMSA_PRIVATE_DIR",
        str(DATA / "private") if "HEMSA_DATA_DIR" in os.environ else str(LOCAL / "private"),
    )
).expanduser().resolve()
DB_PATH = DATA / "hemsa.db"
MAIL_CONFIG_PATH = PRIVATE / "mail.json"
SEED_PATH = ROOT / "integration" / "editorial-seed.json"
DIST = (ROOT / "dist").resolve()
HOST = os.environ.get("HEMSA_HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", os.environ.get("HEMSA_LOCAL_API_PORT", "5174")))
MAX_JSON = 1024 * 1024
MAX_PDF = 15 * 1024 * 1024
MAX_MULTIPART = MAX_PDF + 1024 * 1024
STATIC_MIME = {
    ".css": "text/css; charset=utf-8",
    ".gif": "image/gif",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".map": "application/json; charset=utf-8",
    ".mp4": "video/mp4",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".txt": "text/plain; charset=utf-8",
    ".webp": "image/webp",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
}
LOCK = threading.RLock()
LOGIN_ATTEMPTS: dict[str, list[float]] = {}
FORM_ATTEMPTS: dict[str, list[float]] = {}
NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

INITIAL_CONTENT = {
    "notice": {"enabled": False, "label": "Actualidad", "text": "Convocatorias 2026 del Servicio de Ayuda a Domicilio", "link": "/empleo"},
    "hero": {
        "eyebrow": "Tu empresa municipal en La Isla",
        "title": "Cerca de ti, en cada etapa de la vida",
        "text": "Te ayudamos a encontrar casa, a vender la tuya y a cuidar de tus mayores en su hogar. Somos HEMSA, y estamos aquí para las personas de San Fernando.",
    },
    "contact": {
        "address": "Avenida San Juan Bosco, 46. 11100 San Fernando (Cádiz)",
        "phone": "956 945 000",
        "email": "correo@hemsasanfernando.es",
        "schedule": "Lunes a viernes, de 9:00 a 13:30 h",
    },
}

GRANT_KEYS = {"id", "category", "title", "summary", "publicationDate", "deadlineDate", "deadlineLabel", "note", "contentUpdatedAt", "sourceUrl", "sourceLabel", "icon", "documents"}
JOB_KEYS = {"id", "title", "description", "publicationDate", "deadlineDate", "statusLabel", "displayGroup", "documents"}
DOC_KEYS = {"id", "title", "description", "pages", "bytes", "kind", "source", "url"}
DOC_KINDS = {"bases", "formulario", "listado", "resolucion", "resultado", "otro"}
ICON_NAMES = {"Accessibility", "HeartHandshake", "KeyRound", "Building2", "Megaphone"}


class ApiError(Exception):
    def __init__(self, status: int, code: str, message: str, fields: dict | None = None):
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message
        self.fields = fields


def fail(status: int, code: str, message: str, fields: dict | None = None):
    raise ApiError(status, code, message, fields)


def canonical(value) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def same(a, b) -> bool:
    return canonical(a) == canonical(b)


def require_keys(value: dict, required: set, allowed: set | None = None, prefix: str = "item"):
    if not isinstance(value, dict):
        fail(400, "VALIDATION_ERROR", "El contenido debe ser un objeto JSON")
    allowed = required if allowed is None else allowed
    unknown = set(value) - allowed
    missing = required - set(value)
    if unknown:
        fail(400, "VALIDATION_ERROR", "Se han recibido claves desconocidas", {f"{prefix}.{key}": "Clave no admitida" for key in sorted(unknown)})
    if missing:
        fail(400, "VALIDATION_ERROR", "Faltan campos obligatorios", {f"{prefix}.{key}": "Campo obligatorio" for key in sorted(missing)})


def text(value, name: str, minimum: int, maximum: int, nullable: bool = False) -> str | None:
    if value is None and nullable:
        return None
    if not isinstance(value, str):
        fail(400, "VALIDATION_ERROR", f"El campo {name} debe ser texto", {name: "Introduce un texto válido"})
    value = value.strip()
    if not minimum <= len(value) <= maximum:
        fail(400, "VALIDATION_ERROR", f"El campo {name} no tiene una longitud válida", {name: f"Entre {minimum} y {maximum} caracteres"})
    return value


def date_value(value, name: str, nullable: bool = False):
    if value is None and nullable:
        return None
    value = text(value, name, 10, 10)
    try:
        datetime.strptime(value, "%Y-%m-%d")
    except ValueError:
        fail(400, "VALIDATION_ERROR", f"El campo {name} debe tener formato AAAA-MM-DD", {name: "Fecha no válida"})
    return value


def integer(value, name: str, minimum: int = 1, maximum: int | None = None, nullable: bool = False):
    if value is None and nullable:
        return None
    if isinstance(value, bool) or not isinstance(value, int) or value < minimum or (maximum is not None and value > maximum):
        fail(400, "VALIDATION_ERROR", f"El campo {name} debe ser un número entero válido", {name: "Número no válido"})
    return value


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1, dklen=64)
    return f"scrypt$16384$8$1${salt.hex()}${digest.hex()}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, n, r, p, salt, expected = encoded.split("$")
        if algorithm != "scrypt":
            return False
        actual = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=int(n), r=int(r), p=int(p), dklen=len(bytes.fromhex(expected)))
        return hmac.compare_digest(actual.hex(), expected)
    except (ValueError, TypeError):
        return False


def public_user(row) -> dict:
    return {"id": str(row["id"]), "email": row["email"], "role": row["role"]}


def email_address(value, name: str) -> str:
    value = text(value, name, 3, 160).lower()
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
        fail(400, "VALIDATION_ERROR", "Introduce un correo electrónico válido", {name: "Correo no válido"})
    return value


def single_line(value: str, name: str) -> str:
    if "\r" in value or "\n" in value:
        fail(400, "VALIDATION_ERROR", f"El campo {name} no admite saltos de línea", {name: "Texto no válido"})
    return value


MAIL_DEFAULTS = {
    "enabled": False,
    "method": "smtp",
    "host": "smtp.office365.com",
    "port": 587,
    "security": "starttls",
    "username": "notificaciones@hemsasanfernando.es",
    "password": "",
    "sender": "notificaciones@hemsasanfernando.es",
    "recipient": "correo@hemsasanfernando.es",
    "tenantId": "",
    "clientId": "",
    "clientSecret": "",
}
MAIL_ENVIRONMENT = {
    "enabled": "HEMSA_SMTP_ENABLED", "method": "HEMSA_MAIL_METHOD",
    "host": "HEMSA_SMTP_HOST", "port": "HEMSA_SMTP_PORT",
    "security": "HEMSA_SMTP_SECURITY", "username": "HEMSA_SMTP_USERNAME", "password": "HEMSA_SMTP_PASSWORD",
    "sender": "HEMSA_SMTP_SENDER", "recipient": "HEMSA_MAIL_RECIPIENT",
    "tenantId": "HEMSA_GRAPH_TENANT_ID", "clientId": "HEMSA_GRAPH_CLIENT_ID", "clientSecret": "HEMSA_GRAPH_CLIENT_SECRET",
}
MAIL_SECURITY_OPTIONS = {"ssl", "starttls", "none"}
MAIL_METHODS = {"smtp", "graph"}
MAIL_EMAIL_PATTERN = r"[^\s@]+@[^\s@]+\.[^\s@]+"


def load_mail_settings() -> dict:
    """Carga la configuración guardada sin lanzar errores: valores base -> entorno -> archivo."""
    settings = dict(MAIL_DEFAULTS)
    for key, variable in MAIL_ENVIRONMENT.items():
        if variable in os.environ:
            settings[key] = os.environ[variable]
    try:
        if MAIL_CONFIG_PATH.exists():
            saved = json.loads(MAIL_CONFIG_PATH.read_text(encoding="utf-8"))
            if isinstance(saved, dict):
                settings.update({key: saved[key] for key in MAIL_DEFAULTS if key in saved})
    except (json.JSONDecodeError, OSError):
        pass
    if isinstance(settings["enabled"], str):
        settings["enabled"] = settings["enabled"].strip().lower() in {"1", "true", "yes", "on"}
    settings["enabled"] = bool(settings["enabled"])
    try:
        settings["port"] = int(settings["port"])
    except (ValueError, TypeError):
        settings["port"] = 0
    for key in ("host", "security", "username", "password", "sender", "recipient", "method", "tenantId", "clientId", "clientSecret"):
        if not isinstance(settings[key], str):
            settings[key] = ""
    settings["security"] = settings["security"].strip().lower()
    settings["method"] = settings["method"].strip().lower()
    if settings["method"] not in MAIL_METHODS:
        settings["method"] = "smtp"
    return settings


def check_mail_settings(settings: dict, strict_pair: bool = True) -> dict:
    """Devuelve los errores de la configuración, o un diccionario vacío si es válida."""
    errors = {}
    for key in ("sender", "recipient"):
        value = settings[key].strip().lower()
        if not value:
            errors[key] = "Indica una dirección de correo"
        elif not re.fullmatch(MAIL_EMAIL_PATTERN, value):
            errors[key] = "Introduce un correo válido"
    if settings["method"] == "graph":
        if not settings["tenantId"].strip():
            errors["tenantId"] = "Indica el identificador del inquilino (Tenant ID)"
        if not settings["clientId"].strip():
            errors["clientId"] = "Indica el identificador de la aplicación (Client ID)"
        if strict_pair and not settings["clientSecret"]:
            errors["clientSecret"] = "Falta el secreto de la aplicación"
    else:
        if not 1 <= settings["port"] <= 65535:
            errors["port"] = "Puerto no válido"
        if settings["security"] not in MAIL_SECURITY_OPTIONS:
            errors["security"] = "Elige SSL, STARTTLS o sin cifrado"
        if not settings["host"].strip():
            errors["host"] = "Indica el servidor de correo saliente"
        if strict_pair and bool(settings["username"].strip()) != bool(settings["password"]):
            errors["password"] = "Indica usuario y contraseña, o deja ambos vacíos"
    return errors


def public_mail_settings(settings: dict) -> dict:
    """Configuración apta para el panel: nunca incluye la contraseña ni el secreto."""
    return {"settings": {
        "enabled": settings["enabled"],
        "method": settings["method"],
        "host": settings["host"],
        "port": settings["port"],
        "security": settings["security"],
        "username": settings["username"],
        "sender": settings["sender"],
        "recipient": settings["recipient"],
        "tenantId": settings["tenantId"],
        "clientId": settings["clientId"],
        "passwordSet": bool(settings["password"]),
        "secretSet": bool(settings["clientSecret"]),
    }}


def save_mail_settings(settings: dict):
    PRIVATE.mkdir(parents=True, exist_ok=True)
    MAIL_CONFIG_PATH.write_text(json.dumps(settings, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    try:
        os.chmod(MAIL_CONFIG_PATH, 0o600)
    except OSError:
        pass


def mail_settings() -> dict:
    settings = load_mail_settings()
    if not settings["enabled"]:
        fail(503, "MAIL_NOT_CONFIGURED", "El envío de correo está desactivado. Actívalo desde el gestor de contenidos")
    if check_mail_settings(settings):
        fail(503, "MAIL_NOT_CONFIGURED", "El envío de correo no está configurado correctamente")
    settings["sender"] = settings["sender"].strip().lower()
    settings["recipient"] = settings["recipient"].strip().lower()
    settings["username"] = settings["username"].strip()
    return settings


def graph_access_token(settings: dict) -> str:
    body = urlencode({
        "client_id": settings["clientId"],
        "client_secret": settings["clientSecret"],
        "scope": "https://graph.microsoft.com/.default",
        "grant_type": "client_credentials",
    }).encode("utf-8")
    request = Request(
        f"https://login.microsoftonline.com/{quote(settings['tenantId'].strip())}/oauth2/v2.0/token",
        data=body, headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    with urlopen(request, timeout=20) as response:
        payload = json.loads(response.read().decode("utf-8"))
    token = payload.get("access_token")
    if not isinstance(token, str) or not token:
        raise RuntimeError("Graph no devolvió un token válido")
    return token


def deliver_email_graph(settings: dict, subject: str, body: str, reply_to: str, reference: str):
    message = {
        "message": {
            "subject": subject,
            "body": {"contentType": "Text", "content": body},
            "toRecipients": [{"emailAddress": {"address": settings["recipient"]}}],
            "replyTo": [{"emailAddress": {"address": reply_to}}],
            "internetMessageHeaders": [{"name": "X-HEMSA-Reference", "value": reference}],
        },
        "saveToSentItems": True,
    }
    try:
        token = graph_access_token(settings)
        request = Request(
            f"https://graph.microsoft.com/v1.0/users/{quote(settings['sender'])}/sendMail",
            data=json.dumps(message).encode("utf-8"),
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            method="POST",
        )
        with urlopen(request, timeout=20) as response:
            if response.status not in {200, 202}:
                raise RuntimeError(f"Graph respondió {response.status}")
    except Exception as error:
        print(f"Error de envío Graph: {type(error).__name__}", file=sys.stderr)
        fail(502, "MAIL_DELIVERY_FAILED", "No hemos podido enviar el mensaje. Inténtalo más tarde o contacta con HEMSA por teléfono")


def deliver_email(subject: str, body: str, reply_to: str, reference: str):
    settings = mail_settings()
    if settings["method"] == "graph":
        deliver_email_graph(settings, subject, body, reply_to, reference)
        return
    message = EmailMessage()
    message["From"] = settings["sender"]
    message["To"] = settings["recipient"]
    message["Reply-To"] = reply_to
    message["Subject"] = subject
    message["Date"] = formatdate(localtime=True)
    message["Message-ID"] = make_msgid("hemsa-web")
    message["X-HEMSA-Reference"] = reference
    message.set_content(body, subtype="plain", charset="utf-8")
    try:
        if settings["security"] == "ssl":
            smtp = smtplib.SMTP_SSL(settings["host"], settings["port"], timeout=20, context=ssl.create_default_context())
        else:
            smtp = smtplib.SMTP(settings["host"], settings["port"], timeout=20)
        with smtp:
            if settings["security"] == "starttls":
                smtp.starttls(context=ssl.create_default_context())
            if settings["username"]:
                smtp.login(settings["username"], settings["password"])
            smtp.send_message(message)
    except (smtplib.SMTPException, OSError) as error:
        print(f"Error de envío SMTP: {type(error).__name__}", file=sys.stderr)
        fail(502, "MAIL_DELIVERY_FAILED", "No hemos podido enviar el mensaje. Inténtalo más tarde o contacta con HEMSA por teléfono")


class Store:
    def __init__(self):
        DATA.mkdir(parents=True, exist_ok=True)
        PRIVATE.mkdir(parents=True, exist_ok=True)
        self.init_db()
        self.init_admin()
        self.init_content()
        self.init_editorial()

    def connect(self):
        connection = sqlite3.connect(DB_PATH, timeout=15)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA journal_mode = WAL")
        return connection

    def init_db(self):
        with self.connect() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, token_hash TEXT UNIQUE NOT NULL, admin_id INTEGER NOT NULL REFERENCES admins(id), expires_at TEXT NOT NULL, created_at TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS site_content (id INTEGER PRIMARY KEY CHECK(id=1), draft TEXT NOT NULL, published TEXT NOT NULL, version INTEGER NOT NULL, published_at TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS editorial (type TEXT NOT NULL, id TEXT NOT NULL, version INTEGER NOT NULL, status TEXT NOT NULL, draft TEXT NOT NULL, published TEXT, has_changes INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, first_published_at TEXT, last_published_at TEXT, archived_at TEXT, PRIMARY KEY(type,id));
                CREATE TABLE IF NOT EXISTS revisions (id TEXT PRIMARY KEY, type TEXT NOT NULL, owner_id TEXT NOT NULL, action TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL, created_by INTEGER NOT NULL REFERENCES admins(id));
                CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, owner_type TEXT NOT NULL, owner_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, pages INTEGER, bytes INTEGER NOT NULL, kind TEXT NOT NULL, source TEXT NOT NULL, url TEXT NOT NULL, data BLOB NOT NULL, created_at TEXT NOT NULL);
                CREATE INDEX IF NOT EXISTS idx_revisions_owner ON revisions(type,owner_id,created_at);
                CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_type,owner_id);
            """)

    def admin_credentials(self):
        email = os.environ.get("HEMSA_ADMIN_EMAIL")
        password = os.environ.get("HEMSA_ADMIN_PASSWORD")
        credential_path = PRIVATE / "admin.json"
        if not email or not password:
            if credential_path.exists():
                saved = json.loads(credential_path.read_text(encoding="utf-8"))
                email, password = saved["email"], saved["password"]
            else:
                email = "admin@hemsa.local"
                password = secrets.token_urlsafe(24)
                credential_path.write_text(json.dumps({"email": email, "password": password, "localOnly": True}, indent=2), encoding="utf-8")
                try:
                    os.chmod(credential_path, 0o600)
                except OSError:
                    pass
        return email.strip().lower(), password

    def init_admin(self):
        email, password = self.admin_credentials()
        with LOCK, self.connect() as db:
            if not db.execute("SELECT 1 FROM admins LIMIT 1").fetchone():
                db.execute("INSERT INTO admins(email,password_hash,role,created_at) VALUES(?,?,?,?)", (email, hash_password(password), "admin", NOW()))

    def admin_id(self):
        with self.connect() as db:
            return db.execute("SELECT id FROM admins ORDER BY id LIMIT 1").fetchone()[0]

    def add_revision(self, db, kind: str, owner: str, action: str, content: dict):
        revision_id = secrets.token_hex(16)
        db.execute("INSERT INTO revisions(id,type,owner_id,action,content,created_at,created_by) VALUES(?,?,?,?,?,?,?)", (revision_id, kind, owner, action, canonical(content), NOW(), self.admin_id()))
        return revision_id

    def init_content(self):
        with LOCK, self.connect() as db:
            if not db.execute("SELECT 1 FROM site_content WHERE id=1").fetchone():
                db.execute("INSERT INTO site_content(id,draft,published,version,published_at) VALUES(1,?,?,1,?)", (canonical(INITIAL_CONTENT), canonical(INITIAL_CONTENT), NOW()))
                self.add_revision(db, "content", "site", "initial", INITIAL_CONTENT)

    def init_editorial(self):
        seed = json.loads(SEED_PATH.read_text(encoding="utf-8"))
        with LOCK, self.connect() as db:
            for kind in ("grants", "jobs"):
                for item in seed[kind]:
                    if db.execute("SELECT 1 FROM editorial WHERE type=? AND id=?", (kind, item["id"])).fetchone():
                        continue
                    timestamp = NOW()
                    db.execute("INSERT INTO editorial(type,id,version,status,draft,published,has_changes,created_at,updated_at,first_published_at,last_published_at) VALUES(?,?,1,'published',?,?,0,?,?,?,?)", (kind, item["id"], canonical(item), canonical(item), timestamp, timestamp, timestamp, timestamp))
                    self.add_revision(db, kind, item["id"], "initial", item)

    def content_state(self, row=None):
        with self.connect() as db:
            row = row or db.execute("SELECT * FROM site_content WHERE id=1").fetchone()
            draft, published = json.loads(row["draft"]), json.loads(row["published"])
            return {"draft": draft, "published": published, "publishedAt": row["published_at"], "version": row["version"], "hasUnpublishedChanges": not same(draft, published)}

    def editorial_item(self, row) -> dict:
        draft = json.loads(row["draft"])
        published = json.loads(row["published"]) if row["published"] else None
        return {
            "version": row["version"], "status": row["status"], "hasUnpublishedChanges": bool(row["has_changes"]),
            "createdAt": row["created_at"], "updatedAt": row["updated_at"], "firstPublishedAt": row["first_published_at"],
            "lastPublishedAt": row["last_published_at"], "archivedAt": row["archived_at"], "draft": draft, "published": published,
        }

    def get_editorial_row(self, db, kind: str, item_id: str):
        row = db.execute("SELECT * FROM editorial WHERE type=? AND id=?", (kind, item_id)).fetchone()
        if not row:
            fail(404, "NOT_FOUND", "No se ha encontrado el contenido solicitado")
        return row

    def user_for_session(self, token: str | None):
        if not token:
            fail(401, "UNAUTHENTICATED", "Debes iniciar sesión para continuar")
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        with self.connect() as db:
            row = db.execute("SELECT a.*,s.expires_at FROM sessions s JOIN admins a ON a.id=s.admin_id WHERE s.token_hash=? AND a.active=1", (token_hash,)).fetchone()
            if not row or datetime.fromisoformat(row["expires_at"].replace("Z", "+00:00")) <= datetime.now(timezone.utc):
                fail(401, "UNAUTHENTICATED", "La sesión no es válida o ha caducado")
            if row["role"] != "admin":
                fail(403, "FORBIDDEN", "No tienes permisos para esta operación")
            return row

    def revision_summaries(self, kind: str, owner: str):
        with self.connect() as db:
            rows = db.execute("SELECT r.id,r.action,r.created_at,a.id AS admin_id,a.email,a.role FROM revisions r JOIN admins a ON a.id=r.created_by WHERE r.type=? AND r.owner_id=? ORDER BY r.created_at DESC,r.rowid DESC", (kind, owner)).fetchall()
            return {"revisions": [{"id": row["id"], "action": row["action"], "createdAt": row["created_at"], "createdBy": {"id": str(row["admin_id"]), "email": row["email"], "role": row["role"]}} for row in rows]}


STORE = Store()


def validate_content(content):
    require_keys(content, {"notice", "hero", "contact"}, prefix="content")
    require_keys(content["notice"], {"enabled", "label", "text", "link"}, prefix="notice")
    require_keys(content["hero"], {"eyebrow", "title", "text"}, prefix="hero")
    require_keys(content["contact"], {"address", "phone", "email", "schedule"}, prefix="contact")
    if not isinstance(content["notice"]["enabled"], bool):
        fail(400, "VALIDATION_ERROR", "El estado del aviso debe ser booleano", {"notice.enabled": "Valor no válido"})
    if content["notice"]["link"] not in {"/empleo", "/vivienda", "/servicios", "/contacto", "/ayudas-y-subvenciones"}:
        fail(400, "VALIDATION_ERROR", "El enlace del aviso no está permitido", {"notice.link": "Enlace no válido"})
    email = text(content["contact"]["email"], "contact.email", 3, 160).lower()
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        fail(400, "VALIDATION_ERROR", "Introduce un correo electrónico válido", {"contact.email": "Correo no válido"})
    phone = text(content["contact"]["phone"], "contact.phone", 7, 30)
    if not re.fullmatch(r"\+?[0-9 ]+", phone):
        fail(400, "VALIDATION_ERROR", "El teléfono solo admite dígitos, espacios y + inicial", {"contact.phone": "Teléfono no válido"})
    return {
        "notice": {"enabled": content["notice"]["enabled"], "label": text(content["notice"]["label"], "notice.label", 1, 30), "text": text(content["notice"]["text"], "notice.text", 1, 100), "link": content["notice"]["link"]},
        "hero": {"eyebrow": text(content["hero"]["eyebrow"], "hero.eyebrow", 1, 70), "title": text(content["hero"]["title"], "hero.title", 1, 100), "text": text(content["hero"]["text"], "hero.text", 1, 240)},
        "contact": {"address": text(content["contact"]["address"], "contact.address", 5, 160), "phone": phone, "email": email, "schedule": text(content["contact"]["schedule"], "contact.schedule", 5, 120)},
    }


def validate_document(document):
    require_keys(document, DOC_KEYS, prefix="document")
    source = document["source"]
    if source not in {"legacy", "uploaded"}:
        fail(400, "VALIDATION_ERROR", "Origen documental no válido")
    url = text(document["url"], "document.url", 1, 500)
    if source == "legacy" and not url.startswith("/documents/"):
        fail(400, "VALIDATION_ERROR", "La ruta del documento heredado no es válida")
    if source == "uploaded" and not url.startswith("/api/public/documents/"):
        fail(400, "VALIDATION_ERROR", "La ruta del documento subido no es válida")
    if document["kind"] not in DOC_KINDS:
        fail(400, "VALIDATION_ERROR", "El tipo de documento no es válido")
    return {
        "id": text(document["id"], "document.id", 1, 180), "title": text(document["title"], "document.title", 1, 220),
        "description": text(document["description"], "document.description", 0, 600), "pages": integer(document["pages"], "document.pages", 1, 10000, True),
        "bytes": integer(document["bytes"], "document.bytes", 1, MAX_PDF, True), "kind": document["kind"], "source": source, "url": url,
    }


def validate_editorial(item, kind: str):
    required = GRANT_KEYS if kind == "grants" else JOB_KEYS
    require_keys(item, required)
    item_id = text(item["id"], "id", 1, 160)
    if "/" in item_id or "\\" in item_id or item_id in {".", ".."} or any(ord(char) < 32 for char in item_id):
        fail(400, "VALIDATION_ERROR", "El identificador no es válido", {"id": "No uses barras ni caracteres de control"})
    if not isinstance(item["documents"], list) or len(item["documents"]) > (100 if kind == "grants" else 150):
        fail(400, "VALIDATION_ERROR", "La lista de documentos no es válida")
    documents = [validate_document(document) for document in item["documents"]]
    if len({document["id"] for document in documents}) != len(documents):
        fail(400, "VALIDATION_ERROR", "Hay documentos con identificadores duplicados")
    common = {"id": item_id, "publicationDate": date_value(item["publicationDate"], "publicationDate", kind == "jobs"), "deadlineDate": date_value(item["deadlineDate"], "deadlineDate", True), "documents": documents}
    if kind == "jobs":
        if item["displayGroup"] not in {"current", "archive"}:
            fail(400, "VALIDATION_ERROR", "La agrupación del proceso no es válida")
        return {**common, "title": text(item["title"], "title", 1, 240), "description": text(item["description"], "description", 1, 1200), "statusLabel": text(item["statusLabel"], "statusLabel", 1, 100), "displayGroup": item["displayGroup"]}
    if item["icon"] not in ICON_NAMES:
        fail(400, "VALIDATION_ERROR", "El icono seleccionado no es válido")
    source_url = item["sourceUrl"]
    if source_url is not None:
        source_url = text(source_url, "sourceUrl", 1, 1000)
        if not source_url.startswith("https://"):
            fail(400, "VALIDATION_ERROR", "La fuente oficial debe usar HTTPS", {"sourceUrl": "URL no válida"})
    return {
        **common, "category": text(item["category"], "category", 1, 120), "title": text(item["title"], "title", 1, 240),
        "summary": text(item["summary"], "summary", 1, 1200), "deadlineLabel": text(item["deadlineLabel"], "deadlineLabel", 1, 100),
        "note": text(item["note"], "note", 0, 2400), "contentUpdatedAt": date_value(item["contentUpdatedAt"], "contentUpdatedAt", True),
        "sourceUrl": source_url, "sourceLabel": text(item["sourceLabel"], "sourceLabel", 0, 180), "icon": item["icon"],
    }


def validate_document_ownership(db, row, item):
    known = {document["id"]: document for key in ("draft", "published") if row[key] for document in json.loads(row[key])["documents"]}
    for document in item["documents"]:
        if document["id"] not in known:
            fail(400, "VALIDATION_ERROR", "Los documentos nuevos deben incorporarse mediante la subida privada de PDF")
        if document["source"] == "uploaded":
            owned = db.execute("SELECT 1 FROM documents WHERE id=? AND owner_type=? AND owner_id=?", (document["id"], row["type"], row["id"])).fetchone()
            if not owned:
                fail(400, "VALIDATION_ERROR", "El documento no pertenece a este contenido")


def public_editorial(kind: str, item_id: str | None = None):
    with STORE.connect() as db:
        if item_id is not None:
            row = STORE.get_editorial_row(db, kind, item_id)
            if row["status"] != "published" or not row["published"]:
                fail(404, "NOT_FOUND", "No se ha encontrado el contenido solicitado")
            return {"item": json.loads(row["published"])}
        rows = db.execute("SELECT published FROM editorial WHERE type=? AND status='published' AND published IS NOT NULL ORDER BY rowid", (kind,)).fetchall()
        return {"items": [json.loads(row["published"]) for row in rows]}


def version_from(payload, name="baseVersion"):
    if not isinstance(payload, dict):
        fail(400, "VALIDATION_ERROR", "Solicitud JSON no válida")
    return integer(payload.get(name), name)


class Handler(BaseHTTPRequestHandler):
    server_version = "HEMSA-Local/1.0"
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        sys.stderr.write("[HEMSA local] " + (fmt % args) + "\n")

    def allowed_origin(self):
        origin = self.headers.get("Origin")
        if not origin:
            return None
        configured = {item.strip() for item in os.environ.get("HEMSA_FRONTEND_ORIGINS", "").split(",") if item.strip()}
        local = re.fullmatch(r"https?://(localhost|127\.0\.0\.1)(:\d+)?", origin)
        return origin if origin in configured or local else None

    def common_headers(self, private=False):
        origin = self.allowed_origin()
        if origin:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        if private:
            self.send_header("Cache-Control", "no-store")

    def static_path(self, request_path: str):
        if not DIST.is_dir() or "\x00" in request_path:
            return None
        relative = unquote(request_path).lstrip("/")
        candidate = (DIST / relative).resolve()
        try:
            candidate.relative_to(DIST)
        except ValueError:
            return None
        if candidate.is_file():
            return candidate
        if Path(relative).suffix:
            return None
        index = (DIST / "index.html").resolve()
        try:
            index.relative_to(DIST)
        except ValueError:
            return None
        return index if index.is_file() else None

    def serve_static(self, request_path: str) -> bool:
        path = self.static_path(request_path)
        if not path:
            return False
        suffix = path.suffix.lower()
        content_type = STATIC_MIME.get(suffix) or mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        size = path.stat().st_size
        self.send_response(200)
        self.common_headers()
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(size))
        if path.name == "index.html":
            self.send_header("Cache-Control", "no-cache")
        elif request_path.startswith("/assets/"):
            self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        else:
            self.send_header("Cache-Control", "public, max-age=3600")
        self.end_headers()
        if self.command != "HEAD":
            with path.open("rb") as handle:
                shutil.copyfileobj(handle, self.wfile, 1024 * 256)
        return True

    def send_json(self, status: int, data=None, private=False):
        payload = b"" if data is None else canonical(data).encode("utf-8")
        self.send_response(status)
        self.common_headers(private)
        if payload:
            self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        if payload:
            self.wfile.write(payload)

    def send_pdf(self, row, private=False):
        data = row["data"]
        self.send_response(200)
        self.common_headers(private)
        self.send_header("Content-Type", "application/pdf")
        self.send_header("Content-Disposition", f"inline; filename=documento-{row['id']}.pdf")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def read_body(self, maximum=MAX_JSON):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            fail(400, "VALIDATION_ERROR", "Longitud de solicitud no válida")
        if length > maximum:
            self.close_connection = True
            fail(413, "PAYLOAD_TOO_LARGE", "El archivo o contenido supera el límite permitido")
        return self.rfile.read(length)

    def read_json(self):
        try:
            return json.loads(self.read_body().decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            fail(400, "VALIDATION_ERROR", "El cuerpo debe contener JSON UTF-8 válido")

    def bearer(self):
        header = self.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return None
        return header[7:].strip()

    def require_admin(self):
        return STORE.user_for_session(self.bearer())

    def do_OPTIONS(self):
        self.send_response(204)
        self.common_headers()
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Max-Age", "600")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        self.dispatch("GET")

    def do_HEAD(self):
        self.dispatch("HEAD")

    def do_POST(self):
        self.dispatch("POST")

    def dispatch(self, method):
        try:
            path = urlparse(self.path).path
            private = path.startswith("/api/admin") or path.startswith("/api/auth/me") or path.startswith("/api/auth/logout")
            result = self.route(method, path)
            if result is None:
                if method in {"GET", "HEAD"} and not path.startswith("/api/") and self.serve_static(path):
                    return
                fail(404, "NOT_FOUND", "La ruta solicitada no existe")
            if isinstance(result, sqlite3.Row):
                self.send_pdf(result, private)
            else:
                status, data = result
                self.send_json(status, data, private)
        except ApiError as error:
            payload = {"error": {"code": error.code, "message": error.message}}
            if error.fields:
                payload["error"]["fields"] = error.fields
            self.send_json(error.status, payload, True)
        except (BrokenPipeError, ConnectionResetError):
            return
        except Exception as error:
            print(f"Error interno HEMSA: {type(error).__name__}: {error}", file=sys.stderr)
            self.send_json(500, {"error": {"code": "INTERNAL_ERROR", "message": "No se ha podido completar la operación"}}, True)

    def check_version(self, row, base_version):
        if row["version"] != base_version:
            fail(409, "VERSION_CONFLICT", "El contenido ha cambiado. Recarga el editor antes de continuar")

    def content_write(self, action):
        payload = self.read_json()
        self.require_admin()
        with LOCK, STORE.connect() as db:
            row = db.execute("SELECT * FROM site_content WHERE id=1").fetchone()
            if action == "draft":
                require_keys(payload, {"content", "baseVersion"})
                base_version = version_from(payload)
                self.check_version(row, base_version)
                content = validate_content(payload["content"])
                db.execute("UPDATE site_content SET draft=?,version=version+1 WHERE id=1", (canonical(content),))
            elif action == "discard":
                require_keys(payload, {"baseVersion"})
                self.check_version(row, version_from(payload))
                db.execute("UPDATE site_content SET draft=published,version=version+1 WHERE id=1")
            elif action == "publish":
                require_keys(payload, {"baseVersion"})
                self.check_version(row, version_from(payload))
                previous = json.loads(row["published"])
                draft = json.loads(row["draft"])
                STORE.add_revision(db, "content", "site", "backup", previous)
                STORE.add_revision(db, "content", "site", "publish", draft)
                db.execute("UPDATE site_content SET published=draft,published_at=?,version=version+1 WHERE id=1", (NOW(),))
            elif action == "restore":
                require_keys(payload, {"revisionId", "baseVersion"})
                self.check_version(row, version_from(payload))
                revision_id = text(payload["revisionId"], "revisionId", 1, 180)
                revision = db.execute("SELECT content FROM revisions WHERE id=? AND type='content' AND owner_id='site'", (revision_id,)).fetchone()
                if not revision:
                    fail(404, "NOT_FOUND", "No se ha encontrado la revisión solicitada")
                content = validate_content(json.loads(revision["content"]))
                db.execute("UPDATE site_content SET draft=?,version=version+1 WHERE id=1", (canonical(content),))
            else:
                fail(404, "NOT_FOUND", "La operación solicitada no existe")
            updated = db.execute("SELECT * FROM site_content WHERE id=1").fetchone()
            return 200, STORE.content_state(updated)

    def mail_settings_write(self):
        payload = self.read_json()
        self.require_admin()
        require_keys(
            payload,
            {"enabled", "host", "port", "security", "username", "password", "sender", "recipient"},
            {"enabled", "method", "host", "port", "security", "username", "password", "sender", "recipient", "tenantId", "clientId", "clientSecret"},
        )
        current = load_mail_settings()
        candidate = {
            "enabled": payload["enabled"] if isinstance(payload["enabled"], bool) else fail(400, "VALIDATION_ERROR", "El campo enabled debe ser verdadero o falso", {"enabled": "Valor no válido"}),
            "method": text(payload.get("method", current["method"]), "method", 0, 20).lower(),
            "host": single_line(text(payload["host"], "host", 0, 160), "host"),
            "security": text(payload["security"], "security", 0, 20).lower(),
            "username": single_line(text(payload["username"], "username", 0, 160), "username"),
            "password": text(payload["password"], "password", 0, 256),
            "sender": text(payload["sender"], "sender", 0, 160).lower(),
            "recipient": text(payload["recipient"], "recipient", 0, 160).lower(),
            "tenantId": single_line(text(payload.get("tenantId", current["tenantId"]), "tenantId", 0, 80), "tenantId"),
            "clientId": single_line(text(payload.get("clientId", current["clientId"]), "clientId", 0, 80), "clientId"),
            "clientSecret": text(payload.get("clientSecret", ""), "clientSecret", 0, 256),
        }
        port = payload["port"]
        if isinstance(port, str) and port.strip().isdigit():
            port = int(port.strip())
        if not isinstance(port, int) or isinstance(port, bool):
            fail(400, "VALIDATION_ERROR", "El campo port debe ser un número", {"port": "Puerto no válido"})
        candidate["port"] = port
        if candidate["method"] not in MAIL_METHODS:
            fail(400, "VALIDATION_ERROR", "El método de envío debe ser smtp o graph", {"method": "Método no válido"})
        if not candidate["password"]:
            candidate["password"] = current["password"]
        if not candidate["clientSecret"]:
            candidate["clientSecret"] = current["clientSecret"]
        errors = check_mail_settings(candidate, strict_pair=candidate["enabled"])
        if errors:
            fail(400, "VALIDATION_ERROR", "Revisa la configuración de correo", errors)
        with LOCK:
            save_mail_settings(candidate)
        return 200, public_mail_settings(load_mail_settings())

    def mail_settings_test(self):
        self.require_admin()
        key = f"{self.client_address[0]}|mail-test"
        current = time.time()
        with LOCK:
            attempts = [stamp for stamp in FORM_ATTEMPTS.get(key, []) if current - stamp < 900]
            if len(attempts) >= 5:
                fail(429, "TOO_MANY_REQUESTS", "Has realizado demasiadas pruebas. Espera unos minutos antes de volver a intentarlo")
            attempts.append(current)
            FORM_ATTEMPTS[key] = attempts
        settings = mail_settings()
        reference = f"TEST-{secrets.token_hex(4).upper()}"
        body = (
            "Prueba de envío del correo de la web de HEMSA\n"
            f"Referencia: {reference}\n\n"
            "Si recibes este mensaje, la configuración del buzón es correcta y los formularios "
            "de contacto y cita previa ya pueden enviar correos.\n\n"
            f"Servidor: {settings['host']}:{settings['port']} ({settings['security']})\n"
            f"Remitente: {settings['sender']}"
        )
        deliver_email(f"[Web HEMSA] Prueba de correo — {reference}", body, settings["sender"], reference)
        return 200, {"ok": True, "recipient": settings["recipient"], "reference": reference}

    def login(self):
        payload = self.read_json()
        require_keys(payload, {"email", "password"})
        email = text(payload["email"], "email", 3, 160).lower()
        password = text(payload["password"], "password", 1, 256)
        key = f"{self.client_address[0]}|{email}"
        current = time.time()
        with LOCK:
            attempts = [stamp for stamp in LOGIN_ATTEMPTS.get(key, []) if current - stamp < 900]
            if len(attempts) >= 5:
                fail(429, "TOO_MANY_ATTEMPTS", "Demasiados intentos. Espera unos minutos antes de volver a probar")
            with STORE.connect() as db:
                row = db.execute("SELECT * FROM admins WHERE email=? AND active=1", (email,)).fetchone()
            if not row or not verify_password(password, row["password_hash"]):
                attempts.append(current)
                LOGIN_ATTEMPTS[key] = attempts
                fail(401, "INVALID_CREDENTIALS", "El correo o la contraseña no son correctos")
            LOGIN_ATTEMPTS.pop(key, None)
            token = secrets.token_urlsafe(32)
            expires = (datetime.now(timezone.utc) + timedelta(hours=12)).isoformat().replace("+00:00", "Z")
            with STORE.connect() as db:
                db.execute("DELETE FROM sessions WHERE expires_at<=?", (NOW(),))
                db.execute("INSERT INTO sessions(token_hash,admin_id,expires_at,created_at) VALUES(?,?,?,?)", (hashlib.sha256(token.encode()).hexdigest(), row["id"], expires, NOW()))
            return 200, {"token": token, "expiresAt": expires, "user": public_user(row)}

    def editorial_collection(self, kind):
        self.require_admin()
        with STORE.connect() as db:
            rows = db.execute("SELECT * FROM editorial WHERE type=? ORDER BY rowid", (kind,)).fetchall()
            return 200, {"items": [STORE.editorial_item(row) for row in rows]}

    def editorial_create(self, kind):
        payload = self.read_json()
        require_keys(payload, {"item"})
        self.require_admin()
        item = validate_editorial(payload["item"], kind)
        if item["documents"]:
            fail(400, "VALIDATION_ERROR", "Los documentos deben añadirse después de crear el borrador")
        with LOCK, STORE.connect() as db:
            if db.execute("SELECT 1 FROM editorial WHERE type=? AND id=?", (kind, item["id"])).fetchone():
                fail(409, "ALREADY_EXISTS", "Ya existe un contenido con ese identificador")
            timestamp = NOW()
            db.execute("INSERT INTO editorial(type,id,version,status,draft,published,has_changes,created_at,updated_at) VALUES(?,?,1,'draft',?,NULL,1,?,?)", (kind, item["id"], canonical(item), timestamp, timestamp))
            STORE.add_revision(db, kind, item["id"], "initial", item)
            row = STORE.get_editorial_row(db, kind, item["id"])
            return 200, {"item": STORE.editorial_item(row)}

    def editorial_update(self, kind, item_id, action):
        payload = self.read_json()
        self.require_admin()
        with LOCK, STORE.connect() as db:
            row = STORE.get_editorial_row(db, kind, item_id)
            self.check_version(row, version_from(payload))
            timestamp = NOW()
            if action == "update":
                require_keys(payload, {"item", "baseVersion"})
                item = validate_editorial(payload["item"], kind)
                if item["id"] != item_id:
                    fail(400, "VALIDATION_ERROR", "El identificador de un contenido no se puede cambiar")
                validate_document_ownership(db, row, item)
                changed = not row["published"] or not same(item, json.loads(row["published"]))
                db.execute("UPDATE editorial SET draft=?,has_changes=?,updated_at=?,version=version+1 WHERE type=? AND id=?", (canonical(item), int(changed), timestamp, kind, item_id))
            elif action == "publish":
                require_keys(payload, {"baseVersion"})
                draft = json.loads(row["draft"])
                if row["published"]:
                    STORE.add_revision(db, kind, item_id, "backup", json.loads(row["published"]))
                STORE.add_revision(db, kind, item_id, "publish", draft)
                db.execute("UPDATE editorial SET published=draft,status='published',has_changes=0,updated_at=?,first_published_at=COALESCE(first_published_at,?),last_published_at=?,archived_at=NULL,version=version+1 WHERE type=? AND id=?", (timestamp, timestamp, timestamp, kind, item_id))
            elif action == "archive":
                require_keys(payload, {"baseVersion"})
                STORE.add_revision(db, kind, item_id, "archive", json.loads(row["draft"]))
                db.execute("UPDATE editorial SET status='archived',archived_at=?,updated_at=?,version=version+1 WHERE type=? AND id=?", (timestamp, timestamp, kind, item_id))
            elif action == "restore":
                require_keys(payload, {"revisionId", "baseVersion"})
                revision_id = text(payload["revisionId"], "revisionId", 1, 180)
                revision = db.execute("SELECT content FROM revisions WHERE id=? AND type=? AND owner_id=?", (revision_id, kind, item_id)).fetchone()
                if not revision:
                    fail(404, "NOT_FOUND", "No se ha encontrado la revisión solicitada")
                item = validate_editorial(json.loads(revision["content"]), kind)
                validate_document_ownership(db, row, item)
                changed = not row["published"] or not same(item, json.loads(row["published"]))
                db.execute("UPDATE editorial SET draft=?,has_changes=?,updated_at=?,version=version+1 WHERE type=? AND id=?", (canonical(item), int(changed), timestamp, kind, item_id))
            else:
                fail(404, "NOT_FOUND", "La operación solicitada no existe")
            updated = STORE.get_editorial_row(db, kind, item_id)
            return 200, {"item": STORE.editorial_item(updated)}

    def revision_detail(self, revision_id):
        self.require_admin()
        with STORE.connect() as db:
            row = db.execute("SELECT r.*,a.id AS admin_id,a.email,a.role FROM revisions r JOIN admins a ON a.id=r.created_by WHERE r.id=? AND r.type='content' AND r.owner_id='site'", (revision_id,)).fetchone()
            if not row:
                fail(404, "NOT_FOUND", "No se ha encontrado la revisión solicitada")
            return 200, {
                "id": row["id"], "action": row["action"], "createdAt": row["created_at"],
                "createdBy": {"id": str(row["admin_id"]), "email": row["email"], "role": row["role"]},
                "content": json.loads(row["content"]),
            }

    def upload_document(self):
        content_type = self.headers.get("Content-Type", "")
        if not content_type.lower().startswith("multipart/form-data") or "boundary=" not in content_type:
            fail(400, "VALIDATION_ERROR", "La subida debe usar multipart/form-data")
        body = self.read_body(MAX_MULTIPART)
        self.require_admin()
        message = BytesParser(policy=default).parsebytes(f"Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n".encode("latin-1") + body)
        fields = {}
        upload = None
        for part in message.iter_parts():
            name = part.get_param("name", header="content-disposition")
            if not name:
                continue
            data = part.get_payload(decode=True) or b""
            if name == "file":
                if upload is not None:
                    fail(400, "VALIDATION_ERROR", "Solo se admite un PDF por subida")
                upload = (part.get_filename(), part.get_content_type(), data)
            elif name in fields:
                fail(400, "VALIDATION_ERROR", f"El campo {name} está duplicado")
            else:
                try:
                    fields[name] = data.decode("utf-8")
                except UnicodeDecodeError:
                    fail(400, "VALIDATION_ERROR", "Los metadatos deben usar UTF-8")
        required = {"ownerType", "ownerId", "baseVersion", "title", "description", "pages", "kind"}
        if set(fields) != required or upload is None:
            fail(400, "VALIDATION_ERROR", "Faltan campos o se han recibido campos no admitidos")
        kind = fields["ownerType"]
        if kind not in {"grants", "jobs"}:
            fail(400, "VALIDATION_ERROR", "El propietario del documento no es válido")
        try:
            base_version = int(fields["baseVersion"])
            pages = int(fields["pages"]) if fields["pages"].strip() else None
        except ValueError:
            fail(400, "VALIDATION_ERROR", "La versión o el número de páginas no es válido")
        integer(base_version, "baseVersion")
        integer(pages, "pages", 1, 10000, True)
        filename, media_type, data = upload
        if not filename or len(filename) > 180 or filename != Path(filename).name or "/" in filename or "\\" in filename or any(ord(char) < 32 for char in filename) or not filename.lower().endswith(".pdf"):
            fail(400, "VALIDATION_ERROR", "El nombre del archivo no es seguro o no tiene extensión PDF")
        if media_type.lower().split(";", 1)[0].strip() != "application/pdf" or not data.startswith(b"%PDF-"):
            fail(400, "VALIDATION_ERROR", "El archivo debe ser un PDF real")
        if not data or len(data) > MAX_PDF:
            fail(413, "PAYLOAD_TOO_LARGE", "El PDF supera el límite de 15 MB")
        owner_id = text(fields["ownerId"], "ownerId", 1, 160)
        with LOCK, STORE.connect() as db:
            row = STORE.get_editorial_row(db, kind, owner_id)
            self.check_version(row, base_version)
            document_id = secrets.token_hex(16)
            document = {
                "id": document_id, "title": fields["title"], "description": fields["description"], "pages": pages,
                "bytes": len(data), "kind": fields["kind"], "source": "uploaded", "url": f"/api/public/documents/{document_id}",
            }
            document = validate_document(document)
            draft = json.loads(row["draft"])
            draft["documents"].append(document)
            draft = validate_editorial(draft, kind)
            timestamp = NOW()
            db.execute("INSERT INTO documents(id,owner_type,owner_id,title,description,pages,bytes,kind,source,url,data,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", (document_id, kind, owner_id, document["title"], document["description"], pages, len(data), document["kind"], "uploaded", document["url"], data, timestamp))
            db.execute("UPDATE editorial SET draft=?,has_changes=1,updated_at=?,version=version+1 WHERE type=? AND id=?", (canonical(draft), timestamp, kind, owner_id))
            updated = STORE.get_editorial_row(db, kind, owner_id)
            return 200, {"document": document, "item": STORE.editorial_item(updated)}

    def document(self, document_id, private):
        if private:
            self.require_admin()
        with STORE.connect() as db:
            row = db.execute("SELECT * FROM documents WHERE id=?", (document_id,)).fetchone()
            if not row:
                fail(404, "NOT_FOUND", "No se ha encontrado el documento")
            if not private:
                owner = db.execute("SELECT status,published FROM editorial WHERE type=? AND id=?", (row["owner_type"], row["owner_id"])).fetchone()
                visible = False
                if owner and owner["status"] == "published" and owner["published"]:
                    visible = any(document["id"] == document_id for document in json.loads(owner["published"])["documents"])
                if not visible:
                    fail(404, "NOT_FOUND", "No se ha encontrado el documento")
            return row

    def public_form(self, kind: str):
        if self.headers.get("Origin") and not self.allowed_origin():
            fail(403, "ORIGIN_NOT_ALLOWED", "El origen de la solicitud no está permitido")
        payload = self.read_json()
        contact = kind == "contact"
        required = {"name", "email", "phone", "subject" if contact else "service", "message" if contact else "notes", "privacy", "website"}
        if not contact:
            required.add("date")
        require_keys(payload, required, prefix="form")
        if payload["website"]:
            return 201, {"ok": True}
        name = single_line(text(payload["name"], "name", 2, 120), "name")
        email = email_address(payload["email"], "email")
        phone = text(payload["phone"], "phone", 0 if contact else 7, 30)
        if phone and not re.fullmatch(r"\+?[0-9 ()-]+", phone):
            fail(400, "VALIDATION_ERROR", "Introduce un teléfono válido", {"phone": "Teléfono no válido"})
        if payload["privacy"] is not True:
            fail(400, "VALIDATION_ERROR", "Debes aceptar la política de privacidad", {"privacy": "Consentimiento obligatorio"})
        reference = f"{'CON' if contact else 'CIT'}-{secrets.token_hex(4).upper()}"
        if contact:
            subject = text(payload["subject"], "subject", 1, 80)
            allowed = {"Información general", "Vivienda y promociones", "Ayuda a domicilio", "Garajes, locales y parcelas", "Empleo y convocatorias", "Quejas y sugerencias"}
            if subject not in allowed:
                fail(400, "VALIDATION_ERROR", "Selecciona un asunto válido", {"subject": "Asunto no válido"})
            message = text(payload["message"], "message", 10, 4000)
            heading = "Nuevo mensaje desde el formulario de contacto"
            details = f"Asunto: {subject}\n\nMensaje:\n{message}"
            mail_subject = f"[Web HEMSA] {subject} — {name}"
        else:
            service = text(payload["service"], "service", 1, 100)
            allowed = {"Información general", "Vivienda y registro de demandantes", "Servicio de Ayuda a Domicilio", "Venta de mi vivienda", "Garajes y trasteros", "Locales y parcelas", "Empleo y convocatorias", "Transparencia y documentación"}
            if service not in allowed:
                fail(400, "VALIDATION_ERROR", "Selecciona un motivo válido", {"service": "Motivo no válido"})
            preferred_date = text(payload["date"], "date", 0, 10)
            if preferred_date:
                date_value(preferred_date, "date")
                if datetime.strptime(preferred_date, "%Y-%m-%d").date() < datetime.now().astimezone().date():
                    fail(400, "VALIDATION_ERROR", "La fecha preferida no puede ser anterior a hoy", {"date": "Fecha no válida"})
            notes = text(payload["notes"], "notes", 0, 2000)
            heading = "Nueva solicitud de cita previa"
            details = f"Motivo: {service}\nFecha preferida: {preferred_date or 'Sin preferencia'}\n\nComentario:\n{notes or 'Sin comentarios'}\n\nLa cita no quedará confirmada hasta recibir respuesta de HEMSA."
            mail_subject = f"[Cita previa] {service} — {name}"
        key = f"{self.client_address[0]}|{kind}"
        current = time.time()
        with LOCK:
            attempts = [stamp for stamp in FORM_ATTEMPTS.get(key, []) if current - stamp < 900]
            if len(attempts) >= 5:
                fail(429, "TOO_MANY_REQUESTS", "Se han realizado demasiados envíos. Espera unos minutos antes de volver a intentarlo")
            attempts.append(current)
            FORM_ATTEMPTS[key] = attempts
        body = f"{heading}\nReferencia: {reference}\n\nNombre: {name}\nCorreo: {email}\nTeléfono: {phone or 'No indicado'}\n{details}"
        deliver_email(mail_subject, body, email, reference)
        return 201, {"ok": True, "reference": reference}

    def route(self, method, path):
        if method == "GET" and path == "/api/health":
            return 200, {"status": "ok"}
        if method == "GET" and path == "/api/public/content":
            with STORE.connect() as db:
                row = db.execute("SELECT published,published_at,version FROM site_content WHERE id=1").fetchone()
                return 200, {"content": json.loads(row["published"]), "publishedAt": row["published_at"], "version": row["version"]}
        if method == "POST" and path == "/api/public/contact":
            return self.public_form("contact")
        if method == "POST" and path == "/api/public/appointments":
            return self.public_form("appointment")
        if method == "POST" and path == "/api/auth/login":
            return self.login()
        if method == "POST" and path == "/api/auth/logout":
            self.require_admin()
            with LOCK, STORE.connect() as db:
                db.execute("DELETE FROM sessions WHERE token_hash=?", (hashlib.sha256(self.bearer().encode()).hexdigest(),))
            return 204, None
        if method == "GET" and path == "/api/auth/me":
            return 200, {"user": public_user(self.require_admin())}
        if method == "GET" and path == "/api/admin/content":
            self.require_admin()
            return 200, STORE.content_state()
        if method == "POST" and path == "/api/admin/content/draft":
            return self.content_write("draft")
        if method == "POST" and path == "/api/admin/content/publish":
            return self.content_write("publish")
        if method == "POST" and path == "/api/admin/content/discard-draft":
            return self.content_write("discard")
        if method == "POST" and path == "/api/admin/content/revisions/restore":
            return self.content_write("restore")
        if method == "GET" and path == "/api/admin/content/revisions":
            self.require_admin()
            return 200, STORE.revision_summaries("content", "site")
        if method == "GET" and path == "/api/admin/mail-settings":
            self.require_admin()
            return 200, public_mail_settings(load_mail_settings())
        if method == "POST" and path == "/api/admin/mail-settings":
            return self.mail_settings_write()
        if method == "POST" and path == "/api/admin/mail-settings/test":
            return self.mail_settings_test()
        match = re.fullmatch(r"/api/admin/content/revisions/([^/]+)", path)
        if method == "GET" and match:
            return self.revision_detail(unquote(match.group(1)))
        match = re.fullmatch(r"/api/public/(grants|jobs)(?:/([^/]+))?", path)
        if method == "GET" and match:
            return 200, public_editorial(match.group(1), unquote(match.group(2)) if match.group(2) else None)
        match = re.fullmatch(r"/api/public/documents/([^/]+)", path)
        if method == "GET" and match:
            return self.document(unquote(match.group(1)), False)
        match = re.fullmatch(r"/api/admin/(grants|jobs)", path)
        if match and method == "GET":
            return self.editorial_collection(match.group(1))
        if match and method == "POST":
            return self.editorial_create(match.group(1))
        match = re.fullmatch(r"/api/admin/(grants|jobs)/([^/]+)(?:/(publish|archive|revisions|restore))?", path)
        if match:
            kind, item_id, action = match.group(1), unquote(match.group(2)), match.group(3)
            if method == "GET" and action is None:
                self.require_admin()
                with STORE.connect() as db:
                    return 200, {"item": STORE.editorial_item(STORE.get_editorial_row(db, kind, item_id))}
            if method == "POST" and action is None:
                return self.editorial_update(kind, item_id, "update")
            if method == "POST" and action in {"publish", "archive", "restore"}:
                return self.editorial_update(kind, item_id, action)
            if method == "GET" and action == "revisions":
                self.require_admin()
                with STORE.connect() as db:
                    STORE.get_editorial_row(db, kind, item_id)
                return 200, STORE.revision_summaries(kind, item_id)
        if method == "POST" and path == "/api/admin/documents":
            return self.upload_document()
        match = re.fullmatch(r"/api/admin/documents/([^/]+)", path)
        if method == "GET" and match:
            return self.document(unquote(match.group(1)), True)
        return None


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"HEMSA local disponible en http://{HOST}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
