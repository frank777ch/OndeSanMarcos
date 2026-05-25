"""Pruebas del pipeline de ingesta (troceado, división y carga)."""

from app.knowledge.corpus import Document
from app.rag.embeddings import BagOfWordsEmbedding, build_vocabulary
from app.rag.ingestion import (
    chunk_text,
    ingest_chunks,
    load_documents,
    split_document,
    split_documents,
)
from app.rag.vector_store import InMemoryVectorStore


def test_chunk_text_short_text_is_single_chunk():
    chunks = chunk_text("texto corto de prueba", chunk_size=400, overlap=60)
    assert chunks == ["texto corto de prueba"]


def test_chunk_text_splits_long_text_with_overlap():
    text = " ".join(f"palabra{i}" for i in range(100))
    chunks = chunk_text(text, chunk_size=80, overlap=20)
    assert len(chunks) > 1
    # Ningún fragmento excede el tamaño objetivo.
    assert all(len(chunk) <= 80 for chunk in chunks)
    # No se corta a mitad de palabra.
    assert all(" " not in chunk[:1] for chunk in chunks)


def test_chunk_text_empty_returns_no_chunks():
    assert chunk_text("   ", chunk_size=100, overlap=10) == []


def test_split_document_numbers_chunks_and_keeps_place():
    doc = Document(
        id="doc-x",
        title="T",
        text=" ".join(f"w{i}" for i in range(60)),
        place_id="rectorado",
    )
    chunks = split_document(doc, chunk_size=40, overlap=10)
    assert len(chunks) > 1
    assert [c.position for c in chunks] == list(range(len(chunks)))
    assert all(c.document_id == "doc-x" for c in chunks)
    assert all(c.place_id == "rectorado" for c in chunks)
    assert chunks[0].id == "doc-x::0"


def test_ingest_chunks_populates_store():
    docs = [Document(id="d1", title="A", text="biblioteca central horario")]
    chunks = split_documents(docs, chunk_size=400, overlap=60)
    embedding = BagOfWordsEmbedding(build_vocabulary([d.text for d in docs]))
    store = InMemoryVectorStore()
    count = ingest_chunks(chunks, embedding, store)
    assert count == len(chunks)
    assert len(store) == len(chunks)


def test_load_documents_defaults_to_corpus():
    docs = load_documents("")
    assert len(docs) >= 7


def test_load_documents_reads_markdown_dir(tmp_path):
    (tmp_path / "lugar.md").write_text(
        "# Sala de Cómputo\nLa sala atiende de 8 a 20.", encoding="utf-8"
    )
    (tmp_path / "nota.txt").write_text("Texto plano de prueba.", encoding="utf-8")
    docs = load_documents(str(tmp_path))
    titles = {d.title for d in docs}
    assert "Sala de Cómputo" in titles  # encabezado Markdown como título
    assert "nota" in {d.id for d in docs}  # nombre de archivo como id


def test_load_documents_missing_dir_falls_back_to_corpus():
    docs = load_documents("ruta/que/no/existe")
    assert len(docs) >= 7
