"""Proveedores de embeddings (vectorización de texto).

`BagOfWordsEmbedding` es un vectorizador determinista y sin dependencias: se
ajusta al vocabulario del corpus y representa cada texto como un vector de
frecuencias de términos (norma unitaria). No captura semántica profunda como
un modelo neuronal, pero sí la coincidencia léxica de forma **exacta** (sin
colisiones), lo que basta para probar el pipeline RAG de forma aislada.

El proveedor real (LlamaIndex + un modelo de embeddings) se enchufa en la
misma interfaz `EmbeddingProvider`.
"""

from __future__ import annotations

import math
import re
from collections.abc import Iterable
from typing import Protocol

from app.knowledge.places import normalize

_TOKEN_RE = re.compile(r"[a-z0-9]+")

# Palabras vacías frecuentes en español: se descartan para reducir ruido.
_STOPWORDS: frozenset[str] = frozenset(
    {
        "de", "la", "el", "los", "las", "un", "una", "unos", "unas", "y", "o",
        "en", "a", "que", "como", "donde", "cual", "esta", "este", "esto",
        "por", "para", "con", "del", "al", "se", "su", "sus", "mi", "tu",
        "es", "hay", "me", "te", "lo", "le", "ya", "muy", "mas",
    }
)


def tokenize(text: str) -> list[str]:
    """Normaliza, separa en tokens y descarta palabras vacías."""
    return [tok for tok in _TOKEN_RE.findall(normalize(text)) if tok not in _STOPWORDS]


def build_vocabulary(texts: Iterable[str]) -> list[str]:
    """Construye el vocabulario ordenado a partir de varios textos."""
    vocab: set[str] = set()
    for text in texts:
        vocab.update(tokenize(text))
    return sorted(vocab)


class EmbeddingProvider(Protocol):
    """Interfaz de un proveedor de embeddings."""

    @property
    def dim(self) -> int: ...

    def embed(self, text: str) -> list[float]: ...


class BagOfWordsEmbedding:
    """Vectorizador de frecuencias de términos ajustado a un vocabulario."""

    def __init__(self, vocabulary: Iterable[str]) -> None:
        self._index: dict[str, int] = {
            token: position for position, token in enumerate(vocabulary)
        }

    @property
    def dim(self) -> int:
        return len(self._index)

    def embed(self, text: str) -> list[float]:
        """Vector de norma unitaria con la frecuencia de tokens conocidos."""
        vector = [0.0] * self.dim
        for token in tokenize(text):
            position = self._index.get(token)
            if position is not None:
                vector[position] += 1.0

        norm = math.sqrt(sum(value * value for value in vector))
        if norm > 0.0:
            vector = [value / norm for value in vector]
        return vector
