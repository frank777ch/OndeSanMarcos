"""`fetch_places` — consulta la Places API (New) y vuelca el JSON crudo.

Uso (requiere clave; NO se hardcodea):

    export GOOGLE_MAPS_API_KEY="AIza..."
    cd backend
    python -m app.tools.maps.fetch_places \
        --query "facultades UNMSM" --query "biblioteca UNMSM" \
        --out app/tools/maps/data/places_raw.json

Diseño: Text Search (`places:searchText`) con `locationRestriction.rectangle`
tomado de los `bounds` del campus, más paginación por `nextPageToken`. Se
combinan varias consultas de texto y se deduplican por `id` de Places. Sólo se
piden (FieldMask) los campos que luego mapea `build_unmsm_ts`.

ADVERTENCIA ToS: fuera del `place_id` (id), el contenido de Places no debe
persistirse más de ~30 días. El JSON crudo es caché temporal; regenéralo.

Este módulo hace la única llamada de red del paquete y por eso NO se cubre con
tests (la lógica pura testeable vive en `mapping` y en las funciones de armado
de payload de aquí abajo, que sí se pueden probar sin red).
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any

from app.tools.maps.mapping import CAMPUS_BOUNDS

SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"

# Campos a pedir. Cada campo tiene coste; pedimos sólo lo que mapeamos.
FIELD_MASK = ",".join(
    [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.location",
        "places.types",
        "places.primaryType",
        "places.nationalPhoneNumber",
        "places.internationalPhoneNumber",
        "places.regularOpeningHours",
        "places.editorialSummary",
        "nextPageToken",
    ]
)

# Consultas por defecto: cubren categorías típicas del recinto. El usuario puede
# pasar las suyas con --query (repetible) para afinar cobertura.
DEFAULT_QUERIES = [
    "facultades Universidad Nacional Mayor de San Marcos",
    "biblioteca UNMSM ciudad universitaria",
    "comedor universitario UNMSM",
    "oficinas administrativas UNMSM",
    "servicios UNMSM ciudad universitaria",
]

_DEFAULT_OUT = Path(__file__).resolve().parent / "data" / "places_raw.json"


def build_search_payload(query: str, page_token: str | None = None) -> dict[str, Any]:
    """Cuerpo JSON para `places:searchText` restringido al rectángulo del campus."""
    payload: dict[str, Any] = {
        "textQuery": query,
        "languageCode": "es",
        "locationRestriction": {
            "rectangle": {
                "low": {
                    "latitude": CAMPUS_BOUNDS["sw"]["latitude"],
                    "longitude": CAMPUS_BOUNDS["sw"]["longitude"],
                },
                "high": {
                    "latitude": CAMPUS_BOUNDS["ne"]["latitude"],
                    "longitude": CAMPUS_BOUNDS["ne"]["longitude"],
                },
            }
        },
    }
    if page_token:
        payload["pageToken"] = page_token
    return payload


def dedupe_by_id(places: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Elimina duplicados por `id` de Places conservando el primer avistamiento."""
    seen: set[str] = set()
    unique: list[dict[str, Any]] = []
    for place in places:
        pid = place.get("id")
        key = pid if isinstance(pid, str) and pid else json.dumps(place, sort_keys=True)
        if key in seen:
            continue
        seen.add(key)
        unique.append(place)
    return unique


def _require_api_key(cli_key: str | None) -> str:
    key = cli_key or os.environ.get("GOOGLE_MAPS_API_KEY", "")
    if not key.strip():
        sys.exit(
            "ERROR: falta la clave de Google Maps.\n"
            "Define la variable de entorno GOOGLE_MAPS_API_KEY (o pasa --api-key):\n"
            '    export GOOGLE_MAPS_API_KEY="AIza..."'
        )
    return key.strip()


def fetch_query(client: Any, api_key: str, query: str) -> list[dict[str, Any]]:
    """Ejecuta una consulta de texto y devuelve todos sus lugares (paginando)."""
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": FIELD_MASK,
    }
    collected: list[dict[str, Any]] = []
    page_token: str | None = None
    while True:
        payload = build_search_payload(query, page_token)
        response = client.post(SEARCH_URL, headers=headers, json=payload, timeout=30.0)
        response.raise_for_status()
        data = response.json()
        collected.extend(data.get("places", []) or [])
        page_token = data.get("nextPageToken")
        if not page_token:
            break
    return collected


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="fetch_places",
        description="Consulta la Google Places API (New) y vuelca el JSON crudo.",
    )
    parser.add_argument(
        "--query",
        action="append",
        dest="queries",
        metavar="TEXT",
        help="Consulta de texto (repetible). Por defecto, un set de categorías.",
    )
    parser.add_argument(
        "--api-key",
        default=None,
        help="Clave de API (por defecto usa la env var GOOGLE_MAPS_API_KEY).",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=_DEFAULT_OUT,
        help=f"Ruta del JSON de salida (por defecto {_DEFAULT_OUT}).",
    )
    args = parser.parse_args(argv)

    api_key = _require_api_key(args.api_key)
    queries = args.queries or DEFAULT_QUERIES

    try:
        import httpx
    except ImportError:  # pragma: no cover - httpx está en el venv.
        sys.exit("ERROR: falta 'httpx'. Instálalo: pip install httpx")

    all_places: list[dict[str, Any]] = []
    with httpx.Client() as client:
        for query in queries:
            print(f"[fetch_places] consultando: {query!r}")
            places = fetch_query(client, api_key, query)
            print(f"  -> {len(places)} lugares")
            all_places.extend(places)

    unique = dedupe_by_id(all_places)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(
        json.dumps({"places": unique}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(
        f"[fetch_places] {len(unique)} lugares únicos escritos en {args.out} "
        f"(de {len(all_places)} brutos). Recuerda el ToS: caché <= ~30 días."
    )
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
