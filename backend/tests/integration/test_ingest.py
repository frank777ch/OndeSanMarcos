"""RF-23.10 y RF-23.21: ingesta idempotente, atómica y que protege los datos."""

import psycopg
import pytest

from app.config import get_settings
from app.rag import ingest_pgvector as ip
from app.rag.errors import RagProviderError
from tests.integration.conftest import row, vec

pytestmark = pytest.mark.integration


class _Embedding:
    hits = 0
    misses = 0

    def embed_document(self, text: str) -> list[float]:
        return vec(len(text) % 768)


class _FailsAfter:
    """Falla en la llamada n (simula agotar el límite de Gemini a mitad de la ingesta)."""

    def __init__(self, n: int):
        self.n = n
        self.calls = 0

    def embed_document(self, text: str) -> list[float]:
        self.calls += 1
        if self.calls > self.n:
            raise RagProviderError("límite de uso")
        return vec(0)


@pytest.fixture
def fake_embeddings(monkeypatch):
    monkeypatch.setattr(ip, "build_embedding_provider", lambda settings: _Embedding())
    monkeypatch.setattr(ip, "load_entry_documents", lambda: [])


def test_ingest_loads_the_corpus(db, fake_embeddings):
    count = ip.ingest(get_settings(), database=db)
    assert count > 0
    assert db.count() == count


def test_ingest_twice_leaves_the_same_rows(db, fake_embeddings):
    """RF-23.10: idempotente, sin duplicar."""
    first = ip.ingest(get_settings(), database=db)
    second = ip.ingest(get_settings(), force=True, database=db)
    assert first == second
    assert db.count() == first


def test_ingest_refuses_to_overwrite_without_force(db, fake_embeddings):
    """RF-23.21"""
    db.insert_rows([row("existente", "a", vec(0))])
    assert ip.ingest(get_settings(), database=db) == 0
    assert db.count() == 1


def test_failed_ingest_keeps_previous_data(db, monkeypatch):
    """RF-23.10 y RF-23.23: si Gemini falla a mitad, los datos anteriores quedan intactos."""
    db.insert_rows([row("anterior", "a", vec(0)), row("anterior 2", "b", vec(1))])
    monkeypatch.setattr(ip, "build_embedding_provider", lambda settings: _FailsAfter(3))
    monkeypatch.setattr(ip, "load_entry_documents", lambda: [])

    with pytest.raises(RagProviderError):
        ip.ingest(get_settings(), force=True, database=db)

    assert db.count() == 2


def test_replace_all_is_atomic_when_a_row_is_invalid(db, test_database_url):
    """RF-23.10: un fallo dentro de la transacción revierte también el borrado."""
    db.insert_rows([row("anterior", "a", vec(0))])
    bad = row("mala", "b", [0.0, 1.0, 2.0])  # dimensión incorrecta: la base la rechaza

    with pytest.raises(psycopg.Error):
        db.replace_all([row("buena", "c", vec(1)), bad])

    with psycopg.connect(test_database_url) as conn:
        contents = [r[0] for r in conn.execute("select content from documents")]
    assert contents == ["anterior"]
