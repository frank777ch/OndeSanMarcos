"""Proveedores de generación de lenguaje (LLM).

`TemplateLLM` es un generador determinista y sin dependencias: redacta la
respuesta **a partir del contexto recuperado**, nunca de conocimiento propio.
Así se respeta el principio del RAG (respuestas ancladas a documentos) incluso
en modo aislado. El proveedor real (OpenAI / Anthropic vía LlamaIndex) se
enchufa en la misma interfaz `LLMProvider`.
"""

from __future__ import annotations

from typing import Protocol


class LLMProvider(Protocol):
    """Interfaz de un proveedor de generación de texto."""

    def generate(self, query: str, contexts: list[str]) -> str: ...


class TemplateLLM:
    """LLM mock: construye la respuesta a partir de los fragmentos de contexto."""

    def generate(self, query: str, contexts: list[str]) -> str:
        """Redacta una respuesta basada únicamente en `contexts`."""
        relevant = [text.strip() for text in contexts if text.strip()]
        if not relevant:
            return (
                "No tengo esa información oficial sobre el campus en este "
                "momento."
            )
        # Se ancla al fragmento más relevante (primero) para no "alucinar".
        return relevant[0]
