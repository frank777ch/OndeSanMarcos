"""Pruebas del límite de consultas por IP (`app/api/ratelimit.py`)."""

from fastapi.testclient import TestClient

from app.api.ratelimit import RateLimiter, get_rate_limiter
from app.main import app


class FakeClock:
    def __init__(self) -> None:
        self.now = 1000.0

    def __call__(self) -> float:
        return self.now


def test_allows_up_to_limit_then_blocks():
    limiter = RateLimiter(3, window=60, clock=FakeClock())
    assert [limiter.hit("1.1.1.1") for _ in range(3)] == [None, None, None]
    assert limiter.hit("1.1.1.1") is not None


def test_limit_is_per_key():
    limiter = RateLimiter(1, window=60, clock=FakeClock())
    assert limiter.hit("1.1.1.1") is None
    assert limiter.hit("2.2.2.2") is None
    assert limiter.hit("1.1.1.1") is not None


def test_window_slides():
    clock = FakeClock()
    limiter = RateLimiter(2, window=60, clock=clock)
    limiter.hit("ip")
    clock.now += 30
    limiter.hit("ip")
    assert limiter.hit("ip") == 30  # el primer hit vence en 30 s
    clock.now += 30
    assert limiter.hit("ip") is None


def test_zero_disables_limit():
    limiter = RateLimiter(0, clock=FakeClock())
    assert all(limiter.hit("ip") is None for _ in range(100))


def test_sweep_drops_idle_keys(monkeypatch):
    import app.api.ratelimit as module

    monkeypatch.setattr(module, "_SWEEP_THRESHOLD", 2)
    clock = FakeClock()
    limiter = RateLimiter(5, window=60, clock=clock)
    for ip in ("a", "b", "c"):
        limiter.hit(ip)
    clock.now += 61
    limiter.hit("d")
    assert set(limiter._hits) == {"d"}


def test_chat_returns_429_with_retry_after():
    client = TestClient(app)
    limiter = RateLimiter(1, clock=FakeClock())
    app.dependency_overrides[get_rate_limiter] = lambda: limiter
    try:
        first = client.post("/api/chat", json={"query": "horario de la biblioteca"})
        second = client.post("/api/chat", json={"query": "horario de la biblioteca"})
    finally:
        app.dependency_overrides.pop(get_rate_limiter, None)
    assert first.status_code == 200
    assert second.status_code == 429
    assert int(second.headers["Retry-After"]) >= 1


def test_health_db_skipped_without_supabase():
    response = TestClient(app).get("/health/db")
    assert response.status_code == 200
    assert response.json() == {"status": "skipped"}
