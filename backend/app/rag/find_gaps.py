"""Detecta lugares del mapa sin descripción en el corpus y redacta borradores.

Compara los lugares que el mapa conoce (`frontend/.../unmsm.ts` → `CAMPUS_PLACES`)
contra los `place_id` que ya existen en el corpus de Supabase. Para cada lugar
"faltante" (en el mapa pero no en el corpus), redacta con Gemini una ficha
descriptiva **anclada a los datos reales** del propio `unmsm.ts` (nombre,
descripción, horario, teléfono, carreras, servicios…): Gemini **formatea/resume**
hechos provistos, no inventa. El resultado se escribe como borrador para revisión
humana; **no** sube nada a Supabase (de eso se encarga `upload_entries`).

Uso:
    python -m app.rag.find_gaps --detect-only     # solo lista los gaps (sin Gemini)
    python -m app.rag.find_gaps                    # genera borradores -> gaps_review.json
    python -m app.rag.find_gaps --limit 5          # genera solo los primeros 5 (cuota)

Requiere `.env` con LLM_PROVIDER=gemini, LLM_API_KEY, SUPABASE_URL,
SUPABASE_SERVICE_KEY, y las deps de `requirements-llm.txt`/`requirements-pgvector.txt`.
"""

from __future__ import annotations

import argparse
import sys

from app.config import Settings, get_settings
from app.knowledge.entries import (
    DEFAULT_REVIEW_FILE,
    SCHEMA,
    STATUS_DRAFT,
    save_entries_file,
)
from app.knowledge.unmsm_ts import DEFAULT_UNMSM_TS, MapPlace, load_map_places

_GEN_SYSTEM = (
    "Eres editor de la base de conocimiento oficial del asistente de la "
    "Universidad Nacional Mayor de San Marcos (UNMSM). Redacta UNA ficha "
    "descriptiva de un lugar del campus, en español, en texto corrido (sin "
    "listas ni markdown), clara y concisa (2 a 5 frases). Usa ÚNICAMENTE los "
    "datos proporcionados; NO inventes horarios, teléfonos, servicios ni datos "
    "que no aparezcan. Si hay pocos datos, describe solo lo que hay. Empieza "
    "nombrando el lugar."
)


# --------------------------------------------------------------------------- #
# Lógica pura (testeable sin red).
# --------------------------------------------------------------------------- #
def gap_places(
    map_places: list[MapPlace], corpus_place_ids: set[str]
) -> list[MapPlace]:
    """Lugares del mapa cuyo `id` no está en el corpus, sin duplicar ids."""
    gaps: list[MapPlace] = []
    seen: set[str] = set()
    for place in map_places:
        if place.id and place.id not in corpus_place_ids and place.id not in seen:
            gaps.append(place)
            seen.add(place.id)
    return gaps


def grounding_level(place: MapPlace) -> str:
    """`high` si hay datos ricos para anclar; `low` si es casi solo nombre."""
    rich = (
        place.has_description
        or place.careers
        or place.services
        or bool(place.usage.strip())
        or bool(place.detailed_schedule)
    )
    return "high" if rich else "low"


def build_generation_prompt(place: MapPlace) -> str:
    """Arma el mensaje con los hechos reales del lugar para redactar la ficha."""
    facts: list[str] = [f"Nombre: {place.name}"]
    if place.description:
        facts.append(f"Descripción: {place.description}")
    if place.usage:
        facts.append(f"Uso: {place.usage}")
    if place.schedule:
        facts.append(f"Horario: {place.schedule}")
    if place.detailed_schedule:
        facts.append("Horario detallado: " + "; ".join(place.detailed_schedule))
    if place.phone:
        facts.append(f"Teléfono: {place.phone}")
    if place.annex:
        facts.append(f"Anexo: {place.annex}")
    if place.careers:
        facts.append("Carreras: " + ", ".join(place.careers))
    if place.services:
        facts.append("Servicios: " + ", ".join(place.services))
    if place.keywords:
        facts.append("Palabras clave: " + ", ".join(place.keywords))
    datos = "\n".join(f"- {fact}" for fact in facts)
    return (
        "Datos del lugar (úsalos como única fuente):\n"
        f"{datos}\n\n"
        "Redacta la ficha descriptiva del lugar."
    )


def build_entry(place: MapPlace, text: str, model: str) -> dict:
    """Construye la entrada JSON (borrador) para revisión y posterior subida."""
    return {
        "place_id": place.id,
        "status": STATUS_DRAFT,
        "grounding": grounding_level(place),
        "review_note": "UNVERIFIED — revisar veracidad antes de aprobar.",
        "model": model,
        "document": {
            "id": f"doc-{place.id}",
            "title": place.name or place.id,
            "place_id": place.id,
            "text": text,
        },
        "source_fields": {
            "name": place.name,
            "schedule": place.schedule,
            "detailed_schedule": list(place.detailed_schedule),
            "description": place.description,
            "phone": place.phone,
            "annex": place.annex,
            "usage": place.usage,
            "careers": list(place.careers),
            "services": list(place.services),
            "keywords": list(place.keywords),
        },
    }


# --------------------------------------------------------------------------- #
# Acceso a servicios (red).
# --------------------------------------------------------------------------- #
def _supabase_client(settings: Settings):
    if not (settings.supabase_url and settings.supabase_service_key):
        raise SystemExit("Faltan SUPABASE_URL / SUPABASE_SERVICE_KEY en el .env.")
    try:
        from supabase import create_client
    except ImportError as exc:  # pragma: no cover
        raise SystemExit(
            "Falta el paquete 'supabase'. Instala requirements-pgvector.txt."
        ) from exc
    return create_client(settings.supabase_url, settings.supabase_service_key)


def fetch_corpus_place_ids(client, table: str) -> set[str]:
    """`place_id` distintos presentes hoy en el corpus de Supabase."""
    response = client.table(table).select("metadata").execute()
    ids: set[str] = set()
    for row in response.data or []:
        place_id = (row.get("metadata") or {}).get("place_id")
        if place_id:
            ids.add(place_id)
    return ids


def _gemini_client(settings: Settings):
    if settings.llm_provider.strip().lower() != "gemini" or not settings.llm_api_key:
        raise SystemExit("Se requiere LLM_PROVIDER=gemini y LLM_API_KEY en el .env.")
    try:
        from google import genai
    except ImportError as exc:  # pragma: no cover
        raise SystemExit(
            "Falta el paquete 'google-genai'. Instala requirements-llm.txt."
        ) from exc
    return genai.Client(api_key=settings.llm_api_key)


def generate_description(client, model: str, place: MapPlace) -> str:
    """Redacta la ficha del lugar con Gemini, anclada a sus datos."""
    from google.genai import types

    response = client.models.generate_content(
        model=model,
        contents=build_generation_prompt(place),
        config=types.GenerateContentConfig(
            system_instruction=_GEN_SYSTEM,
            temperature=0.2,
            max_output_tokens=400,
        ),
    )
    return (response.text or "").strip()


# --------------------------------------------------------------------------- #
# CLI.
# --------------------------------------------------------------------------- #
def main(argv: list[str] | None = None) -> int:
    try:  # consola Windows: fuerza UTF-8 para no garabatear acentos/·
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:  # pragma: no cover
        pass

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--detect-only",
        action="store_true",
        help="Solo lista los gaps; no llama a Gemini ni escribe archivo.",
    )
    parser.add_argument(
        "--limit", type=int, default=0, help="Genera solo los primeros N gaps (0 = todos)."
    )
    parser.add_argument(
        "--unmsm", default=str(DEFAULT_UNMSM_TS), help="Ruta a unmsm.ts."
    )
    parser.add_argument(
        "--out", default=str(DEFAULT_REVIEW_FILE), help="Archivo de salida (JSON)."
    )
    args = parser.parse_args(argv)

    settings = get_settings()
    map_places = load_map_places(args.unmsm)
    client = _supabase_client(settings)
    corpus_ids = fetch_corpus_place_ids(client, settings.pgvector_table)
    gaps = gap_places(map_places, corpus_ids)

    print(
        f"Mapa: {len(map_places)} lugares · Corpus (Supabase): {len(corpus_ids)} "
        f"con descripción · Gaps: {len(gaps)}"
    )
    for place in gaps:
        print(f"  - {place.id:<28} [{grounding_level(place)}]  {place.name}")

    if args.detect_only or not gaps:
        return 0

    model = settings.llm_model or "gemini-2.5-flash"
    gemini = _gemini_client(settings)
    targets = gaps[: args.limit] if args.limit > 0 else gaps

    entries: list[dict] = []
    print(f"\nGenerando borradores con {model} (Gemini)…")
    for place in targets:
        try:
            text = generate_description(gemini, model, place)
        except Exception as exc:  # cuota (429) u otro error de red
            print(f"  ! {place.id}: generación detenida ({type(exc).__name__}: {exc}).")
            print("    Guardo lo generado hasta ahora; reintenta luego para el resto.")
            break
        if not text:
            print(f"  ! {place.id}: respuesta vacía, se omite.")
            continue
        entries.append(build_entry(place, text, model))
        print(f"  ✓ {place.id} ({grounding_level(place)})")

    data = {
        "schema": SCHEMA,
        "source": "frontend/src/features/map/constants/unmsm.ts",
        "model": model,
        "note": (
            "Borradores generados por Gemini y anclados a unmsm.ts. Revisar la "
            "veracidad y ajustar 'status' a 'approved' antes de subir con "
            "upload_entries."
        ),
        "entries": entries,
    }
    save_entries_file(args.out, data)
    print(f"\nEscritos {len(entries)} borradores en {args.out}")
    print("Revisa el archivo; marca cada entrada como 'approved' para subirla.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
