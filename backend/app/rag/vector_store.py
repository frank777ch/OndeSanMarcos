"""Almacén vectorial en memoria con búsqueda por similitud coseno.

Sustituye, para pruebas aisladas, a la base vectorial real (Supabase +
pgvector). La interfaz (`add` / `search`) es intencionalmente simple para que
migrar a pgvector sea directo.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any


@dataclass
class VectorRecord:
    """Un texto indexado con su vector y metadatos."""

    id: str
    text: str
    vector: list[float]
    metadata: dict[str, Any] = field(default_factory=dict)


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Similitud coseno entre dos vectores (0 si alguno es nulo)."""
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


class InMemoryVectorStore:
    """Colección de vectores con búsqueda top-k por coseno."""

    def __init__(self) -> None:
        self._records: list[VectorRecord] = []

    def add(self, record: VectorRecord) -> None:
        self._records.append(record)

    def __len__(self) -> int:
        return len(self._records)

    def search(
        self, query_vector: list[float], top_k: int = 4
    ) -> list[tuple[VectorRecord, float]]:
        """Devuelve los `top_k` registros más similares, ordenados desc."""
        scored = [
            (record, cosine_similarity(query_vector, record.vector))
            for record in self._records
        ]
        scored.sort(key=lambda pair: pair[1], reverse=True)
        return scored[:top_k]
