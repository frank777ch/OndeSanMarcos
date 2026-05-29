"""Pipeline de ingesta (offline): carga → troceado → embeddings → almacén.

Implementa el proceso del §3.3 de `documents/03-backend-rag.md`. Es un paso
previo a la conversación: prepara la base de conocimiento para la búsqueda
semántica.

El pipeline es agnóstico del almacén: trabaja contra cualquier objeto con un
método `add(VectorRecord)`. En modo aislado eso es el `InMemoryVectorStore`;
en producción será el almacén respaldado por pgvector (misma interfaz `add`),
de modo que migrar no cambia el pipeline.
"""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from pathlib import Path

from app.knowledge.corpus import DOCUMENTS, Document
from app.rag.embeddings import EmbeddingProvider
from app.rag.vector_store import VectorRecord


@dataclass(frozen=True)
class Chunk:
    """Fragmento de un documento, listo para vectorizar."""

    id: str
    document_id: str
    title: str
    text: str
    position: int
    place_id: str | None = None


def chunk_text(text: str, *, chunk_size: int = 400, overlap: int = 60) -> list[str]:
    """Trocea un texto en fragmentos de ~`chunk_size` caracteres.

    Corta en límites de palabra (nunca a mitad de palabra) y mantiene un
    solapamiento de hasta `overlap` caracteres entre fragmentos consecutivos
    para no perder contexto en las fronteras. `overlap` se acota a la mitad
    de `chunk_size` para evitar fragmentos degenerados.
    """
    words = text.split()
    if not words:
        return []

    overlap = max(0, min(overlap, chunk_size // 2))
    chunks: list[str] = []
    current: list[str] = []
    length = 0

    for word in words:
        separator = 1 if current else 0
        if current and length + separator + len(word) > chunk_size:
            chunks.append(" ".join(current))
            current, length = _overlap_tail(current, overlap)
            separator = 1 if current else 0
        current.append(word)
        length += separator + len(word)

    if current:
        chunks.append(" ".join(current))
    return chunks


def _overlap_tail(words: list[str], overlap: int) -> tuple[list[str], int]:
    """Últimas palabras que caben en `overlap` caracteres (semilla del próximo)."""
    tail: list[str] = []
    tail_len = 0
    for word in reversed(words):
        added = len(word) + (1 if tail else 0)
        if tail_len + added > overlap:
            break
        tail.insert(0, word)
        tail_len += added
    return tail, tail_len


def split_document(
    document: Document, *, chunk_size: int = 400, overlap: int = 60
) -> list[Chunk]:
    """Divide un documento en `Chunk`s numerados."""
    pieces = chunk_text(document.text, chunk_size=chunk_size, overlap=overlap)
    return [
        Chunk(
            id=f"{document.id}::{position}",
            document_id=document.id,
            title=document.title,
            text=piece,
            position=position,
            place_id=document.place_id,
        )
        for position, piece in enumerate(pieces)
    ]


def split_documents(
    documents: Iterable[Document], *, chunk_size: int = 400, overlap: int = 60
) -> list[Chunk]:
    """Aplica `split_document` a varios documentos."""
    chunks: list[Chunk] = []
    for document in documents:
        chunks.extend(
            split_document(document, chunk_size=chunk_size, overlap=overlap)
        )
    return chunks


def ingest_chunks(chunks: Iterable[Chunk], embedding: EmbeddingProvider, store) -> int:
    """Vectoriza cada chunk y lo inserta en el almacén. Devuelve cuántos."""
    count = 0
    for chunk in chunks:
        vector = embedding.embed(f"{chunk.title}. {chunk.text}")
        store.add(
            VectorRecord(
                id=chunk.id,
                text=chunk.text,
                vector=vector,
                metadata={
                    "document_id": chunk.document_id,
                    "place_id": chunk.place_id,
                    "title": chunk.title,
                    "position": chunk.position,
                },
            )
        )
        count += 1
    return count


def load_documents(sources_dir: str | None = None) -> list[Document]:
    """Carga los documentos fuente.

    Si `sources_dir` apunta a una carpeta con archivos `.md`/`.txt`, los lee
    desde ahí (el título es el primer encabezado Markdown o el nombre del
    archivo). Si no se indica carpeta o está vacía, usa el corpus en código
    (`app.knowledge.corpus.DOCUMENTS`).
    """
    if not sources_dir:
        return list(DOCUMENTS)

    root = Path(sources_dir)
    if not root.is_dir():
        return list(DOCUMENTS)

    documents: list[Document] = []
    files = sorted(root.glob("*.md")) + sorted(root.glob("*.txt"))
    for file in files:
        raw = file.read_text(encoding="utf-8").strip()
        if not raw:
            continue
        documents.append(
            Document(id=file.stem, title=_title_from(raw, file.stem), text=raw)
        )
    return documents or list(DOCUMENTS)


def _title_from(text: str, fallback: str) -> str:
    """Primer encabezado Markdown (`# ...`) del texto, o el `fallback`."""
    first_line = text.lstrip().splitlines()[0] if text.strip() else ""
    if first_line.startswith("#"):
        return first_line.lstrip("#").strip() or fallback
    return fallback
