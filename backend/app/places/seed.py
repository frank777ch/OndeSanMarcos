"""Carga de los lugares y categorías del campus a Postgres desde `places.json`.

La semilla (`backend/db/seed/places.json`) la genera una sola vez
`app.tools.places.export_seed`; esta carga **solo lee ese JSON** y no depende de
`places.ts`, `places.py` ni del corpus (que se retirarán más adelante).

- Valida todo ANTES de escribir: si un lugar no es válido, no se escribe nada y
  el error nombra el lugar y el motivo.
- Es idempotente: `on conflict do nothing`. Lo que ya está en la base no se
  modifica, así que las ediciones posteriores a la carga se conservan.
- Los lugares se cargan sin `verified_at`: los datos de ficha están sin confirmar.

Uso (desde `backend/`):
    python -m app.places.seed [--seed RUTA]
Desde Docker: `./scripts/dev.sh seed-places`.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.rag.db import PLACE_SEED_COLUMNS, Database

SCHEMA = "ondesanmarcos.places-seed/v3"
DEFAULT_SEED_PATH = Path(__file__).resolve().parents[2] / "db" / "seed" / "places.json"

_SLUG = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
_COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")
_LIST_FIELDS = ("keywords", "detailed_schedule", "careers", "services")
_TEXT_FIELDS = (
    "short_name", "description", "schedule", "phone", "annex", "email",
    "website", "access_hint", "usage", "image_url", "parent_slug",
)


class SeedError(Exception):
    """La semilla no es válida. El mensaje nombra el lugar y el motivo."""


@dataclass(frozen=True)
class Seed:
    categories: list[dict]
    places: list[dict]


@dataclass(frozen=True)
class SeedResult:
    categories_inserted: int
    places_inserted: int
    places_existing: int


def load_seed(path: str | Path = DEFAULT_SEED_PATH) -> Seed:
    """Lee la semilla; lanza `SeedError` si no existe o no tiene el formato."""
    target = Path(path)
    try:
        data = json.loads(target.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise SeedError(f"No existe la semilla {target}. Genérala con la exportación.") from exc
    except json.JSONDecodeError as exc:
        raise SeedError(f"La semilla {target} no es un JSON válido: {exc}") from exc
    if not isinstance(data, dict) or data.get("schema") != SCHEMA:
        raise SeedError(f"La semilla {target} no tiene el esquema {SCHEMA!r}.")
    categories, places = data.get("categories"), data.get("places")
    if not isinstance(categories, list) or not isinstance(places, list):
        raise SeedError("La semilla debe tener las listas «categories» y «places».")
    return Seed(categories=categories, places=places)


def _blank_to_none(value: Any) -> Any:
    """Cadena vacía o solo espacios → `None` (RF-22.4)."""
    if isinstance(value, str):
        value = value.strip()
        return value or None
    return value


def _number(value: Any) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    return float(value)


def validate_seed(seed: Seed) -> Seed:
    """Comprueba la semilla y devuelve filas normalizadas listas para insertar.

    Lanza `SeedError` ante el primer problema; no toca la base.
    """
    categories: list[dict] = []
    category_ids: set[str] = set()
    for index, raw in enumerate(seed.categories):
        category_slug = _blank_to_none(raw.get("slug"))
        label = f"categoría {category_slug or f'#{index + 1}'}"
        if not category_slug or not _SLUG.match(category_slug):
            raise SeedError(f"{label}: el slug debe tener minúsculas, dígitos y guiones.")
        if category_slug in category_ids:
            raise SeedError(f"{label}: slug repetido.")
        if not _blank_to_none(raw.get("label")):
            raise SeedError(f"{label}: falta la etiqueta.")
        if not _COLOR.match(str(raw.get("color", ""))):
            raise SeedError(f"{label}: el color debe ser #RRGGBB.")
        category_ids.add(category_slug)
        categories.append(
            {
                "slug": category_slug,
                "label": raw["label"].strip(),
                "color": raw["color"],
                "sort_order": int(raw.get("sort_order", index)),
            }
        )

    places: list[dict] = []
    place_slugs: set[str] = set()
    for index, raw in enumerate(seed.places):
        slug = _blank_to_none(raw.get("slug"))
        label = f"lugar {slug or f'#{index + 1}'}"
        if not slug or not _SLUG.match(slug):
            raise SeedError(f"{label}: el slug debe tener minúsculas, dígitos y guiones.")
        if slug in place_slugs:
            raise SeedError(f"{label}: slug repetido.")
        name = _blank_to_none(raw.get("name"))
        if not name:
            raise SeedError(f"{label}: falta el nombre.")
        category_slug = _blank_to_none(raw.get("category_slug"))
        if category_slug not in category_ids:
            raise SeedError(f"{label}: la categoría {category_slug!r} no existe.")
        lat, lng = _number(raw.get("lat")), _number(raw.get("lng"))
        if lat is None or not -90 <= lat <= 90:
            raise SeedError(f"{label}: latitud fuera de rango ({raw.get('lat')!r}).")
        if lng is None or not -180 <= lng <= 180:
            raise SeedError(f"{label}: longitud fuera de rango ({raw.get('lng')!r}).")

        row: dict[str, Any] = {
            "slug": slug,
            "name": name,
            "category_slug": category_slug,
            "lat": lat,
            "lng": lng,
        }
        for field in _TEXT_FIELDS:
            row[field] = _blank_to_none(raw.get(field))
        for field in _LIST_FIELDS:
            items = raw.get(field) or []
            if not isinstance(items, list) or not all(isinstance(i, str) for i in items):
                raise SeedError(f"{label}: «{field}» debe ser una lista de textos.")
            row[field] = [i.strip() for i in items if i.strip()]
        place_slugs.add(slug)
        places.append({column: row[column] for column in PLACE_SEED_COLUMNS})

    for row in places:
        parent = row["parent_slug"]
        if parent is not None and (parent not in place_slugs or parent == row["slug"]):
            raise SeedError(f"lugar {row['slug']}: el lugar padre {parent!r} no es válido.")
    return Seed(categories=categories, places=places)


def apply_seed(db: Database, seed: Seed) -> SeedResult:
    """Valida e inserta lo que falte. Una segunda corrida no inserta nada."""
    valid = validate_seed(seed)
    categories_inserted = db.insert_place_categories(valid.categories)
    places_inserted = db.insert_places(_parents_last(valid.places))
    return SeedResult(
        categories_inserted=categories_inserted,
        places_inserted=places_inserted,
        places_existing=len(valid.places) - places_inserted,
    )


def _parents_last(rows: list[dict]) -> list[dict]:
    """Ordena para que cada lugar padre se inserte antes que sus hijos."""
    by_slug = {row["slug"]: row for row in rows}
    ordered: list[dict] = []
    seen: set[str] = set()

    def visit(row: dict) -> None:
        if row["slug"] in seen:
            return
        seen.add(row["slug"])
        parent = row["parent_slug"]
        if parent is not None:
            visit(by_slug[parent])
        ordered.append(row)

    for row in rows:
        visit(row)
    return ordered


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Carga los lugares del campus en la base.")
    parser.add_argument("--seed", default=str(DEFAULT_SEED_PATH), help="ruta de places.json")
    args = parser.parse_args(argv)

    from app.config import get_settings
    from app.rag.db import get_database
    from app.rag.errors import RagProviderError

    try:
        seed = load_seed(args.seed)
        result = apply_seed(get_database(get_settings()), seed)
    except SeedError as exc:
        print(f"Semilla no válida: {exc}", file=sys.stderr)
        return 1
    except RagProviderError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    print(
        f"Categorías nuevas: {result.categories_inserted} · "
        f"lugares nuevos: {result.places_inserted} · "
        f"ya existían: {result.places_existing}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
