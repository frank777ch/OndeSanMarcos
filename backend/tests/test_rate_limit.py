"""HU-25: límite de intentos fallidos (reloj inyectado)."""

from app.auth.rate_limit import LoginRateLimiter


class Clock:
    def __init__(self) -> None:
        self.now = 1000.0

    def __call__(self) -> float:
        return self.now


def make():
    clock = Clock()
    return LoginRateLimiter(clock=clock), clock


def test_rf_25_10_five_failures_block_for_15_minutes():
    limiter, _ = make()
    for _ in range(4):
        limiter.record_failure("ana")
        assert limiter.retry_after("ana") == 0
    limiter.record_failure("ana")
    assert limiter.retry_after("ana") == 900


def test_rf_25_10_retry_after_counts_down_and_unblocks():
    limiter, clock = make()
    for _ in range(5):
        limiter.record_failure("ana")
    clock.now += 600
    assert limiter.retry_after("ana") == 300
    clock.now += 300
    assert limiter.retry_after("ana") == 0
    # tras el bloqueo vuelve a empezar de cero
    limiter.record_failure("ana")
    assert limiter.retry_after("ana") == 0


def test_rf_25_10_a_success_resets_the_count():
    limiter, _ = make()
    for _ in range(4):
        limiter.record_failure("ana")
    limiter.record_success("ana")
    for _ in range(4):
        limiter.record_failure("ana")
    assert limiter.retry_after("ana") == 0


def test_rf_25_10_failures_older_than_the_window_do_not_count():
    limiter, clock = make()
    for _ in range(4):
        limiter.record_failure("ana")
    clock.now += 901
    limiter.record_failure("ana")
    assert limiter.retry_after("ana") == 0


def test_rf_25_10_users_are_independent_and_normalized():
    limiter, _ = make()
    for _ in range(5):
        limiter.record_failure(limiter.key("  Ana "))
    assert limiter.retry_after(limiter.key("ana")) == 900
    assert limiter.retry_after(limiter.key("luis")) == 0


def test_memory_is_bounded():
    clock = Clock()
    limiter = LoginRateLimiter(clock=clock, max_entries=10)
    for i in range(50):
        limiter.record_failure(f"u{i}")
    assert len(limiter._failures) <= 10
