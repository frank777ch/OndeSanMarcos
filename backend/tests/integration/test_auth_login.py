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
    assert me.json() == {"username": "admin"}
    assert c.post("/api/auth/login", json={"username": "admin", "password": "otra"}).status_code == 401


def test_rf_25_8_deleted_admin_loses_access(client):
    c, url = client
    token = c.post("/api/auth/login", json={"username": "admin", "password": "secreto"}).json()["access_token"]
    with psycopg.connect(url, autocommit=True) as conn:
        conn.execute("delete from admin_users")
    assert c.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code == 401
