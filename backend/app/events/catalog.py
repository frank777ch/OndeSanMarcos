"""Valores permitidos de un evento y sus nombres en español."""

from __future__ import annotations

CATEGORIES: dict[str, str] = {
    "academico": "Académico",
    "cultural": "Cultural",
    "deportivo": "Deportivo",
    "feria": "Feria",
    "charla": "Charla o conferencia",
    "taller": "Taller",
    "institucional": "Institucional",
    "otro": "Otro",
}
DEFAULT_CATEGORY = "otro"

STATUSES: dict[str, str] = {
    "scheduled": "Programado",
    "cancelled": "Cancelado",
    "postponed": "Reprogramado",
}
DEFAULT_STATUS = "scheduled"

MODALITIES: dict[str, str] = {
    "in_person": "Presencial",
    "online": "Virtual",
    "hybrid": "Híbrido",
}
DEFAULT_MODALITY = "in_person"
