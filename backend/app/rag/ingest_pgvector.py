"""Ingesta del corpus a Supabase/pgvector (proceso offline).

Uso:
    python -m app.rag.ingest_pgvector

Requiere configuración real en el entorno (`.env`):
    LLM_PROVIDER=gemini · LLM_API_KEY=... · SUPABASE_URL=... · SUPABASE_SERVICE_KEY=...
y las dependencias de `requirements-llm.txt` y `requirements-pgvector.txt`.

Reusa el pipeline de ingesta (`load_documents` + `split_documents`), embebe cada
fragmento con Gemini (`RETRIEVAL_DOCUMENT`) y **reemplaza** el contenido de la
tabla `documents`. Idempotente: correrlo de nuevo repuebla desde cero.

Incluye también las entradas ya aprobadas/subidas en `app/knowledge/entries/`
(agregadas incrementalmente con `find_gaps` + `upload_entries`), de modo que
reconstruir la base **no** pierde el conocimiento agregado fuera del corpus base.
"""

from __future__ import annotations

from app.config import Settings, get_settings
from app.knowledge.entries import load_entry_documents
from app.rag.ingestion import load_documents, split_documents
from app.rag.providers import build_embedding_provider

_BATCH = 100


def _build_client(settings: Settings):
    if not (settings.supabase_url and settings.supabase_service_key):
        raise SystemExit(
            "Faltan SUPABASE_URL / SUPABASE_SERVICE_KEY en el entorno (.env)."
        )
    try:
        from supabase import create_client
    except ImportError as exc:  # pragma: no cover
        raise SystemExit(
            "Falta el paquete 'supabase'. Instala requirements-pgvector.txt."
        ) from exc
    return create_client(settings.supabase_url, settings.supabase_service_key)


def ingest(settings: Settings | None = None) -> int:
    """Embebe el corpus y repuebla la tabla pgvector. Devuelve nº de fragmentos."""
    settings = settings or get_settings()
    embedding = build_embedding_provider(settings)  # GeminiEmbedding
    client = _build_client(settings)
    table = settings.pgvector_table

    # Corpus base + entradas aprobadas/subidas (para que reconstruir NO pierda
    # el conocimiento agregado incrementalmente con find_gaps/upload_entries).
    documents = load_documents(settings.knowledge_sources_dir) + load_entry_documents()
    chunks = split_documents(
        documents,
        chunk_size=settings.rag_chunk_size,
        overlap=settings.rag_chunk_overlap,
    )

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

    # Reemplaza el contenido previo (idempotente).
    client.table(table).delete().neq("id", 0).execute()
    for start in range(0, len(rows), _BATCH):
        client.table(table).insert(rows[start : start + _BATCH]).execute()

    print(
        f"Ingeridos {len(rows)} fragmentos de {len(documents)} documentos "
        f"en la tabla '{table}'."
    )
    return len(rows)


if __name__ == "__main__":
    ingest()
