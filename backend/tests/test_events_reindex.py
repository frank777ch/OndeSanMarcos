"""`reindex-events` sincroniza todos los eventos con el asistente."""

from app.events import reindex


class _Sync:
    def __init__(self, results):
        self.results = results

    def sync(self, event_id):
        value = self.results[event_id]
        if isinstance(value, Exception):
            raise value
        return value


EVENTS = [{"id": 1, "slug": "a"}, {"id": 2, "slug": "b"}, {"id": 3, "slug": "c"}]


def test_cuenta_los_ok_y_los_fallidos_sin_detenerse(capsys):
    sync = _Sync({1: "ok", 2: RuntimeError("Gemini caído"), 3: "ok"})
    assert reindex.reindex_all(sync, EVENTS) == (2, 1)
    assert "✗ b" in capsys.readouterr().err


def test_sin_eventos_no_hay_nada_que_hacer():
    assert reindex.reindex_all(_Sync({}), []) == (0, 0)


def test_en_modo_de_prueba_se_niega(capsys):
    assert reindex.main() == 1
    assert "RAG_USE_MOCK=false" in capsys.readouterr().err
