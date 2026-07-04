"""Configuración de pruebas: fuerza el modo mock (hermético y offline).

Independiza la suite del archivo `.env` local del desarrollador, que puede
apuntar a un LLM real (p. ej. Gemini). Al fijar `RAG_USE_MOCK=true` por variable
de entorno —que tiene prioridad sobre `.env` en pydantic-settings— los tests son
deterministas y no hacen llamadas de red.
"""

import os

os.environ["RAG_USE_MOCK"] = "true"

from app.config import get_settings  # noqa: E402
from app.rag.engine import get_engine  # noqa: E402

# Descarta cualquier configuración/motor cacheado que se hubiera construido
# leyendo el `.env` antes de fijar la variable de entorno.
get_settings.cache_clear()
get_engine.cache_clear()
