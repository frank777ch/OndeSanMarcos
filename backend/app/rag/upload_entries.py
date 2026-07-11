"""Sube a Supabase las entradas de conocimiento ya revisadas y aprobadas.

Lee un archivo de entradas (por defecto `app/knowledge/entries/gaps_review.json`,
producido por `find_gaps`), y para cada entrada aprobada: trocea el documento,
embebe cada fragmento con Gemini (`RETRIEVAL_DOCUMENT`) e inserta las filas en la
tabla `documents` de Supabase — con la MISMA forma que el corpus principal.

Seguridad por diseño:
- Solo sube entradas con `status="approved"` (o todas si se pasa `--approve-all`).
- Si el `place_id` YA existe en el corpus, **no** lo pisa salvo que se pase
  `--update-existing` (entonces borra sus filas y reinserta). Así "actualizar el
  mismo lugar" es explícito, no accidental.
- Tras subir, marca la entrada como `status="uploaded"` en el archivo (respaldo
  versionado). Recuerda commitear el JSON: es la fuente reproducible.

Uso:
    python -m app.rag.upload_entries --dry-run          # previsualiza, no sube
    python -m app.rag.upload_entries                    # sube las aprobadas
    python -m app.rag.upload_entries --approve-all      # trata los borradores como aprobados
    python -m app.rag.upload_entries --update-existing  # permite reemplazar lugares ya presentes
"""

from __future__ import annotations

import argparse
import sys

from app.config import Settings, get_settings
from app.knowledge.entries import (
    DEFAULT_REVIEW_FILE,
    STATUS_APPROVED,
    STATUS_DRAFT,
    STATUS_UPLOADED,
    entry_to_document,
    load_entries_file,
    save_entries_file,
)
from app.rag.ingestion import split_document
from app.rag.providers import build_embedding_provider

_BATCH = 100


def _supabase_client(settings: Settings):
    if not (settings.supabase_url and settings.supabase_service_key):
        raise SystemExit("Faltan SUPABASE_URL / SUPABASE_SERVICE_KEY en el .env.")
    try:
        from supabase import create_client
    except ImportError as exc:  # pragma: no cover
        raise SystemExit(
            "Falta el paquete 'supabase'. Instala requirements-pgvector.txt."
        ) from exc
    return create_client(settings.supabase_url, settings.supabase_service_key)


def _existing_count(client, table: str, place_id: str) -> int:
    """Cuántas filas del corpus ya pertenecen a `place_id`."""
    response = (
        client.table(table)
        .select("id", count="exact")
        .filter("metadata->>place_id", "eq", place_id)
        .execute()
    )
    return response.count or 0


def _delete_place(client, table: str, place_id: str) -> None:
    client.table(table).delete().filter("metadata->>place_id", "eq", place_id).execute()


def _rows_for_document(document, embedding, settings: Settings) -> list[dict]:
    """Trocea + embebe un documento y devuelve las filas para insertar."""
    chunks = split_document(
        document,
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
    return rows


def _insert_rows(client, table: str, rows: list[dict]) -> None:
    for start in range(0, len(rows), _BATCH):
        client.table(table).insert(rows[start : start + _BATCH]).execute()


def _uploadable(entry: dict, approve_all: bool) -> bool:
    status = entry.get("status")
    if status == STATUS_UPLOADED:
        return False
    if status == STATUS_APPROVED:
        return True
    return approve_all and status == STATUS_DRAFT


def main(argv: list[str] | None = None) -> int:
    try:  # consola Windows: fuerza UTF-8 para no garabatear acentos
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:  # pragma: no cover
        pass

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", default=str(DEFAULT_REVIEW_FILE), help="Archivo de entradas.")
    parser.add_argument(
        "--approve-all",
        action="store_true",
        help="Trata las entradas 'draft' como aprobadas (tras tu revisión verbal).",
    )
    parser.add_argument(
        "--update-existing",
        action="store_true",
        help="Si el place_id ya existe, borra sus filas y reinserta (en vez de omitir).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Muestra qué haría sin embeber ni escribir en Supabase.",
    )
    args = parser.parse_args(argv)

    settings = get_settings()
    data = load_entries_file(args.file)
    entries = data.get("entries", [])
    pending = [e for e in entries if _uploadable(e, args.approve_all)]

    if not pending:
        print("No hay entradas aprobadas para subir. Marca 'status'='approved' "
              "en el archivo (o usa --approve-all).")
        return 0

    client = _supabase_client(settings)
    table = settings.pgvector_table
    embedding = None if args.dry_run else build_embedding_provider(settings)

    uploaded = skipped = 0
    for entry in pending:
        place_id = entry["place_id"]
        document = entry_to_document(entry)
        existing = _existing_count(client, table, place_id)

        if existing and not args.update_existing:
            print(f"  ↷ {place_id}: ya existe ({existing} filas). Omitido "
                  f"(usa --update-existing para reemplazar).")
            skipped += 1
            continue

        n_chunks = len(
            split_document(
                document,
                chunk_size=settings.rag_chunk_size,
                overlap=settings.rag_chunk_overlap,
            )
        )
        action = "reemplazaría" if existing else "insertaría"
        if args.dry_run:
            print(f"  · {place_id}: {action} {n_chunks} fragmentos "
                  f"(existentes: {existing}).")
            continue

        if existing:
            _delete_place(client, table, place_id)
        rows = _rows_for_document(document, embedding, settings)
        _insert_rows(client, table, rows)
        entry["status"] = STATUS_UPLOADED
        entry["uploaded_chunks"] = len(rows)
        print(f"  ✓ {place_id}: {len(rows)} fragmentos subidos "
              f"({'reemplazo' if existing else 'nuevo'}).")
        uploaded += 1

    if args.dry_run:
        print(f"\n[dry-run] {len(pending)} entradas evaluadas. Nada se subió.")
        return 0

    save_entries_file(args.file, data)
    print(f"\nSubidas {uploaded} · omitidas {skipped}. Archivo actualizado: {args.file}")
    print("Commitea el JSON: es el respaldo versionado del conocimiento.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
