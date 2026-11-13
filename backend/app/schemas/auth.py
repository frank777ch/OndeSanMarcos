"""Esquemas del login de administrador."""

from __future__ import annotations

import re
from datetime import datetime

from pydantic import BaseModel, Field, ValidationInfo, field_validator

from app.auth.passwords import MAX_PASSWORD_BYTES

MIN_PASSWORD_LENGTH = 8


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1, max_length=1000)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class MeResponse(BaseModel):
    username: str
    created_at: datetime = Field(description="Fecha de alta del administrador.")


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=1000, description="Contraseña actual.")
    new_password: str = Field(
        min_length=MIN_PASSWORD_LENGTH,
        max_length=1000,
        description="Contraseña nueva: 8 a 72 bytes, con al menos una letra y un número, distinta de la actual.",
    )

    @field_validator("new_password")
    @classmethod
    def _valid_new_password(cls, value: str, info: ValidationInfo) -> str:
        if len(value.encode("utf-8")) > MAX_PASSWORD_BYTES:
            raise ValueError(f"No puede superar los {MAX_PASSWORD_BYTES} bytes.")
        if not re.search(r"[^\W\d_]", value) or not re.search(r"\d", value):
            raise ValueError("Debe incluir al menos una letra y un número.")
        if value == info.data.get("current_password"):
            raise ValueError("Debe ser distinta de la actual.")
        return value
