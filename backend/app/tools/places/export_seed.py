"""Exporta la semilla de lugares (`places.json`) y el mapa de ids (HU-22).

Se corrió **una sola vez** (HU-22). `places.ts` y su script de volcado ya se retiraron (HU-28); queda como registro de cómo se unieron las fuentes. El volcado de `places.ts` necesitaba Node (en el equipo);
la exportación, el entorno del backend (Docker, que monta `backend/` en `/app`):

    node web/scripts/dump-places.mjs > backend/db/seed/_places_raw.json
    docker compose run --rm --no-deps backend \
        python -m app.tools.places.export_seed --raw db/seed/_places_raw.json
    rm backend/db/seed/_places_raw.json     # el crudo no se versiona

Reglas:
  1. Base: `places.ts` (volcado crudo), que tiene la ficha más completa.
  2. Duplicados por nombre normalizado → un solo lugar (el de más datos); todos
     sus ids antiguos apuntan al mismo slug en `place_id_map.json`.
  3. Ids con slug se conservan; los numéricos reciben un slug derivado.
  4. Solo se completan campos VACÍOS: horario y palabras clave desde `places.py`;
     descripción desde el corpus (`place_id` del documento). Nunca se pisa un
     valor de la web.
  5. `[lng, lat]` → `lat`, `lng`. `verified_at` no se escribe (queda nulo).

La carga (`app.places.seed`) lee solo el JSON generado, no este módulo.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from app.knowledge.corpus import DOCUMENTS, Document
from app.knowledge.places import CAMPUS_PLACES, CampusPlace, normalize
from app.places.seed import DEFAULT_SEED_PATH, SCHEMA
from app.tools.places.slugs import derive_slug

DEFAULT_MAP_PATH = DEFAULT_SEED_PATH.with_name("place_id_map.json")

_NUMERIC = re.compile(r"^\d+$")
_LISTS = ("keywords", "detailed_schedule", "careers", "services")
_TEXTS = ("description", "schedule", "phone", "annex", "usage")


@dataclass
class Report:
    exported: int = 0
    merged: list[str] = field(default_factory=list)
    completed: list[str] = field(default_factory=list)
    differences: list[str] = field(default_factory=list)
    only_in_backend: list[str] = field(default_factory=list)

    def lines(self) -> list[str]:
        out = [f"Lugares exportados: {self.exported}"]
        for title, items in (
            ("Fusionados", self.merged),
            ("Campos completados", self.completed),
            ("Diferencias web ≠ places.py (se conserva la web)", self.differences),
            ("Solo en places.py (no se exportan)", self.only_in_backend),
        ):
            out.append(f"{title}: {len(items)}")
            out.extend(f"  - {item}" for item in items)
        return out


def _filled(raw: dict) -> int:
    """Cuántos campos de la ficha trae el registro (para elegir el de más datos)."""
    return sum(1 for key, value in raw.items() if key not in {"id", "name", "category", "coordinates"} and value)


def _clean(value: Any) -> Any:
    if isinstance(value, str):
        return value.strip() or None
    return value


def _web_row(raw: dict, slug: str) -> dict:
    lng, lat = raw["coordinates"]
    row: dict[str, Any] = {
        "id": slug,
        "name": raw["name"].strip(),
        "category_id": raw["category"],
        "lat": lat,
        "lng": lng,
        "keywords": list(raw.get("keywords") or []),
        "detailed_schedule": list(raw.get("detailedSchedule") or []),
        "careers": list(raw.get("careers") or []),
        "services": list(raw.get("services") or []),
    }
    for key in _TEXTS:
        row[key] = _clean(raw.get(key))
    return row


def build_seed(
    raw: dict,
    backend_places: list[CampusPlace] | None = None,
    documents: list[Document] | None = None,
) -> tuple[dict, dict[str, str], Report]:
    """Arma la semilla, el mapa de ids y el informe. No lee ni escribe archivos."""
    backend_places = CAMPUS_PLACES if backend_places is None else backend_places
    documents = DOCUMENTS if documents is None else documents
    report = Report()

    categories = [
        {"id": c["id"], "label": c["label"], "color": c["color"], "sort_order": index}
        for index, c in enumerate(raw["categories"])
    ]

    # 1. Agrupar por nombre normalizado (los duplicados se fusionan).
    groups: dict[str, list[dict]] = {}
    for item in raw["places"]:
        groups.setdefault(normalize(item["name"]).strip(), []).append(item)

    # 2. Slugs: los ids que ya son slug se reservan primero.
    taken = {item["id"] for item in raw["places"] if not _NUMERIC.match(item["id"])}
    id_map: dict[str, str] = {}
    rows: list[dict] = []
    for group in groups.values():
        winner = max(group, key=_filled)  # `max` conserva el primero en empates
        slug_ids = [i["id"] for i in group if not _NUMERIC.match(i["id"])]
        if slug_ids:
            slug = slug_ids[0]
        else:
            slug = derive_slug(winner["name"], taken)
            taken.add(slug)
        for item in group:
            id_map[item["id"]] = slug
        if len(group) > 1:
            ids = ", ".join(f"«{i['id']}»" for i in group)
            report.merged.append(f"{winner['name']}: ids {ids} → {slug} (se conserva «{winner['id']}»)")
        rows.append(_web_row(winner, slug))

    # 3. Completar solo lo vacío desde places.py y el corpus.
    by_id = {p.id: p for p in backend_places}
    by_name = {normalize(p.name).strip(): p for p in backend_places}
    matched: set[str] = set()
    for row in rows:
        backend = by_id.get(row["id"]) or by_name.get(normalize(row["name"]).strip())
        place_ids = {row["id"]}
        if backend is not None:
            matched.add(backend.id)
            place_ids.add(backend.id)
            if not row["schedule"] and backend.schedule:
                row["schedule"] = backend.schedule
                report.completed.append(f"{row['id']}: horario desde places.py")
            elif backend.schedule and row["schedule"] != backend.schedule:
                report.differences.append(f"{row['id']}: horario «{row['schedule']}» ≠ «{backend.schedule}»")
            if not row["keywords"] and backend.keywords:
                row["keywords"] = list(backend.keywords)
                report.completed.append(f"{row['id']}: palabras clave desde places.py")
            elif backend.keywords and set(map(normalize, row["keywords"])) != set(map(normalize, backend.keywords)):
                report.differences.append(f"{row['id']}: palabras clave distintas")
        if not row["description"]:
            texts = [d.text for d in documents if d.place_id in place_ids]
            if texts:
                row["description"] = "\n\n".join(texts)
                report.completed.append(f"{row['id']}: descripción desde el corpus")

    report.only_in_backend = sorted(set(by_id) - matched)
    report.exported = len(rows)

    seed = {"schema": SCHEMA, "categories": categories, "places": rows}
    return seed, id_map, report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Exporta places.json y place_id_map.json.")
    parser.add_argument("--raw", required=True, help="JSON de web/scripts/dump-places.mjs")
    parser.add_argument("--out", default=str(DEFAULT_SEED_PATH))
    parser.add_argument("--map-out", default=str(DEFAULT_MAP_PATH))
    args = parser.parse_args(argv)

    raw = json.loads(Path(args.raw).read_text(encoding="utf-8"))
    seed, id_map, report = build_seed(raw)
    Path(args.out).write_text(json.dumps(seed, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    Path(args.map_out).write_text(json.dumps(id_map, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("\n".join(report.lines()))
    return 0


if __name__ == "__main__":
    sys.exit(main())
