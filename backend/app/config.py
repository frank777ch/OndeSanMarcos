"""Configuración central del backend.

Lee variables de entorno (o un archivo `.env`) mediante pydantic-settings.
El flag `rag_use_mock` permite ejecutar todo el motor RAG de forma aislada,
sin LLM ni base vectorial externa (ideal para pruebas).
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Ajustes de la aplicación cargados desde el entorno."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Aplicación ---
    app_name: str = "OndeSanMarcos RAG API"
    app_env: str = "development"
    cors_origins: str = "*"

    # --- Motor RAG ---
    rag_use_mock: bool = True
    rag_top_k: int = 4
    rag_score_threshold: float = 0.12

    # --- Pipeline de ingesta ---
    # Tamaño y solapamiento (en caracteres) de cada fragmento al trocear.
    rag_chunk_size: int = 400
    rag_chunk_overlap: int = 60
    # Carpeta con documentos fuente (.md/.txt). Vacío = usar el corpus en código.
    knowledge_sources_dir: str = ""

    # --- Proveedores reales (solo si rag_use_mock=False) ---
    llm_provider: str = ""
    llm_api_key: str = ""
    llm_model: str = ""
    supabase_url: str = ""
    supabase_service_key: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        """`cors_origins` como lista (separada por comas)."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    """Devuelve una instancia cacheada de la configuración."""
    return Settings()
