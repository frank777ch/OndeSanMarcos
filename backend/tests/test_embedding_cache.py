"""Tests de la caché de embeddings y los reintentos (sin red ni Gemini)."""

from __future__ import annotations

import json

import pytest

from app.rag.embedding_cache import CachedEmbedding, is_transient, with_retries
from app.rag.errors import RagProviderError

DIM = 3


class _Inner:
    """Proveedor falso que cuenta las llamadas (cada una gastaría cuota)."""

    def __init__(self):
        self.document_calls = 0
        self.query_calls = 0

    def embed_document(self, text: str) -> list[float]:
        self.document_calls += 1
        return [float(len(text)), 0.0, 1.0]

    def embed(self, text: str) -> list[float]:
        self.query_calls += 1
        return [0.0, float(len(text)), 1.0]


def _cache(tmp_path, inner=None, **kwargs):
    return CachedEmbedding(
        inner or _Inner(),
        tmp_path / "cache" / "embeddings.jsonl",
        model="gemini-embedding-001",
        dim=DIM,
        sleep=lambda s: None,
        **kwargs,
    )


# --- caché de documentos (RF-23.22) ---------------------------------------


def test_same_document_text_is_embedded_only_once(tmp_path):
    inner = _Inner()
    cache = _cache(tmp_path, inner)

    first = cache.embed_document("Biblioteca Central")
    second = cache.embed_document("Biblioteca Central")

    assert first == second
    assert inner.document_calls == 1
    assert (cache.misses, cache.hits) == (1, 1)


def test_cache_persists_across_instances(tmp_path):
    """Una reingesta (otro proceso) no vuelve a llamar a Gemini."""
    _cache(tmp_path).embed_document("Comedor")
    inner = _Inner()

    again = _cache(tmp_path, inner)
    assert again.embed_document("Comedor") == [7.0, 0.0, 1.0]

    assert inner.document_calls == 0
    assert (again.misses, again.hits) == (0, 1)


def test_cache_key_depends_on_text_model_and_dim(tmp_path):
    path = tmp_path / "e.jsonl"
    a = CachedEmbedding(_Inner(), path, model="m1", dim=DIM)
    b = CachedEmbedding(_Inner(), path, model="m2", dim=DIM)
    c = CachedEmbedding(_Inner(), path, model="m1", dim=DIM + 1)
    assert len({a._key("x"), b._key("x"), c._key("x"), a._key("y")}) == 4


def test_cache_ignores_corrupt_lines_and_wrong_dimension(tmp_path):
    path = tmp_path / "cache" / "embeddings.jsonl"
    path.parent.mkdir()
    ok = CachedEmbedding(_Inner(), path, model="m", dim=DIM)
    good_key = ok._key("bueno")
    path.write_text(
        json.dumps({"k": good_key, "v": [1.0, 2.0, 3.0]})
        + "\n{linea cortada\n"
        + json.dumps({"k": "otra", "v": [1.0]})  # dimensión incorrecta
        + "\n",
        encoding="utf-8",
    )

    cache = CachedEmbedding(_Inner(), path, model="m", dim=DIM)

    assert cache.embed_document("bueno") == [1.0, 2.0, 3.0]
    assert cache.hits == 1 and cache.misses == 0
    assert "otra" not in cache._documents


def test_failed_embedding_is_not_cached(tmp_path):
    class _Boom(_Inner):
        def embed_document(self, text):
            raise RuntimeError("clave inválida")

    cache = _cache(tmp_path, _Boom())
    with pytest.raises(RagProviderError):
        cache.embed_document("x")
    assert cache.misses == 0
    assert not (tmp_path / "cache" / "embeddings.jsonl").exists()


# --- caché de consultas (RF-23.25) -----------------------------------------


def test_repeated_query_does_not_call_gemini_again(tmp_path):
    inner = _Inner()
    cache = _cache(tmp_path, inner)

    cache.embed("¿Dónde queda la biblioteca?")
    cache.embed("¿Dónde queda la biblioteca?")
    cache.embed("otra pregunta")

    assert inner.query_calls == 2


def test_query_cache_is_lru(tmp_path):
    inner = _Inner()
    cache = _cache(tmp_path, inner, query_cache_size=2)
    cache.embed("a")
    cache.embed("b")
    cache.embed("a")  # a pasa a ser la más reciente
    cache.embed("c")  # expulsa a «b»
    calls = inner.query_calls

    cache.embed("a")  # sigue en caché
    assert inner.query_calls == calls
    cache.embed("b")  # fue expulsada
    assert inner.query_calls == calls + 1


# --- reintentos (RF-23.23) -------------------------------------------------


class _ApiError(Exception):
    def __init__(self, code):
        super().__init__(f"error {code}")
        self.code = code


def test_is_transient_classification():
    assert is_transient(_ApiError(429))
    assert is_transient(_ApiError(503))
    assert is_transient(TimeoutError())
    assert not is_transient(_ApiError(400))
    assert not is_transient(ValueError("x"))


def test_retries_with_increasing_wait_until_success():
    attempts = {"n": 0}
    waits: list[float] = []

    def flaky():
        attempts["n"] += 1
        if attempts["n"] < 4:
            raise _ApiError(429)
        return "ok"

    assert with_retries(flaky, sleep=waits.append) == "ok"
    assert attempts["n"] == 4
    assert waits == [1.0, 2.0, 4.0]


def test_retries_give_up_after_five_attempts_with_clear_message():
    attempts = {"n": 0}
    waits: list[float] = []

    def always_limited():
        attempts["n"] += 1
        raise _ApiError(429)

    with pytest.raises(RagProviderError, match="5 intentos"):
        with_retries(always_limited, sleep=waits.append)
    assert attempts["n"] == 5
    assert waits == [1.0, 2.0, 4.0, 8.0]


def test_non_transient_errors_are_not_retried():
    attempts = {"n": 0}

    def bad_key():
        attempts["n"] += 1
        raise _ApiError(400)

    with pytest.raises(RagProviderError):
        with_retries(bad_key, sleep=lambda s: None)
    assert attempts["n"] == 1


def test_exhausted_retries_keep_what_was_already_embedded(tmp_path):
    """Lo embebido antes del fallo queda en la caché para la siguiente corrida."""

    class _Limit(_Inner):
        def embed_document(self, text):
            if text == "segundo":
                raise _ApiError(429)
            return super().embed_document(text)

    cache = _cache(tmp_path, _Limit())
    cache.embed_document("primero")
    with pytest.raises(RagProviderError):
        cache.embed_document("segundo")

    inner = _Inner()
    again = _cache(tmp_path, inner)
    again.embed_document("primero")
    assert inner.document_calls == 0
