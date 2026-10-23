"""Revisión estática de `script/dev.sh` y `docker-compose.yml` (RF-23.1 a RF-23.3, RF-23.16, RF-23.20).

No ejecuta Docker: lee los archivos. Se omite si el repo raíz no está disponible
(por ejemplo dentro del contenedor del backend, que solo monta `backend/`).
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "script" / "dev.sh"
COMPOSE = ROOT / "docker-compose.yml"

pytestmark = pytest.mark.skipif(
    not (SCRIPT.exists() and COMPOSE.exists()),
    reason="El repositorio raíz no está disponible (p. ej. dentro del contenedor).",
)


def _block(name: str) -> str:
    """Texto del `case` del comando `name` en dev.sh."""
    text = SCRIPT.read_text(encoding="utf-8")
    match = re.search(rf"^  {re.escape(name)}\)(.*?)^    ;;|^  {re.escape(name)}\)(.*?;;)", text, re.S | re.M)
    assert match, f"No existe el comando {name!r} en dev.sh"
    return match.group(0)


@pytest.mark.parametrize("command", ["ingest", "psql", "db-dump", "db-restore", "db-reset"])
def test_dev_script_has_database_commands(command):
    """RF-23.16"""
    assert _block(command)


def test_clean_never_deletes_the_database_volume():
    """RF-23.20: `clean` conserva los vectores (regenerarlos gasta cuota de Gemini)."""
    block = _block("clean")
    assert "down -v" not in block and "--volumes" not in block
    assert "db_data" not in re.sub(r"#.*", "", block)  # ni siquiera lo nombra fuera de comentarios
    assert "web_node_modules" in block


def test_db_reset_asks_for_confirmation():
    """RF-23.20"""
    assert "confirm" in _block("db-reset")


def test_db_restore_asks_for_confirmation_when_there_is_data():
    """RF-23.24"""
    assert "confirm" in _block("db-restore")


def test_ingest_passes_flags_to_the_module_so_force_is_explicit():
    """RF-23.21: `--force` llega al módulo; sin él no se sobrescribe."""
    assert '"$@"' in _block("ingest")


def test_dev_script_has_no_automatic_destruction_of_volumes_outside_db_reset():
    text = SCRIPT.read_text(encoding="utf-8")
    for line in text.splitlines():
        if "docker volume rm" in line:
            assert "web_node_modules" in line or "$volume" in line


def test_compose_defines_db_migrate_and_waits_for_them():
    """RF-23.1 a RF-23.3"""
    text = COMPOSE.read_text(encoding="utf-8")
    assert "pgvector/pgvector:pg16" in text
    assert "flyway/flyway" in text
    assert "pg_isready" in text
    assert "service_completed_successfully" in text
    assert "127.0.0.1:" in text  # RF-23.7: solo localhost
    assert "db_data:/var/lib/postgresql/data" in text


def test_no_supabase_references_in_backend_or_compose():
    """RF-23.8 (escenario 12): salvo el registro histórico RESUMEN-AVANCE.md."""
    offenders = []
    for path in list((ROOT / "backend").rglob("*")) + [COMPOSE, SCRIPT]:
        if (
            not path.is_file()
            or path.name in {"RESUMEN-AVANCE.md", ".env", "test_dev_script.py", "test_config.py", "test_db.py", "test_schema.py"}
            or path.suffix in {".pyc", ".jsonl", ".dump"}
            or {".venv", "__pycache__", ".pytest_cache", ".rag_cache", "dumps"} & set(path.parts)
        ):
            continue
        if "supabase" in path.read_text(encoding="utf-8", errors="ignore").lower():
            offenders.append(str(path.relative_to(ROOT)))
    assert offenders == []
