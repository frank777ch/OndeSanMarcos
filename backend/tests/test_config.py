"""Tests de la configuración (sin Supabase)."""

from app.config import Settings


def test_supabase_settings_no_longer_exist():
    """RF-23.8: Supabase se eliminó; solo queda DATABASE_URL."""
    fields = Settings.model_fields
    assert "supabase_url" not in fields
    assert "supabase_service_key" not in fields
    assert "database_url" in fields


def test_database_url_defaults_to_empty_and_reads_env(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)  # en Docker viene fijada
    assert Settings(_env_file=None).database_url == ""
    monkeypatch.setenv("DATABASE_URL", "postgresql://u:p@db:5432/x")
    assert Settings(_env_file=None).database_url == "postgresql://u:p@db:5432/x"


def test_db_connect_timeout_default_is_a_few_seconds():
    """RF-23.14: la conexión no debe colgarse más de unos segundos."""
    assert 1 <= Settings(_env_file=None).db_connect_timeout <= 5
