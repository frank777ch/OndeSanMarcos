"""`build_unmsm_ts` — mapea el JSON crudo de Places al TS del frontend.

Uso:

    cd backend
    python -m app.tools.maps.build_unmsm_ts \
        --raw app/tools/maps/data/places_raw.json \
        --out ../frontend/src/features/map/constants/unmsm.generated.ts

Por seguridad, el destino por defecto es `unmsm.generated.ts` (SEPARADO del
`unmsm.ts` curado, que es la fuente de verdad). El archivo generado es para
revisión/diff humano. Ver README para las advertencias (ToS, centroide, cobertura).
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.tools.maps.mapping import map_raw_places, render_ts

# build_unmsm_ts.py -> parents[4] = raíz del monorepo.
_REPO_ROOT = Path(__file__).resolve().parents[4]
_DEFAULT_RAW = Path(__file__).resolve().parent / "data" / "places_raw.json"
_DEFAULT_OUT = (
    _REPO_ROOT
    / "frontend"
    / "src"
    / "features"
    / "map"
    / "constants"
    / "unmsm.generated.ts"
)
# Nombre del curado: nunca debe sobrescribirse.
_CURATED = "unmsm.ts"


def _load_raw(path: Path) -> list[dict[str, Any]]:
    """Carga la lista de lugares del JSON crudo (acepta `{places: [...]}` o `[...]`)."""
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        places = data.get("places", [])
    else:
        places = data
    if not isinstance(places, list):
        sys.exit(f"ERROR: formato inesperado en {path}: se esperaba una lista de lugares.")
    return places


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="build_unmsm_ts",
        description="Genera un TS `CampusPlace[]` desde el JSON crudo de Places.",
    )
    parser.add_argument(
        "--raw",
        type=Path,
        default=_DEFAULT_RAW,
        help=f"JSON crudo de entrada (por defecto {_DEFAULT_RAW}).",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=_DEFAULT_OUT,
        help=f"TS de salida (por defecto {_DEFAULT_OUT.name}, NO el curado).",
    )
    parser.add_argument(
        "--no-bounds-filter",
        action="store_true",
        help="No descartar lugares que caigan fuera del rectángulo del campus.",
    )
    args = parser.parse_args(argv)

    # Salvaguarda: jamás pisar el dataset curado.
    if args.out.name == _CURATED:
        sys.exit(
            f"ERROR: negándome a sobrescribir el curado '{_CURATED}'. "
            "Usa otro --out (p. ej. unmsm.generated.ts)."
        )

    if not args.raw.exists():
        sys.exit(
            f"ERROR: no existe el JSON crudo {args.raw}. "
            "Ejecuta antes `python -m app.tools.maps.fetch_places`."
        )

    raw_places = _load_raw(args.raw)
    places = map_raw_places(raw_places, restrict_to_bounds=not args.no_bounds_filter)

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    ts_source = render_ts(places, timestamp=timestamp)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(ts_source, encoding="utf-8")
    print(
        f"[build_unmsm_ts] {len(places)} lugares -> {args.out}\n"
        "Revisa a mano: centroides != entradas peatonales, y respeta el ToS "
        "(no persistir contenido de Places > ~30 días)."
    )
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
