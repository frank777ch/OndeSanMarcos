"""HU-25: login y `/me` (base de administradores en memoria)."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.auth import service
from app.auth.dependencies import get_current_admin, get_store
from app.auth.passwords import hash_password
from app.auth.rate_limit import LoginRateLimiter, get_limiter
from app.auth.tokens import create_access_token, require_jwt_secret
from app.config import get_settings
from app.main import create_app
from app.rag.errors import RagProviderError
from tests.fake_admin import FakeAdminStore

SECRET = "secreto-de-pruebas-con-mas-de-32-caracteres"
PASSWORD = "clave-correcta"


@pytest.fixture
def store():
    s = FakeAdminStore()
    s.admins["admin"] = hash_password(PASSWORD)
    return s


@pytest.fixture
def limiter():
    return LoginRateLimiter()


@pytest.fixture
def client(store, limiter):
    app = create_app()
    app.dependency_overrides[get_store] = lambda: store
    app.dependency_overrides[get_limiter] = lambda: limiter
    return TestClient(app)


def login(client, username="admin", password=PASSWORD):
    return client.post("/api/auth/login", json={"username": username, "password": password})


def bearer(token):
    return {"Authorization": f"Bearer {token}"}


def test_rf_25_1_login_returns_a_token(client):
    r = login(client)
    assert r.status_code == 200
    body = r.json()
    assert set(body) == {"access_token", "token_type", "expires_in"}
    assert body["token_type"] == "bearer"
    assert body["expires_in"] == 3600


def test_rf_25_2_unknown_user_and_wrong_password_look_the_same(client):
    a = login(client, "nadie", PASSWORD)
    b = login(client, "admin", "otra")
    assert a.status_code == b.status_code == 401
    assert a.json() == b.json()


def test_rf_25_2_unknown_user_still_verifies_a_hash(client, monkeypatch):
    calls = []
    real = service.verify_password
    monkeypatch.setattr(service, "verify_password", lambda p, h: calls.append(h) or real(p, h))
    login(client, "nadie", "x")
    assert len(calls) == 1


@pytest.mark.parametrize(
    "payload",
    [{}, {"username": "admin"}, {"password": "x"}, {"username": "", "password": "x"}, {"username": "a", "password": ""}],
)
def test_rf_25_3_missing_or_empty_fields_give_422(client, payload):
    assert client.post("/api/auth/login", json=payload).status_code == 422


def test_rf_25_3_password_over_72_bytes_is_just_wrong(client):
    assert login(client, password="a" * 100).status_code == 401


def test_rf_25_4_token_carries_subject_and_expiry(client):
    token = login(client).json()["access_token"]
    claims = jwt.decode(token, SECRET, algorithms=["HS256"])
    assert claims["sub"] == "admin"
    assert claims["exp"] - claims["iat"] == 3600


def test_rf_25_4_lifetime_is_configurable(client, monkeypatch):
    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "5")
    get_settings.cache_clear()
    try:
        assert login(client).json()["expires_in"] == 300
    finally:
        get_settings.cache_clear()


@pytest.mark.parametrize("secret", ["", "corta", "x" * 31])
def test_rf_25_5_short_or_missing_secret_stops_the_app(secret):
    with pytest.raises(RuntimeError, match="JWT_SECRET"):
        require_jwt_secret(secret)
    require_jwt_secret("x" * 32)


def test_rf_25_5_app_does_not_start_without_jwt_secret(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "")
    get_settings.cache_clear()
    try:
        with pytest.raises(RuntimeError, match="JWT_SECRET"):
            with TestClient(create_app()):
                pass
    finally:
        get_settings.cache_clear()


def test_rf_25_6_me_with_a_valid_token(client):
    token = login(client).json()["access_token"]
    r = client.get("/api/auth/me", headers=bearer(token))
    assert r.status_code == 200 and r.json() == {"username": "admin"}


def _assert_401(r):
    assert r.status_code == 401
    assert r.headers["www-authenticate"] == "Bearer"


def test_rf_25_7_missing_malformed_tampered_and_expired_tokens(client):
    _assert_401(client.get("/api/auth/me"))
    _assert_401(client.get("/api/auth/me", headers=bearer("no-es-un-token")))
    good = login(client).json()["access_token"]
    _assert_401(client.get("/api/auth/me", headers=bearer(good[:-3] + "abc")))
    other = jwt.encode({"sub": "admin", "exp": datetime.now(timezone.utc) + timedelta(hours=1)}, "otro-secreto" * 4, algorithm="HS256")
    _assert_401(client.get("/api/auth/me", headers=bearer(other)))
    past = datetime.now(timezone.utc) - timedelta(hours=3)
    expired, _ = create_access_token("admin", SECRET, 60, now=past)
    _assert_401(client.get("/api/auth/me", headers=bearer(expired)))
    no_exp = jwt.encode({"sub": "admin"}, SECRET, algorithm="HS256")
    _assert_401(client.get("/api/auth/me", headers=bearer(no_exp)))


def test_rf_25_8_token_of_a_deleted_admin(client, store):
    token = login(client).json()["access_token"]
    del store.admins["admin"]
    _assert_401(client.get("/api/auth/me", headers=bearer(token)))


def test_rf_25_9_any_new_endpoint_can_reuse_the_dependency(store):
    app = FastAPI()

    @app.get("/secreto")
    def secreto(admin: str = Depends(get_current_admin)):
        return {"admin": admin}

    app.dependency_overrides[get_store] = lambda: store
    c = TestClient(app)
    _assert_401(c.get("/secreto"))
    token, _ = create_access_token("admin", SECRET, 60)
    assert c.get("/secreto", headers=bearer(token)).json() == {"admin": "admin"}


def test_rf_25_10_five_failures_then_429_even_with_the_right_password(client):
    for _ in range(5):
        assert login(client, password="mala").status_code == 401
    r = login(client)
    assert r.status_code == 429
    assert int(r.headers["retry-after"]) > 0


def test_rf_25_10_success_resets_the_count(client):
    for _ in range(4):
        login(client, password="mala")
    assert login(client).status_code == 200
    for _ in range(4):
        assert login(client, password="mala").status_code == 401


def test_rf_25_11_database_down_gives_503(store, limiter):
    class Down:
        def get_admin(self, username):
            raise RagProviderError("No se pudo conectar a la base de datos.")

    app = create_app()
    app.dependency_overrides[get_store] = lambda: Down()
    app.dependency_overrides[get_limiter] = lambda: limiter
    c = TestClient(app)
    assert login(c).status_code == 503
    assert c.get("/api/auth/me", headers=bearer("x.y.z")).status_code == 401  # token inválido ni toca la base


def test_rf_25_12_no_password_or_hash_in_responses_or_logs(client, store, caplog):
    with caplog.at_level(logging.INFO):
        bad = login(client, password="mala-clave-secreta")
        for _ in range(5):
            login(client, password="mala-clave-secreta")
        ok_client_body = bad.text
    assert "mala-clave-secreta" not in ok_client_body + caplog.text
    assert store.admins["admin"] not in caplog.text + ok_client_body
    assert "admin" in caplog.text  # sí se registra el usuario
