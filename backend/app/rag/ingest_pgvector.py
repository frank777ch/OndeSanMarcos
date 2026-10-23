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

Incluye también las entradas ya aprobadas/subidas en `app/knowledge/entries/`
(agregadas incrementalmente con `find_gaps` + `upload_entries`), de modo que
reconstruir la base **no** pierde el conocimiento agregado fuera del corpus base.
"""

from __future__ import annotations

import argparse
import sys

from app.config import Settings, get_settings
from app.knowledge.entries import load_entry_documents
from app.rag.db import Database, get_database
from app.rag.errors import RagProviderError
from app.rag.ingestion import load_documents, split_documents
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

    # Corpus base + entradas aprobadas/subidas (para que reconstruir NO pierda
    # el conocimiento agregado incrementalmente con find_gaps/upload_entries).
    documents = load_documents(settings.knowledge_sources_dir) + load_entry_documents()
    chunks = split_documents(
        documents,
        chunk_size=settings.rag_chunk_size,
        overlap=settings.rag_chunk_overlap,
    )

    # Todos los embeddings se calculan ANTES de abrir la transacción: si Gemini
    # falla, la tabla queda intacta.
    rows: list[dict] = []
    for chunk in chunks:
        vector = embedding.embed_document(f"{chunk.title}. {chunk.text}")
        rows.append(
            {
                "content": chunk.text,
                "metadata": {
                    "document_id": chunk.document_id,
                    "place_id": chunk.place_id,
                    "title": chunk.title,
                    "position": chunk.position,
                },
                "embedding": vector,
            }
        )

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
