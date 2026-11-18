"""Almacén de las imágenes de los lugares (Garage, compatible con S3).

La subida desde el panel (`POST /api/admin/place-images`) deja el archivo aquí y devuelve su dirección
pública, que el administrador guarda en `image_url` del lugar.
"""

from __future__ import annotations

from typing import Protocol

from app.config import Settings, get_settings


class StorageError(Exception):
    """El almacén no está configurado o no respondió."""


class ImageStorage(Protocol):
    def put(self, key: str, data: bytes, content_type: str) -> str:
        """Guarda `data` bajo `key` y devuelve su dirección pública."""
        ...


class S3ImageStorage:
    def __init__(self, settings: Settings) -> None:
        # boto3 es pesado de importar: solo se carga cuando de verdad se sube una imagen.
        import boto3
        from botocore.config import Config

        self._bucket = settings.s3_bucket
        self._public_url = settings.place_images_public_url.rstrip("/")
        self._client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint_url,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
            region_name=settings.s3_region,
            config=Config(
                signature_version="s3v4",
                s3={"addressing_style": "path"},
                connect_timeout=3,
                read_timeout=10,
                retries={"max_attempts": 1},
            ),
        )

    def put(self, key: str, data: bytes, content_type: str) -> str:
        from botocore.exceptions import BotoCoreError, ClientError

        try:
            self._client.put_object(
                Bucket=self._bucket,
                Key=key,
                Body=data,
                ContentType=content_type,
                CacheControl="public, max-age=86400",
            )
        except (BotoCoreError, ClientError) as exc:
            raise StorageError(str(exc)) from exc
        return f"{self._public_url}/{key}"


def get_image_storage() -> ImageStorage:
    """Almacén configurado (se reemplaza en los tests). `StorageError` si falta la configuración."""
    settings = get_settings()
    if not (settings.s3_endpoint_url and settings.s3_access_key and settings.s3_secret_key):
        raise StorageError("El almacén de imágenes no está configurado.")
    return S3ImageStorage(settings)
