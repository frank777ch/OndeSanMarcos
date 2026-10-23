"""Errores comunes del RAG (separados para evitar importaciones circulares)."""


class RagProviderError(RuntimeError):
    """Configuración inválida o servicio externo no disponible (LLM, Gemini, base)."""
