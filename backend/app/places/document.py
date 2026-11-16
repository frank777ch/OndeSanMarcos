"""Ficha de un lugar para el asistente (HU-29).

Arma, desde la fila de la tabla `places`, el documento que se trocea y se embebe para que el
asistente conozca el lugar. Es una función pura: no toca la base ni llama a Gemini.

El documento se identifica por el **slug** del lugar (`place-<slug>`): es estable entre bases,
porque `update_place` no lo cambia, mientras que el id numérico lo asigna cada base.
"""

from __future__ import annotations

from collections.abc import Iterable

from app.knowledge.corpus import Document

SOURCE_TYPE_PLACE = "place"


def _text(value: object) -> str:
    return value.strip() if isinstance(value, str) else ""


def _items(value: object) -> list[str]:
    if not isinstance(value, Iterable) or isinstance(value, str):
        return []
    return [item.strip() for item in value if isinstance(item, str) and item.strip()]


def place_document(place: dict) -> Document:
    """Documento del lugar: nombre, descripción y los datos de la ficha que no estén vacíos.

    `place` es una fila de `places`; opcionalmente trae `category_label` (etiqueta de su
    categoría) y `parent_name` (nombre del lugar que lo contiene).
    """
    name = _text(place.get("name"))
    lines: list[str] = [f"{name}."]

    description = _text(place.get("description"))
    if description:
        lines.append(description)

    short_name = _text(place.get("short_name"))
    if short_name:
        lines.append(f"Sigla: {short_name}.")

    category = _text(place.get("category_label"))
    if category:
        lines.append(f"Categoría: {category}.")

    parent = _text(place.get("parent_name"))
    if parent:
        lines.append(f"Está dentro de: {parent}.")

    schedule = _text(place.get("schedule"))
    if schedule:
        lines.append(f"Horario: {schedule}.")

    detailed = _items(place.get("detailed_schedule"))
    if detailed:
        lines.append(f"Horario detallado: {'; '.join(detailed)}.")

    access = _text(place.get("access_hint"))
    if access:
        lines.append(f"Cómo llegar: {access}")

    careers = _items(place.get("careers"))
    if careers:
        lines.append(f"Carreras: {', '.join(careers)}.")

    services = _items(place.get("services"))
    if services:
        lines.append(f"Servicios: {', '.join(services)}.")

    usage = _text(place.get("usage"))
    if usage:
        lines.append(f"Uso: {usage}")

    phone = _text(place.get("phone"))
    annex = _text(place.get("annex"))
    if phone and annex:
        lines.append(f"Teléfono: {phone}, anexo {annex}.")
    elif phone:
        lines.append(f"Teléfono: {phone}.")
    elif annex:
        lines.append(f"Anexo: {annex}.")

    email = _text(place.get("email"))
    if email:
        lines.append(f"Correo: {email}.")

    website = _text(place.get("website"))
    if website:
        lines.append(f"Sitio web: {website}")

    slug = _text(place.get("slug"))
    return Document(id=f"place-{slug}", title=name, text=" ".join(lines), place_id=slug)
