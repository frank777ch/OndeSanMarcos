"""Límite de peticiones por IP para los endpoints que consumen el LLM.

Protege la cuota de Gemini: sin esto, cualquiera podría llamar `/api/chat` en
bucle. Es una ventana deslizante en memoria, suficiente porque el backend corre
como un único proceso (ver `backend/Dockerfile`). Detrás de Caddy, uvicorn se
lanza con `--proxy-headers` para que `request.client.host` sea la IP real.

Se configura con `RATE_LIMIT_PER_MINUTE` (0 = desactivado).
"""

from __future__ import annotations

import time
from collections import deque
from collections.abc import Callable
from functools import lru_cache
from threading import Lock

from fastapi import Depends, HTTPException, Request

from app.config import get_settings

# Cada cuántas llaves distintas se purgan las IPs inactivas (evita crecer sin fin).
_SWEEP_THRESHOLD = 10_000


class RateLimiter:
    """Ventana deslizante: como máximo `limit` peticiones por `window` segundos."""

    def __init__(
        self,
        limit: int,
        window: float = 60.0,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self._limit = limit
        self._window = window
        self._clock = clock
        self._hits: dict[str, deque[float]] = {}
        self._lock = Lock()

    def hit(self, key: str) -> float | None:
        """Registra una petición. Devuelve None si se permite, o los segundos a
        esperar si `key` ya agotó su cupo."""
        if self._limit <= 0:
            return None
        now = self._clock()
        cutoff = now - self._window
        with self._lock:
            if len(self._hits) > _SWEEP_THRESHOLD:
                self._sweep(cutoff)
            hits = self._hits.setdefault(key, deque())
            while hits and hits[0] <= cutoff:
                hits.popleft()
            if len(hits) >= self._limit:
                return hits[0] + self._window - now
            hits.append(now)
            return None

    def _sweep(self, cutoff: float) -> None:
        stale = [key for key, hits in self._hits.items() if not hits or hits[-1] <= cutoff]
        for key in stale:
            del self._hits[key]


@lru_cache
def get_rate_limiter() -> RateLimiter:
    """Limitador compartido por el proceso, según la configuración."""
    return RateLimiter(get_settings().rate_limit_per_minute)


def enforce_rate_limit(
    request: Request,
    limiter: RateLimiter = Depends(get_rate_limiter),
) -> None:
    """Dependencia de FastAPI: responde 429 si la IP superó su cupo."""
    client_ip = request.client.host if request.client else "unknown"
    retry_after = limiter.hit(client_ip)
    if retry_after is not None:
        raise HTTPException(
            status_code=429,
            detail="Demasiadas consultas seguidas. Espera un momento e inténtalo de nuevo.",
            headers={"Retry-After": str(max(1, round(retry_after)))},
        )
