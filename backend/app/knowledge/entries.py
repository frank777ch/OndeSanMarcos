"""Entradas de conocimiento generadas (respaldo versionado en el repo).

Modelo de fuente de verdad (decisión de diseño): **Supabase es la base viva**
que consulta la app; el repo guarda las entradas ya revisadas y aprobadas como
archivos JSON (`app/knowledge/entries/*.json`) para reproducibilidad y respaldo.

Flujo:
  1. `find_gaps`  detecta lugares del mapa (`unmsm.ts`) que el corpus de Supabase
     aún no describe, genera un borrador (Gemini, *grounded*) y lo escribe aquí
     con `status="draft"`.
  2. La persona **revisa** el JSON y aprueba (`status="approved"`).
  3. `upload_entries` sube lo aprobado a Supabase y marca `status="uploaded"`.
  4. El re-ingest completo (`ingest_pgvector`) vuelve a leer estas entradas
     además del corpus, de modo que reconstruir la base **no** pierde lo agregado.

Cada entrada envuelve un `document` con la misma forma que `corpus.Document`
(`id`, `title`, `place_id`, `text`), para reusar el mismo pipeline de troceado y
embeddings que el corpus principal.
"""

from __future__ import annotations

import json
from pathlib import Path

from app.knowledge.corpus import Document

SCHEMA = "ondesanmarcos.knowledge-entries/v1"
STATUS_DRAFT = "draft"
STATUS_APPROVED = "approved"
STATUS_UPLOADED = "uploaded"

# app/knowledge/entries.py  ->  carpeta hermana `entries/`
DEFAULT_ENTRIES_DIR = Path(__file__).resolve().parent / "entries"
DEFAULT_REVIEW_FILE = DEFAULT_ENTRIES_DIR / "gaps_review.json"


def entry_to_document(entry: dict) -> Document:
    """Convierte una entrada del JSON en un `Document` del corpus."""
    doc = entry["document"]
    return Document(
        id=doc["id"],
        title=doc["title"],
        text=doc["text"],
        place_id=doc.get("place_id"),
    )


def load_entries_file(path: str | Path) -> dict:
    """Carga un archivo de entradas (JSON). Lanza si no existe o es inválido."""
    return json.loads(Path(path).read_text(encoding="utf-8"))


def save_entries_file(path: str | Path, data: dict) -> None:
    """Escribe un archivo de entradas con formato legible y estable."""
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def load_entry_documents(
    entries_dir: str | Path | None = None,
    *,
    statuses: tuple[str, ...] = (STATUS_APPROVED, STATUS_UPLOADED),
) -> list[Document]:
    """Documentos de todas las entradas del directorio con `status` en `statuses`.

    Lo usa el re-ingest para incluir en la reconstrucción de Supabase lo que ya
    fue revisado/subido (por defecto: aprobado o subido). Si la carpeta no
    existe, devuelve una lista vacía.
    """
    root = Path(entries_dir) if entries_dir else DEFAULT_ENTRIES_DIR
    if not root.is_dir():
        return []
    documents: list[Document] = []
    for file in sorted(root.glob("*.json")):
        data = json.loads(file.read_text(encoding="utf-8"))
        for entry in data.get("entries", []):
            if entry.get("status") in statuses:
                documents.append(entry_to_document(entry))
    return documents
