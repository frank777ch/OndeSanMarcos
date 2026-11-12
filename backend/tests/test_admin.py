"""HU-24: administrador inicial (sin Postgres: base en memoria)."""

from __future__ import annotations

import logging

import pytest
from fastapi.testclient import TestClient

from app.auth.admin import ensure_initial_admin
from app.auth.passwords import hash_password, verify_password
from app.config import Settings, get_settings
from app.main import create_app, seed_admin
from app.rag.errors import RagProviderError


class FakeAdminStore:
    def __init__(self) -> None:
        self.admins: dict[str, str] = {}

    def admin_exists(self, username: str) -> bool:
        return username in self.admins

    def insert_admin(self, username: str, password_hash: str) -> bool:
        if username in self.admins:
            return False
        self.admins[username] = password_hash
        return True


def test_rf_24_3_creates_the_admin_when_missing():
    store = FakeAdminStore()
    assert ensure_initial_admin(store, "admin", "secreto") is True
    assert list(store.admins) == ["admin"]


def test_rf_24_4_password_is_stored_hashed():
    store = FakeAdminStore()
    ensure_initial_admin(store, "admin", "secreto")
    stored = store.admins["admin"]
    assert stored != "secreto" and stored.startswith("$2b$")
    assert verify_password("secreto", stored)
    assert not verify_password("otra", stored)


def test_rf_24_5_existing_admin_is_not_modified():
    store = FakeAdminStore()
    ensure_initial_admin(store, "admin", "secreto")
    before = store.admins["admin"]
    assert ensure_initial_admin(store, "admin", "nueva-clave") is False
    assert store.admins == {"admin": before}


def test_rf_24_6_without_credentials_nothing_is_created():
    store = FakeAdminStore()
    assert ensure_initial_admin(store, "", "secreto") is False
    assert ensure_initial_admin(store, "admin", "") is False
    assert store.admins == {}


def test_rf_24_6_without_database_url_the_app_does_not_start(monkeypatch):
    settings = Settings(_env_file=None, database_url="", admin_username="a", admin_password="b")
    with pytest.raises(RuntimeError, match="DATABASE_URL"):
        seed_admin(settings)
    monkeypatch.setenv("DATABASE_URL", "")
    get_settings.cache_clear()
    try:
        with pytest.raises(RuntimeError, match="DATABASE_URL"):
            with TestClient(create_app()):
                pass  # el lifespan falla al arrancar
    finally:
        get_settings.cache_clear()


def test_rf_24_6_without_admin_credentials_it_warns_and_starts(monkeypatch, caplog):
    def boom(_settings):
        raise AssertionError("no debe abrir la base")

    monkeypatch.setattr("app.main.get_database", boom)
    with caplog.at_level(logging.WARNING):
        seed_admin(Settings(_env_file=None, database_url="postgresql://x", admin_username="", admin_password=""))
    assert "ADMIN_USERNAME" in caplog.text


def test_rf_24_7_seed_survives_database_down_and_does_not_log_the_password(monkeypatch, caplog):
    def down(_settings):
        raise RagProviderError("No se pudo conectar a la base de datos.")

    monkeypatch.setattr("app.main.get_database", down)
    settings = Settings(
        _env_file=None, database_url="postgresql://x", admin_username="admin", admin_password="secreto"
    )
    with caplog.at_level(logging.WARNING):
        seed_admin(settings)  # no lanza
    assert "administrador inicial" in caplog.text
    assert "secreto" not in caplog.text


def test_rf_24_7_seed_survives_a_password_over_72_bytes(monkeypatch, caplog):
    monkeypatch.setattr("app.main.get_database", lambda _s: FakeAdminStore())
    settings = Settings(
        _env_file=None, database_url="postgresql://x", admin_username="admin", admin_password="a" * 73
    )
    with caplog.at_level(logging.WARNING):
        seed_admin(settings)
    assert "72 bytes" in caplog.text


def test_hash_is_salted():
    assert hash_password("x") != hash_password("x")
