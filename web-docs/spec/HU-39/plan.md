# HU-39 · Plan técnico

- **Spec:** [spec.md](spec.md) · **Estado:** Aprobado

## Base de datos (`V7__category_numeric_id.sql`)
Igual que V6: agrega `slug` (= id anterior), calcula el id nuevo (1..N por `sort_order, id`), recalcula `places.category_id`, reemplaza ambas columnas y restaura clave primaria, `slug` único con formato, clave foránea e índice, más la secuencia `place_categories_id_seq`.

## Backend
- `Database`: `create_category(label, color, sort_order)` genera el slug con `pg_advisory_xact_lock`; ids `int`; `insert_place_categories` por `slug`; `insert_places` resuelve la categoría por `category_slug`.
- Semilla `places-seed/v3`; `PlaceCategoryCreate` desaparece (el cuerpo es `PlaceCategoryIn`).
- `?category` pasa a `int` en ambas APIs.

## Web
- `PlaceCategoryId = number`; `PlaceCategory.slug`; `AdminCategory.slug`; formulario sin campo de id; selectores (`Combobox`) adaptan texto↔número.
- Pruebas: `catId(slug)` en `test/fixtures/places.ts`.

## Pruebas
| Requisito | Test |
|---|---|
| RF-39.1, 39.2, 39.4 | `tests/integration/test_places_schema.py`, `test_places_seed.py`, `tests/test_places_seed.py` |
| RF-39.5 a 39.8 | `tests/test_places_admin_api.py`, `tests/integration/test_places_admin.py`, `tests/test_places_api.py`, `tests/integration/test_places_api.py` |
| RF-39.9, 39.10 | `AdminCategoriesPage.test.tsx`, `useAdminCategoriesStore.test.ts`, `placesApi.test.ts`, `adminPlacesApi.test.ts` |
