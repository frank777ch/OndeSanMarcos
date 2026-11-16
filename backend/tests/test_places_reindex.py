"""HU-29: `reindex-places` sincroniza todos los lugares (RF-29.18)."""

from app.places import reindex


class _Sync:
    def __init__(self, results):
        self.results = results

    def sync(self, place_id):
        value = self.results[place_id]
        if isinstance(value, Exception):
            raise value
        return value


PLACES = [{"id": 1, "slug": "a"}, {"id": 2, "slug": "b"}, {"id": 3, "slug": "c"}]


def test_rf_29_18_cuenta_los_ok_y_los_fallidos_sin_detenerse(capsys):
    sync = _Sync({1: "ok", 2: RuntimeError("Gemini caído"), 3: "ok"})
    assert reindex.reindex_all(sync, PLACES) == (2, 1)
    assert "✗ b" in capsys.readouterr().err


def test_rf_29_18_sin_lugares_no_hay_nada_que_hacer():
    assert reindex.reindex_all(_Sync({}), []) == (0, 0)


def test_rf_29_18_en_modo_de_prueba_se_niega(capsys):
    # tests/conftest.py fija RAG_USE_MOCK=true.
    assert reindex.main() == 1
    assert "RAG_USE_MOCK=false" in capsys.readouterr().err
