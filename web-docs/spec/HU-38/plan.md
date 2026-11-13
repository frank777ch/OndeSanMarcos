# HU-38 · Plan técnico

- **Spec:** [spec.md](spec.md) · **Estado:** Aprobado

## Base de datos (`V6__place_numeric_id.sql`)
Agrega `slug` (copia del id anterior), calcula el id numérico (los ya numéricos lo conservan; el resto 1..N por nombre) y el padre nuevo, reemplaza las columnas `id` y `parent_place_id`, y restaura la clave primaria, la clave foránea, `slug` único con su formato y `padre <> id`. La secuencia `places_id_seq` (V4) pasa a ser el valor por defecto de `id` y continúa tras el mayor existente.

## Backend
- `Database`: `slug` en las columnas públicas; `insert_places` por slug (`where not exists`, no `on conflict`, para no consumir ids); `create_place` genera el slug con un bloqueo `pg_advisory_xact_lock`; ids `int`.
- `app/places/text.py`: `slugify` y `parse_place_id`. Semilla `places-seed/v2` (`slug`, `parent_slug`).
- Esquemas y rutas con id entero; la búsqueda del administrador también mira id y slug.

## Web
- `Place.id: number` y `slug`; `usePlacesStore.bySlug`; `AssistantMessage`/`PlaceLinkCard` resuelven el slug del asistente; el selector de lugar contenedor usa el id; la tabla muestra `#id`.
- Pruebas: fixtures con `idOf(slug)` y `adminId(slug)`.

## Pruebas
| Requisito | Test |
|---|---|
| RF-38.1 a 38.4 | `tests/integration/test_places_schema.py`, `test_places_seed.py`, `tests/test_places_seed.py` |
| RF-38.5 a 38.9 | `tests/test_places_admin_api.py`, `tests/integration/test_places_admin.py`, `tests/test_places_api.py` |
| RF-38.10 a 38.12 | pruebas de la web que usan `idOf`/`adminId`, `PlaceLinkCard.test.tsx`, `usePlacesStore.test.ts` |
