"""Sincronización de un lugar con el asistente (HU-30; se conecta a HU-29).

Todo cambio de un lugar pasa por `PlaceSync.sync`. Hasta que exista el reindexado
del asistente (HU-29), la implementación por defecto no hace nada y devuelve
`"skipped"`. Cuando exista, basta con devolver aquí una implementación real.
"""

from __future__ import annotations

import logging
from typing import Literal, Protocol

logger = logging.getLogger(__name__)

RagSync = Literal["ok", "skipped", "failed"]


class PlaceSync(Protocol):
    def sync(self, place_id: int) -> RagSync: ...


class NullPlaceSync:
    def sync(self, place_id: int) -> RagSync:
        return "skipped"


def get_place_sync() -> PlaceSync:
    """Sincronizador de lugares (se reemplaza en los tests)."""
    return NullPlaceSync()


def safe_sync(sync: PlaceSync, place_id: int) -> RagSync:
    """Nunca lanza: un fallo se registra y se informa como `failed` (RF-30.24)."""
    try:
        return sync.sync(place_id)
    except Exception:
        logger.exception("No se pudo sincronizar el lugar %s con el asistente", place_id)
        return "failed"
