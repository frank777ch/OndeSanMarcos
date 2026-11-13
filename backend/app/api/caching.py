"""Caché HTTP para respuestas JSON públicas: `Cache-Control` + `ETag` + 304.

El `ETag` es un hash del cuerpo ya serializado, así que siempre coincide con lo
que se envía y cambia con cualquier cambio de contenido. Lo usan los lugares
(HU-27) y lo usarán los eventos (HU-32).
"""

from __future__ import annotations

import hashlib
from typing import Any

from fastapi import Request, Response
from pydantic import TypeAdapter

MAX_AGE_SECONDS = 60
CACHE_CONTROL = f"public, max-age={MAX_AGE_SECONDS}"


def make_etag(body: bytes) -> str:
    return '"' + hashlib.sha256(body).hexdigest()[:32] + '"'


def _matches(if_none_match: str | None, etag: str) -> bool:
    """¿Algún valor de `If-None-Match` coincide? Acepta lista, `W/` y `*`."""
    if not if_none_match:
        return False
    for candidate in if_none_match.split(","):
        candidate = candidate.strip()
        if candidate == "*":
            return True
        if candidate.startswith("W/"):
            candidate = candidate[2:]
        if candidate == etag:
            return True
    return False


def cached_json(request: Request, adapter: TypeAdapter[Any], data: Any) -> Response:
    """200 con el JSON y su `ETag`, o 304 sin cuerpo si el cliente ya lo tiene."""
    # Validar primero: acepta filas (dict) y descarta cualquier campo que el modelo no declare.
    body = adapter.dump_json(adapter.validate_python(data))
    etag = make_etag(body)
    headers = {"Cache-Control": CACHE_CONTROL, "ETag": etag}
    if _matches(request.headers.get("if-none-match"), etag):
        return Response(status_code=304, headers=headers)
    return Response(content=body, media_type="application/json", headers=headers)
