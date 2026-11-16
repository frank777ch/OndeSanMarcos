"""Vuelve a sincronizar todos los lugares con el asistente (HU-29).

Uso (desde Docker o local, con `RAG_USE_MOCK=false`, `LLM_API_KEY` y `DATABASE_URL`):
    ./scripts/dev.sh reindex-places

Rehace la ficha de cada lugar publicado y borra la de los despublicados, **sin reingerir el
corpus general**. Sirve, por ejemplo, tras renombrar una categoría (las fichas llevan la etiqueta
de su categoría). Cuesta una llamada de embeddings por fragmento; los textos que no cambiaron salen
de la caché en `.rag_cache/`.
"""

from __future__ import annotations

import sys

from app.config import get_settings
from app.places.sync import PlaceSync, safe_sync


def reindex_all(sync: PlaceSync, places: list[dict]) -> tuple[int, int]:
    """Sincroniza cada lugar. Devuelve `(ok, failed)`; un fallo no detiene a los demás."""
    ok = failed = 0
    for place in places:
        result = safe_sync(sync, place["id"])
        if result == "ok":
            ok += 1
        else:
            failed += 1
            print(f"  ✗ {place['slug']}: {result}", file=sys.stderr)
    return ok, failed


def main() -> int:
    settings = get_settings()
    if settings.rag_use_mock or not settings.database_url:
        print(
            "Error: hace falta RAG_USE_MOCK=false y DATABASE_URL para sincronizar con el asistente real.",
            file=sys.stderr,
        )
        return 1

    from app.places.sync import _rag_place_sync
    from app.rag.db import get_database

    places = get_database(settings).places_for_sync()
    ok, failed = reindex_all(_rag_place_sync(), places)
    print(f"Lugares sincronizados: {ok} ok · {failed} con error (de {len(places)}).")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
