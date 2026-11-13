"""HU-25: login real contra Postgres con el administrador de HU-24."""

import psycopg
import pytest
from fastapi.testclient import TestClient

from app.auth.admin import ensure_initial_admin
from app.auth.dependencies import get_store
from app.auth.rate_limit import LoginRateLimiter, get_limiter
from app.main import create_app
from app.rag.db import Database

pytestmark = pytest.mark.integration


@pytest.fixture
def client(test_database_url):
    with psycopg.connect(test_database_url, autocommit=True) as conn:
        conn.execute("truncate admin_users restart identity")
    database = Database(test_database_url)
    ensure_initial_admin(database, "admin", "secreto")
    app = create_app()
    app.dependency_overrides[get_store] = lambda: database
    app.dependency_overrides[get_limiter] = lambda: LoginRateLimiter()
    try:
        yield TestClient(app), test_database_url
    finally:
        database.close()


def test_rf_25_1_login_and_me_against_postgres(client):
    c, _ = client
    r = c.post("/api/auth/login", json={"username": "admin", "password": "secreto"})
    assert r.status_code == 200
    me = c.get("/api/auth/me", headers={"Authorization": f"Bearer {r.json()['access_token']}"})
    assert me.json()["username"] == "admin"
    assert me.json()["created_at"]  # HU-37, RF-37.1
    assert c.post("/api/auth/login", json={"username": "admin", "password": "otra"}).status_code == 401


def test_rf_25_8_deleted_admin_loses_access(client):
    c, url = client
    token = c.post("/api/auth/login", json={"username": "admin", "password": "secreto"}).json()["access_token"]
    with psycopg.connect(url, autocommit=True) as conn:
        conn.execute("delete from admin_users")
    assert c.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_rf_37_3_change_password_against_postgres(client):
    c, url = client
    token = c.post("/api/auth/login", json={"username": "admin", "password": "secreto"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    wrong = c.post("/api/auth/change-password", json={"current_password": "x", "new_password": "nueva-clave-1"}, headers=headers)
    assert wrong.status_code == 403
    ok = c.post("/api/auth/change-password", json={"current_password": "secreto", "new_password": "nueva-clave-1"}, headers=headers)
    assert ok.status_code == 204
    assert c.post("/api/auth/login", json={"username": "admin", "password": "nueva-clave-1"}).status_code == 200
    assert c.post("/api/auth/login", json={"username": "admin", "password": "secreto"}).status_code == 401
    with psycopg.connect(url) as conn:
        stored = conn.execute("select password_hash from admin_users").fetchone()[0]
    assert stored.startswith("$2") and "nueva-clave-1" not in stored
