"""Ficha de un evento para el asistente.

Arma, desde una fila de `events`, el documento que se trocea y se embebe para que el asistente conozca
el evento. Es una función pura: no toca la base ni llama a Gemini. Se identifica por el slug del evento
(`event-<slug>`). Su `place_id` es el slug del **lugar donde ocurre**, así el chat puede mostrarlo en el
mapa; el origen (`source_type='event'`, `source_id=<slug del evento>`) es lo que lo distingue de una ficha.
"""

from __future__ import annotations

from collections.abc import Iterable

from app.events.catalog import CATEGORIES, MODALITIES, STATUSES
from app.events.timeutil import describe_when, expires_at
from app.knowledge.corpus import Document

SOURCE_TYPE_EVENT = "event"


def _text(value: object) -> str:
    return value.strip() if isinstance(value, str) else ""


def _items(value: object) -> list[str]:
    if not isinstance(value, Iterable) or isinstance(value, str):
        return []
    return [item.strip() for item in value if isinstance(item, str) and item.strip()]


def event_document(event: dict) -> Document:
    """Documento del evento: título, fecha y hora en español y los datos que no estén vacíos.

    `event` es una fila de `events`; opcionalmente trae `place_name`, `place_slug` y `parent_name`
    (el lugar donde ocurre y el que lo contiene).
    """
    title = _text(event.get("title"))
    lines: list[str] = [f"Evento: {title}."]

    description = _text(event.get("description"))
    if description:
        lines.append(description)

    lines.append(f"Fecha y hora: {describe_when(event['starts_at'], event.get('ends_at'))}.")

    status = event.get("status")
    if status in STATUSES and status != "scheduled":
        note = _text(event.get("status_note"))
        lines.append(f"Estado: {STATUSES[status].upper()}." + (f" {note}" if note else ""))

    category = CATEGORIES.get(event.get("category") or "")
    if category:
        lines.append(f"Tipo: {category}.")

    modality = event.get("modality")
    if modality in MODALITIES:
        lines.append(f"Modalidad: {MODALITIES[modality]}.")

    place = _text(event.get("place_name"))
    detail = _text(event.get("location_detail"))
    if place:
        where = f"Lugar: {place}"
        parent = _text(event.get("parent_name"))
        if parent:
            where += f" (dentro de {parent})"
        if detail:
            where += f", {detail}"
        lines.append(where + ".")
    elif detail:
        lines.append(f"Lugar: {detail}.")

    online = _text(event.get("online_url"))
    if online:
        lines.append(f"Enlace para verlo en línea: {online}")

    organizer = _text(event.get("organizer"))
    if organizer:
        lines.append(f"Organiza: {organizer}.")

    audience = _text(event.get("audience"))
    if audience:
        lines.append(f"Dirigido a: {audience}.")

    is_free = event.get("is_free")
    price = _text(event.get("price_note"))
    if is_free is True:
        lines.append("Costo: gratis." if not price else f"Costo: gratis. {price}")
    elif is_free is False:
        lines.append("Costo: tiene costo." if not price else f"Costo: {price}")
    elif price:
        lines.append(f"Costo: {price}")

    registration = _text(event.get("registration_url"))
    reg_note = _text(event.get("registration_note"))
    if registration or reg_note:
        text = reg_note if not reg_note or reg_note.endswith(".") else reg_note + "."
        lines.append(" ".join(p for p in ("Inscripción:", text, f"Enlace: {registration}" if registration else "") if p))

    agenda = _items(event.get("agenda"))
    if agenda:
        lines.append(f"Programa: {'; '.join(agenda)}.")

    contact = [
        f"{label}: {value}"
        for label, value in (
            ("Teléfono", _text(event.get("phone"))),
            ("Correo", _text(event.get("email"))),
            ("Sitio web", _text(event.get("website"))),
        )
        if value
    ]
    if contact:
        lines.append(". ".join(contact) + ".")

    slug = _text(event.get("slug"))
    return Document(id=f"event-{slug}", title=title, text=" ".join(lines), place_id=_text(event.get("place_slug")) or None)


def event_expires_at(event: dict) -> str:
    """Fecha ISO (con zona) desde la que el asistente deja de mencionar el evento."""
    return expires_at(event["starts_at"], event.get("ends_at")).isoformat()
