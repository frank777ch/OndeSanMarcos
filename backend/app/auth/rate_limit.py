"""Límite de intentos fallidos de login, en memoria (una sola instancia)."""

from __future__ import annotations

import math
import threading
import time
from collections.abc import Callable


class LoginRateLimiter:
    """Bloquea un usuario tras `max_failures` fallos seguidos dentro de `window` segundos."""

    def __init__(
        self,
        max_failures: int = 5,
        window: float = 15 * 60,
        block: float = 15 * 60,
        clock: Callable[[], float] = time.monotonic,
        max_entries: int = 10_000,
    ) -> None:
        self._max = max_failures
        self._window = window
        self._block = block
        self._clock = clock
        self._max_entries = max_entries
        self._failures: dict[str, list[float]] = {}
        self._blocked_until: dict[str, float] = {}
        self._lock = threading.Lock()

    @staticmethod
    def key(username: str) -> str:
        return username.strip().lower()

    def retry_after(self, key: str) -> int:
        """Segundos que faltan de bloqueo (0 si no está bloqueado)."""
        with self._lock:
            until = self._blocked_until.get(key)
            if until is None:
                return 0
            remaining = until - self._clock()
            if remaining <= 0:
                del self._blocked_until[key]
                return 0
            return math.ceil(remaining)

    def record_failure(self, key: str) -> None:
        with self._lock:
            now = self._clock()
            recent = [t for t in self._failures.get(key, []) if now - t < self._window]
            recent.append(now)
            if len(recent) >= self._max:
                self._failures.pop(key, None)
                self._blocked_until[key] = now + self._block
            else:
                self._failures[key] = recent
            self._trim(now)

    def record_success(self, key: str) -> None:
        with self._lock:
            self._failures.pop(key, None)

    def _trim(self, now: float) -> None:
        """Acota la memoria: descarta lo vencido y, si aún sobra, lo más antiguo."""
        if len(self._failures) + len(self._blocked_until) <= self._max_entries:
            return
        self._blocked_until = {k: u for k, u in self._blocked_until.items() if u > now}
        self._failures = {
            k: v for k, v in self._failures.items() if v and now - v[-1] < self._window
        }
        while len(self._failures) + len(self._blocked_until) > self._max_entries and self._failures:
            self._failures.pop(next(iter(self._failures)))


login_limiter = LoginRateLimiter()


def get_limiter() -> LoginRateLimiter:
    return login_limiter
