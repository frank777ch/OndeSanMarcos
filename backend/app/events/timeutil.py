"""Fechas de los eventos: se guardan en UTC y se escriben y muestran siempre en hora de Lima.

Lima es UTC-5 todo el año (no tiene horario de verano), por eso se usa un desfase fijo y no la base
de zonas horarias del sistema, que en una imagen mínima de Docker podría faltar.
"""

from __future__ import annotations

from datetime import datetime, time, timedelta, timezone

LIMA = timezone(timedelta(hours=-5), "America/Lima")

_DAYS = ("lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo")
_MONTHS = (
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "setiembre", "octubre", "noviembre", "diciembre",
)


def as_lima(value: datetime) -> datetime:
    """`value` en hora de Lima; una fecha sin zona se toma como hora de Lima."""
    if value.tzinfo is None:
        return value.replace(tzinfo=LIMA)
    return value.astimezone(LIMA)


def expires_at(starts_at: datetime, ends_at: datetime | None) -> datetime:
    """Cuándo se considera terminado: `ends_at`, o el fin del día de inicio (hora de Lima) si no hay."""
    if ends_at is not None:
        return ends_at
    start = as_lima(starts_at)
    return datetime.combine(start.date() + timedelta(days=1), time.min, tzinfo=LIMA)


def _day(value: datetime) -> str:
    return f"{_DAYS[value.weekday()]} {value.day} de {_MONTHS[value.month - 1]} de {value.year}"


def _hour(value: datetime) -> str:
    return value.strftime("%H:%M")


def describe_when(starts_at: datetime, ends_at: datetime | None) -> str:
    """Fecha y hora en español, para el asistente: «sábado 22 de noviembre de 2026, de 10:00 a 13:00»."""
    start = as_lima(starts_at)
    if ends_at is None:
        return f"{_day(start)}, a las {_hour(start)}"
    end = as_lima(ends_at)
    if end.date() == start.date():
        return f"{_day(start)}, de {_hour(start)} a {_hour(end)}"
    return f"del {_day(start)} a las {_hour(start)} al {_day(end)} a las {_hour(end)}"


def describe_today(now: datetime | None = None) -> str:
    """Hoy en español (hora de Lima), para el prompt: «martes 17 de noviembre de 2026»."""
    return _day(as_lima(now or datetime.now(timezone.utc)))
