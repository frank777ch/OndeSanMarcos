"""Pruebas del motor RAG (pipeline completo en modo mock)."""

import pytest

from app.rag import guardrails
from app.rag.engine import NO_INFO_MESSAGE, build_engine


@pytest.fixture
def engine():
    return build_engine()


def test_answer_is_grounded_and_returns_location(engine):
    result = engine.answer("¿a qué hora abre la biblioteca?")
    assert "biblioteca" in result.answer.lower()
    assert any(loc.id == "biblioteca-central" for loc in result.locations)


def test_out_of_scope_query_is_declined(engine):
    result = engine.answer("dame una receta de ceviche")
    assert result.answer == guardrails.OUT_OF_SCOPE_MESSAGE
    assert result.locations == []


def test_in_scope_without_data_returns_no_info(engine):
    # "decanato" es del dominio (in-scope) pero no hay documento ni lugar.
    result = engine.answer("cómo contacto al decanato")
    assert result.answer == NO_INFO_MESSAGE
    assert result.locations == []


def test_query_with_keyword_detects_place(engine):
    result = engine.answer("quiero almorzar en el comedor")
    assert any(loc.id == "comedor-universitario" for loc in result.locations)


def test_incidental_place_mentions_are_excluded(engine):
    # Otros documentos mencionan "biblioteca" de pasada, pero solo la Biblioteca
    # Central es realmente relevante: no debe arrastrar facultades ni residencia.
    result = engine.answer("¿a qué hora abre la biblioteca?")
    assert [loc.id for loc in result.locations] == ["biblioteca-central"]


# --- HU-29: el motor usa el directorio de lugares -----------------------------------------------

from app.knowledge.corpus import Document  # noqa: E402
from app.places.directory import PlaceDirectory  # noqa: E402
from app.rag.engine import RAGEngine  # noqa: E402
from app.rag.llm import TemplateLLM  # noqa: E402
from app.rag.retriever import RetrievedChunk  # noqa: E402


class _FixedRetriever:
    def __init__(self, chunks):
        self.chunks = chunks

    def retrieve(self, query, top_k=4):
        return self.chunks


def _lugar(slug, name, keywords=()):
    return {"slug": slug, "name": name, "keywords": list(keywords), "schedule": None, "lat": -12.05, "lng": -77.08}


def _engine(places, chunks=()):
    return RAGEngine(_FixedRetriever(list(chunks)), TemplateLLM(), places=PlaceDirectory(lambda: places))


def test_rf_29_11_un_lugar_nuevo_se_devuelve_con_su_slug():
    engine = _engine([_lugar("quimera-tower", "Quimera Tower")])
    result = engine.answer("quiero ir a quimera tower")
    assert [loc.id for loc in result.locations] == ["quimera-tower"]


def test_rf_29_14_un_lugar_publicado_no_se_rechaza_por_estar_fuera_de_vocabulario():
    assert not guardrails.is_in_scope("dónde queda quimera tower")  # el vocabulario no lo conoce
    result = _engine([_lugar("quimera-tower", "Quimera Tower")]).answer("dónde queda quimera tower")
    assert result.answer != guardrails.OUT_OF_SCOPE_MESSAGE
    assert [loc.id for loc in result.locations] == ["quimera-tower"]


def test_rf_29_14_sin_el_lugar_la_misma_consulta_se_rechaza():
    result = _engine([]).answer("dónde queda quimera tower")
    assert result.answer == guardrails.OUT_OF_SCOPE_MESSAGE


def test_rf_29_13_los_fragmentos_de_un_lugar_despublicado_no_se_usan():
    fragmento = RetrievedChunk(
        document=Document(id="place-viejo", title="Viejo", text="Info del lugar viejo.", place_id="viejo"), score=0.9
    )
    # «viejo» ya no está entre los lugares publicados: su ficha no debe aparecer en la respuesta.
    result = _engine([_lugar("otro", "Otro lugar")], [fragmento]).answer("horario de la biblioteca")
    assert result.answer == NO_INFO_MESSAGE
    assert result.locations == []


def test_rf_29_13_los_fragmentos_de_un_lugar_publicado_si_se_usan():
    fragmento = RetrievedChunk(
        document=Document(id="place-vivo", title="Vivo", text="Info del lugar vivo.", place_id="vivo"), score=0.9
    )
    result = _engine([_lugar("vivo", "Lugar Vivo")], [fragmento]).answer("horario de la biblioteca")
    assert "Info del lugar vivo" in result.answer
    assert [loc.id for loc in result.locations] == ["vivo"]


def test_un_lugar_sin_horario_no_dice_horario_vacio():
    result = _engine([_lugar("quimera-tower", "Quimera Tower")]).answer("dónde queda quimera tower")
    assert "Horario" not in result.answer
