"""Tests del retriever pgvector: mapeo y recuperación. Sin red ni `supabase`.

El acceso a la base se inyecta (un `matcher` y un embedding falsos), de modo que
estos tests son deterministas y no requieren el paquete `supabase`.
"""

from app.rag.pgvector import PgVectorRetriever, _rows_to_chunks


def test_rows_to_chunks_maps_content_score_and_place_id():
    rows = [
        {
            "content": "La Biblioteca Central abre a las 8.",
            "similarity": 0.9,
            "metadata": {
                "document_id": "doc-biblioteca",
                "place_id": "biblioteca-central",
                "title": "Biblioteca Central Pedro Zulen",
            },
        }
    ]
    chunks = _rows_to_chunks(rows)
    assert len(chunks) == 1
    assert chunks[0].document.id == "doc-biblioteca"
    assert chunks[0].document.place_id == "biblioteca-central"
    assert chunks[0].document.text == "La Biblioteca Central abre a las 8."
    assert chunks[0].score == 0.9


def test_rows_to_chunks_collapses_to_best_per_document():
    rows = [
        {"content": "frag A1", "similarity": 0.5, "metadata": {"document_id": "d1"}},
        {"content": "frag A2", "similarity": 0.8, "metadata": {"document_id": "d1"}},
        {"content": "frag B", "similarity": 0.7, "metadata": {"document_id": "d2"}},
    ]
    chunks = _rows_to_chunks(rows)
    assert [c.document.id for c in chunks] == ["d1", "d2"]  # por mejor score desc
    assert chunks[0].score == 0.8  # mejor fragmento de d1
    assert chunks[0].document.text == "frag A2"


class _FakeEmbedding:
    dim = 3

    def embed(self, text: str) -> list[float]:
        return [1.0, 0.0, 0.0]


def test_retriever_embeds_query_and_returns_top_k():
    captured: dict = {}

    def matcher(vector: list[float], count: int) -> list[dict]:
        captured["vector"] = vector
        captured["count"] = count
        return [
            {"content": "c1", "similarity": 0.9, "metadata": {"document_id": "d1"}},
            {"content": "c2", "similarity": 0.8, "metadata": {"document_id": "d2"}},
            {"content": "c3", "similarity": 0.7, "metadata": {"document_id": "d3"}},
        ]

    retriever = PgVectorRetriever(_FakeEmbedding(), matcher)
    result = retriever.retrieve("¿a qué hora abre la biblioteca?", top_k=2)

    assert captured["vector"] == [1.0, 0.0, 0.0]  # embebe la consulta
    assert captured["count"] == 8  # top_k(2) * oversample(4)
    assert [c.document.id for c in result] == ["d1", "d2"]  # recorta a top_k
