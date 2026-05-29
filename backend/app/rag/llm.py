"""Proveedores de generación de lenguaje (LLM).

`TemplateLLM` es un generador determinista y sin dependencias: redacta la
respuesta **a partir del contexto recuperado**, nunca de conocimiento propio.
Así se respeta el principio del RAG (respuestas ancladas a documentos) incluso
en modo aislado. El proveedor real (OpenAI / Anthropic vía LlamaIndex) se
enchufa en la misma interfaz `LLMProvider`.
"""

from __future__ import annotations

from typing import Protocol

# System prompt compartido por los proveedores reales. Refuerza, del lado del
# LLM, el principio del RAG y los guardrails (§3.6): responder SOLO con el
# contexto recuperado, en español y sin inventar.
SYSTEM_PROMPT = (
    "Eres el asistente oficial de la Universidad Nacional Mayor de San Marcos "
    "(UNMSM). Responde de forma breve, clara y en español, usando ÚNICAMENTE "
    "la información del contexto proporcionado. Si el contexto no contiene la "
    "respuesta, di explícitamente que no tienes esa información oficial. No "
    "inventes horarios, oficinas ni datos que no estén en el contexto."
)


def build_prompt(query: str, contexts: list[str]) -> str:
    """Arma el mensaje de usuario: contexto recuperado + consulta."""
    joined = "\n\n".join(f"- {text.strip()}" for text in contexts if text.strip())
    return (
        f"Contexto oficial de la UNMSM:\n{joined}\n\n"
        f"Pregunta del usuario: {query}\n\n"
        "Responde solo con el contexto anterior."
    )


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


class OpenAILLM:
    """Proveedor real basado en la API de OpenAI (Chat Completions).

    El SDK `openai` es una dependencia opcional (`requirements-rag.txt`) y se
    importa de forma perezosa: este módulo se puede importar sin tenerlo.
    """

    def __init__(self, api_key: str, model: str = "gpt-4o-mini") -> None:
        try:
            from openai import OpenAI  # import perezoso
        except ImportError as exc:  # pragma: no cover - depende de extra opcional
            raise ImportError(
                "Falta el paquete 'openai'. Instálalo con "
                "`pip install -r requirements-rag.txt`."
            ) from exc
        self._client = OpenAI(api_key=api_key)
        self._model = model

    def generate(self, query: str, contexts: list[str]) -> str:  # pragma: no cover
        response = self._client.chat.completions.create(
            model=self._model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": build_prompt(query, contexts)},
            ],
            temperature=0.2,
        )
        return (response.choices[0].message.content or "").strip()


class AnthropicLLM:
    """Proveedor real basado en la API de Anthropic (Messages).

    El SDK `anthropic` es una dependencia opcional y se importa de forma
    perezosa.
    """

    def __init__(self, api_key: str, model: str = "claude-haiku-4-5-20251001") -> None:
        try:
            from anthropic import Anthropic  # import perezoso
        except ImportError as exc:  # pragma: no cover - depende de extra opcional
            raise ImportError(
                "Falta el paquete 'anthropic'. Instálalo con "
                "`pip install -r requirements-rag.txt`."
            ) from exc
        self._client = Anthropic(api_key=api_key)
        self._model = model

    def generate(self, query: str, contexts: list[str]) -> str:  # pragma: no cover
        message = self._client.messages.create(
            model=self._model,
            max_tokens=600,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": build_prompt(query, contexts)}],
        )
        parts = [block.text for block in message.content if block.type == "text"]
        return "".join(parts).strip()
