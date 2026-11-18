"""Vuelve a sincronizar todos los eventos con el asistente.

Uso (desde Docker o local, con `RAG_USE_MOCK=false`, `LLM_API_KEY` y `DATABASE_URL`):
    ./scripts/dev.sh reindex-events

Rehace el documento de cada evento publicado y vigente, y borra el de los despublicados o terminados,
**sin reingerir el corpus general**. Cuesta una llamada de embeddings por fragmento; los textos que no
cambiaron salen de la caché en `.rag_cache/`.
"""

from __future__ import annotations

import sys

from app.config import get_settings
from app.events.sync import EventSync, safe_sync


def reindex_all(sync: EventSync, events: list[dict]) -> tuple[int, int]:
    """Sincroniza cada evento. Devuelve `(ok, failed)`; un fallo no detiene a los demás."""
    ok = failed = 0
    for event in events:
        result = safe_sync(sync, event["id"])
        if result == "ok":
            ok += 1
        else:
            failed += 1
            print(f"  ✗ {event['slug']}: {result}", file=sys.stderr)
    return ok, failed


def main() -> int:
    settings = get_settings()
    if settings.rag_use_mock or not settings.database_url:
        print(
            "Error: hace falta RAG_USE_MOCK=false y DATABASE_URL para sincronizar con el asistente real.",
            file=sys.stderr,
        )
        return 1

    from app.events.sync import _rag_event_sync
    from app.rag.db import get_database

    database = get_database(settings)
    try:
        events = database.events_for_sync()
        ok, failed = reindex_all(_rag_event_sync(), events)
    finally:
        # Cierra el pool aquí: dejarlo al intérprete imprime un `PythonFinalizationError` al salir.
        database.close()
    print(f"Eventos sincronizados: {ok} ok · {failed} con error (de {len(events)}).")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
