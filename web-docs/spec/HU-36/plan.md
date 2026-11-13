# HU-36 · Plan técnico

- **Spec:** [spec.md](spec.md) · **Estado:** Aprobado

## 1. Enfoque
Una consulta SQL en `Database.search_places`, un endpoint público y un hook en la web que pone encima de la búsqueda local la del servidor. El plan completo aprobado está en el plan de sesión; aquí queda lo esencial.

## 2. Backend
- **Migración** `V5__place_search.sql`: extensiones `pg_trgm` y `unaccent` y `immutable_unaccent(text)` (envoltorio inmutable). Sin índices.
- **Consulta**: texto normalizado `lower(immutable_unaccent(...))` de nombre, `short_name` y palabras clave. Nivel 0 sigla/palabra clave exacta; 1 nombre empieza; 2 nombre contiene; 3 palabra clave contiene; 4 `word_similarity(q, nombre) >= 0.3` o `similarity` con sigla/palabras clave. Orden por nivel, similitud descendente y nombre. `limit` por defecto 8.
- **Endpoint** en `app/api/places.py`, declarado **antes** de `/places/{place_id}`. Reutiliza `cached_json`, `PlaceOut` y `get_places_store`; el protocolo `PlacesStore` gana `search_places`.
- `FakeDatabase.search_places` replica los niveles 0–3 y un parecido simple.

## 3. Web
- `apiClient.get` acepta `signal`; `searchPlacesApi(query, signal)` reutiliza `toPlace`.
- El hook es `features/map/hooks/usePlaceSearch.ts` (local inmediato, 200 ms de pausa, `AbortController`, ignora respuestas viejas, error → local).
- `PlaceCombobox` usa el hook en lugar de `useMemo(() => searchPlaces(...))`.

## 4. Pruebas
| Requisito | Test |
|---|---|
| RF-36.1 a 36.12 | `tests/test_places_api.py` (base falsa) y `tests/integration/test_places_api.py` (Postgres real: «bibliotca», tildes, sigla primero, despublicado, límite, 304, 503) |
| RF-36.13 a 36.17 | `usePlaceSearch.test.ts` |
| RF-36.18 | `PlaceCombobox.test.tsx` existente (sin cambios de comportamiento) |

## 5. Riesgos
- `pg_trgm` y `unaccent` vienen en la imagen `pgvector/pgvector:pg16` (contrib de Postgres); se comprueba al aplicar V5.
- Una petición por búsqueda (con pausa): aceptado; el respaldo local cubre la latencia y la falta de conexión.
