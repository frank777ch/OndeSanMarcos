"""HU-29: sincronización real de un lugar con el asistente (RF-29.5 a RF-29.8), sin Postgres ni Gemini."""

import pytest

from app.config import get_settings
from app.places.directory import PlaceDirectory
from app.places.sync import NullPlaceSync, RagPlaceSync, get_place_sync, safe_sync


class FakeDatabase:
    def __init__(self, place):
        self.place = place
        self.calls: list[tuple] = []

    def place_for_sync(self, place_id):
        return self.place

    def replace_source(self, source_type, source_id, rows):
        self.calls.append(("replace", source_type, source_id, rows))

    def delete_source(self, source_type, source_id):
        self.calls.append(("delete", source_type, source_id))
        return 1


class FakeEmbedding:
    def __init__(self, fail=False):
        self.fail = fail
        self.texts: list[str] = []

    def embed_document(self, text):
        if self.fail:
            raise RuntimeError("Gemini caído")
        self.texts.append(text)
        return [0.1, 0.2]


def place(published=True, slug="laboratorio-zeta"):
    return {
        "id": 7,
        "slug": slug,
        "name": "Laboratorio Zeta",
        "description": "Laboratorio de pruebas.",
        "schedule": "Lun–Vie 9:00–17:00",
        "category_label": "Servicios",
        "is_published": published,
    }


class CountingDirectory(PlaceDirectory):
    def __init__(self):
        super().__init__(lambda: [])
        self.invalidations = 0

    def invalidate(self):
        self.invalidations += 1
        super().invalidate()


def build(db, embedding=None, factory=None):
    directory = CountingDirectory()
    sync = RagPlaceSync(db, factory or (lambda: embedding), get_settings(), directory)
    return sync, directory


def test_rf_29_5_un_lugar_publicado_reemplaza_su_ficha():
    db, embedding = FakeDatabase(place()), FakeEmbedding()
    sync, directory = build(db, embedding)

    assert sync.sync(7) == "ok"

    kind, source_type, source_id, rows = db.calls[0]
    assert (kind, source_type, source_id) == ("replace", "place", "laboratorio-zeta")
    assert rows and all((r["source_type"], r["source_id"]) == ("place", "laboratorio-zeta") for r in rows)
    assert any("Laboratorio Zeta" in text for text in embedding.texts)
    assert directory.invalidations == 1


def test_rf_29_6_un_lugar_despublicado_pierde_su_ficha_sin_llamar_a_embeddings():
    db, embedding = FakeDatabase(place(published=False)), FakeEmbedding()
    sync, directory = build(db, embedding)

    assert sync.sync(7) == "ok"

    assert db.calls == [("delete", "place", "laboratorio-zeta")]
    assert embedding.texts == []
    assert directory.invalidations == 1


def test_rf_29_7_si_falla_el_embedding_la_ficha_anterior_queda_intacta():
    db = FakeDatabase(place())
    sync, directory = build(db, FakeEmbedding(fail=True))

    assert safe_sync(sync, 7) == "failed"

    assert db.calls == []
    # El lugar sí cambió en `places`: el directorio debe verlo aunque la ficha no se haya podido rehacer.
    assert directory.invalidations == 1


def test_rf_29_7_sin_clave_de_embeddings_sale_failed_y_no_un_error():
    def sin_clave():
        raise RuntimeError("Falta LLM_API_KEY")

    db = FakeDatabase(place())
    sync, _ = build(db, factory=sin_clave)

    assert safe_sync(sync, 7) == "failed"
    assert db.calls == []


def test_rf_29_7_un_lugar_que_ya_no_existe_sale_failed():
    sync, _ = build(FakeDatabase(None), FakeEmbedding())
    assert sync.sync(99) == "failed"


def test_rf_29_5_el_embedding_se_crea_una_sola_vez():
    created = []

    def factory():
        created.append(1)
        return FakeEmbedding()

    sync, _ = build(FakeDatabase(place()), factory=factory)
    sync.sync(7)
    sync.sync(7)
    assert created == [1]


def test_rf_29_8_en_modo_de_prueba_no_se_sincroniza():
    # tests/conftest.py fija RAG_USE_MOCK=true.
    sync = get_place_sync()
    assert isinstance(sync, NullPlaceSync)
    assert sync.sync(1) == "skipped"


def test_rf_29_8_sin_base_de_datos_no_se_sincroniza(monkeypatch):
    monkeypatch.setenv("RAG_USE_MOCK", "false")
    monkeypatch.setenv("DATABASE_URL", "")
    get_settings.cache_clear()
    try:
        assert isinstance(get_place_sync(), NullPlaceSync)
    finally:
        monkeypatch.undo()
        get_settings.cache_clear()
