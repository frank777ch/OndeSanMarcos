"""Ingesta del corpus a Postgres/pgvector (proceso offline).

Uso:
    python -m app.rag.ingest_pgvector            # se niega si la tabla ya tiene datos
    python -m app.rag.ingest_pgvector --force    # reemplaza el contenido

Requiere en el entorno (`.env`):
    LLM_PROVIDER=gemini · LLM_API_KEY=... · DATABASE_URL=...
y las dependencias de `requirements-llm.txt` y `requirements-pgvector.txt`.
Desde Docker se usa `./script/dev.sh ingest`.

Reusa el pipeline de ingesta (`load_documents` + `split_documents`), embebe cada
fragmento con Gemini (`RETRIEVAL_DOCUMENT`) y **reemplaza** el contenido de la
tabla `documents` en una sola transacción.

Cuidado con la cuota de Gemini (una llamada por fragmento):
- No sobrescribe una tabla con datos salvo que se pase `--force`.
- Los embeddings se guardan en `.rag_cache/`: volver a ingerir un texto sin
  cambios no vuelve a llamar a Gemini.
- Si Gemini falla o se agota el límite, aborta ANTES de tocar la tabla y lo ya
  embebido queda en la caché.

Qué se ingiere (HU-29):
- el corpus general (`corpus.py`: sedes, preguntas frecuentes, transporte...), `source_type='corpus'`;
- las entradas ya aprobadas/subidas en `app/knowledge/entries/` (agregadas con `find_gaps` +
  `upload_entries`), para que reconstruir la base **no** pierda ese conocimiento, `source_type='entry'`;
- la ficha de cada lugar **publicado** de la tabla `places`, `source_type='place'`. Los lugares ya no
  se duplican en el corpus: la tabla es su única fuente.
"""

from __future__ import annotations

import argparse
import sys

from app.config import Settings, get_settings
from app.knowledge.entries import load_entry_documents
from app.rag.db import Database, get_database
from app.rag.errors import RagProviderError
from app.places.document import SOURCE_TYPE_PLACE, place_document
from app.rag.ingestion import document_rows, load_documents
from app.rag.providers import build_embedding_provider


def ingest(
    settings: Settings | None = None,
    *,
    force: bool = False,
    database: Database | None = None,
) -> int:
    """Embebe el corpus y repuebla la tabla pgvector. Devuelve nº de fragmentos.

    Devuelve 0 sin hacer nada si la tabla ya tiene datos y no se pasó `force`.
    """
    settings = settings or get_settings()
    database = database or get_database(settings)
    table = settings.pgvector_table

    existing = database.count()
    if existing and not force:
        print(
            f"La tabla '{table}' ya tiene {existing} fragmentos. No se hizo nada "
            "(reingerir gasta cuota de Gemini). Usa --force para reemplazarlos."
        )
        return 0

    embedding = build_embedding_provider(settings)  # GeminiEmbedding con caché

    # Corpus general + entradas aprobadas/subidas + una ficha por lugar publicado.
    sources: list[tuple[str, list]] = [
        ("corpus", load_documents(settings.knowledge_sources_dir)),
        ("entry", load_entry_documents()),
        (
            SOURCE_TYPE_PLACE,
            [place_document(p) for p in database.places_for_sync() if p["is_published"]],
        ),
    ]
    documents = [doc for _, docs in sources for doc in docs]

    # Todos los embeddings se calculan ANTES de abrir la transacción: si Gemini
    # falla, la tabla queda intacta.
    rows: list[dict] = []
    for source_type, docs in sources:
        for document in docs:
            rows.extend(document_rows(document, embedding, settings, source_type))

    database.replace_all(rows)

    hits = getattr(embedding, "hits", 0)
    misses = getattr(embedding, "misses", len(rows))
    print(
        f"Ingeridos {len(rows)} fragmentos de {len(documents)} documentos "
        f"en la tabla '{table}'."
    )
    print(f"Embeddings: {misses} pedidos a Gemini · {hits} tomados de la caché.")
    return len(rows)


def main(argv: list[str] | None = None) -> int:
    try:  # consola Windows: fuerza UTF-8 para no garabatear acentos
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:  # pragma: no cover
        pass
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--force",
        action="store_true",
        help="Reemplaza el contenido aunque la tabla ya tenga datos.",
    )
    args = parser.parse_args(argv)
    try:
        ingest(force=args.force)
    except RagProviderError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
