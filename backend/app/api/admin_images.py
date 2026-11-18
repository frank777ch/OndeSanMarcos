"""Subida de la imagen de portada de un lugar. Requiere sesión de administrador.

El archivo se guarda en el almacén (Garage) y la respuesta trae su dirección pública. El panel la
pone en el campo `image_url` del lugar al guardarlo; así sirve igual al crear que al editar.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_admin
from app.storage import ImageStorage, StorageError, get_image_storage

logger = logging.getLogger(__name__)

MAX_IMAGE_BYTES = 5 * 1024 * 1024

router = APIRouter(prefix="/api/admin/place-images", tags=["admin-place-images"])


class ImageUploadedOut(BaseModel):
    url: str = Field(description="Dirección pública de la imagen (http o https).")


def _detect(data: bytes) -> tuple[str, str] | None:
    """(extensión, content-type) según los primeros bytes; no se confía en el nombre ni en el tipo que declara el cliente."""
    if data.startswith(b"\xff\xd8\xff"):
        return "jpg", "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png", "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp", "image/webp"
    return None


def get_storage() -> ImageStorage:
    """Almacén de imágenes o 503 si no está configurado (se reemplaza en los tests)."""
    try:
        return get_image_storage()
    except StorageError as exc:
        logger.warning("Subida de imagen sin almacén: %s", exc)
        raise HTTPException(status_code=503, detail="El almacén de imágenes no está disponible.") from exc


_RESPONSES: dict[int | str, dict[str, Any]] = {
    401: {"description": "Falta la sesión de administrador o venció."},
    413: {"description": "La imagen pesa más de 5 MB."},
    415: {"description": "No es una imagen JPG, PNG o WebP."},
    503: {"description": "El almacén de imágenes no responde."},
}


@router.post("", status_code=201, response_model=ImageUploadedOut, responses=_RESPONSES, summary="Subir una imagen de portada")
def upload_place_image(
    file: UploadFile,
    _: str = Depends(get_current_admin),
    storage: ImageStorage = Depends(get_storage),
) -> ImageUploadedOut:
    """Acepta JPG, PNG o WebP de hasta 5 MB. Devuelve la dirección pública para guardarla en `image_url`."""
    data = file.file.read(MAX_IMAGE_BYTES + 1)
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="La imagen pesa más de 5 MB.")
    kind = _detect(data)
    if kind is None:
        raise HTTPException(status_code=415, detail="Solo se admiten imágenes JPG, PNG o WebP.")
    extension, content_type = kind
    try:
        url = storage.put(f"uploads/{uuid.uuid4().hex}.{extension}", data, content_type)
    except StorageError as exc:
        logger.error("No se pudo guardar la imagen: %s", exc)
        raise HTTPException(status_code=503, detail="El almacén de imágenes no está disponible.") from exc
    return ImageUploadedOut(url=url)
