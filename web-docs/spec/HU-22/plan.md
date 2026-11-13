# HU-22 · Plan técnico

- **Spec:** [spec.md](spec.md)
- **Estado:** Ejecutado

## 1. Enfoque
Tres piezas independientes:
1. **Migración `V3`** con `place_categories` y `places`; las restricciones (rangos, slug, categoría, padre) viven en la base.
2. **Exportación única** (el volcado de `places.ts` en la máquina del equipo con Node; la exportación en el contenedor del backend): un script de Node vuelca `places.ts` a un JSON crudo, y un módulo de Python lo une con `places.py` y el corpus, fusiona duplicados, asigna slugs y escribe `backend/db/seed/places.json` y `place_id_map.json`. Ambos se versionan.
3. **Carga** (`python -m app.places.seed`): lee solo `places.json`, valida todo antes de escribir e inserta en una transacción con `on conflict do nothing`. Se ejecuta en Docker con `./scripts/dev.sh seed-places`.

La separación hace que la carga no dependa de `places.ts`, `places.py` ni `corpus.py` (RF-22.6, escenario 7), y que estos se puedan borrar después.

## 2. Datos y tipos
**Tablas** (`V3__places.sql`)
- `place_categories(id text pk, label text not null, color text not null, sort_order int not null default 0)`. `color` con check `^#[0-9a-fA-F]{6}$`.
- `places`:
  - `id text pk` con check `^[a-z0-9]+(-[a-z0-9]+)*$`; `name text not null` (check `<> ''`); `short_name text`.
  - `category_id text not null references place_categories(id)`.
  - `lat double precision not null check (lat between -90 and 90)`, `lng … check (lng between -180 and 180)`.
  - `keywords`, `detailed_schedule`, `careers`, `services`: `text[] not null default '{}'`.
  - `description`, `schedule`, `phone`, `annex`, `email`, `website`, `access_hint`, `usage`, `image_url`: `text` nulo.
  - `parent_place_id text references places(id)` con check `parent_place_id <> id`.
  - `is_published boolean not null default true`, `verified_at timestamptz`, `created_at`/`updated_at timestamptz not null default now()`, `updated_by text`.
- Índices: `places(category_id)` y `places(is_published)`.
- `updated_at` no usa trigger: lo fijará el CRUD de HU-30.

**Semilla** (`backend/db/seed/places.json`)
```json
{ "schema": "ondesanmarcos.places-seed/v1",
  "categories": [{"id","label","color","sort_order"}],
  "places": [{"id","name","category_id","lat","lng","keywords":[], ...resto de columnas editables}] }
```
`place_id_map.json`: `{ "<id antiguo>": "<slug>" }`, con los 55 ids de la web.

**Tipos Python** (`app/places/seed.py`): `SeedError` (con el lugar y el motivo), `load_seed(path) -> Seed`, `validate_seed(seed)`, `apply_seed(db, seed) -> SeedResult(inserted, existing)`.

## 3. Archivos
| Ruta | Qué hace | Cubre |
|---|---|---|
| `backend/db/migrations/V3__places.sql` | Tablas, restricciones e índices | RF-22.1 a RF-22.4 |
| `web/scripts/dump-places.mjs` | Importa `places.ts` (Node con eliminación de tipos) y escribe `{categories, places}` crudo a stdout | RF-22.6 |
| `backend/app/tools/places/export_seed.py` | Une el crudo con `places.py` y el corpus; fusiona duplicados; asigna slugs; escribe `places.json` y `place_id_map.json`; imprime el resumen | RF-22.6 a RF-22.10, RF-22.14 |
| `backend/app/tools/places/slugs.py` | `slugify`, `derive_slug` (sigla entre paréntesis o nombre; sufijo numérico en colisión) | RF-22.7 |
| `backend/db/seed/places.json` | Semilla versionada (salida de la exportación) | RF-22.5, RF-22.6, RF-22.11 |
| `backend/db/seed/place_id_map.json` | Equivalencias de ids | RF-22.8, RF-22.9 |
| `backend/app/places/__init__.py`, `seed.py` | Lectura, validación y carga idempotente; `main()` de la CLI | RF-22.5, RF-22.6, RF-22.11 a RF-22.14, RF-22.16 |
| `backend/app/rag/db.py` | `insert_place_categories(rows)` y `insert_places(rows)` con `on conflict (id) do nothing` en una transacción; devuelven cuántas filas entraron | RF-22.12 |
| `backend/tests/fake_db.py` | Las mismas dos funciones en memoria | RF-22.12 |
| `script/dev.sh` | Comando `seed-places` | RF-22.15 |
| `backend/README.md` | Tablas, flujo de exportación, comando y reinicio de datos | RF-22.15 |

## 4. Flujo y comunicación
- **Exportación (manual, una vez):** `node web/scripts/dump-places.mjs > backend/db/seed/_places_raw.json` → `docker compose run --rm --no-deps backend python -m app.tools.places.export_seed --raw db/seed/_places_raw.json` (importa `app.places.seed`, que necesita `psycopg`, por eso corre en el contenedor). El crudo se borra después y no se versiona.
- **Reglas de la exportación:**
  1. Base: `places.ts`. Los ids con slug se reservan primero.
  2. Fusión por nombre normalizado (`app.knowledge.places.normalize`): gana el registro con más campos no vacíos; los ids perdedores se anotan en el mapa.
  3. Completar solo campos vacíos: horario y palabras clave desde `places.py` (por slug o nombre); descripción desde el documento del corpus con ese `place_id` (si hay varios, se concatenan en orden).
  4. `[lng, lat]` → `lat`, `lng`; textos vacíos → nulo; `verified_at` no se escribe (nulo).
- **Carga:** `get_settings()` → `get_database()` → `load_seed` → `validate_seed` → `apply_seed`. Si falta `DATABASE_URL` o la base no responde, `RagProviderError` se atrapa en `main()` y sale con código 1 y un mensaje de una línea.

## 5. Decisiones
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Node para leer `places.ts` | Parsearlo con expresiones regulares desde Python | El archivo es TypeScript válido; Node lo importa tal cual y no se rompe con comas o comillas. La exportación se corre una sola vez. |
| JSON semilla versionado | Leer `places.ts` en cada carga | Permite borrar `places.ts`, `places.py` y el corpus sin romper la carga (spec, pregunta resuelta). |
| `on conflict (id) do nothing` | `do update` | Preserva las ediciones hechas desde el panel (RF-22.12). Quien quiera rehacer los datos usa `db-reset` o borra filas. |
| Validar todo antes de escribir, más transacción | Validar fila a fila al insertar | Cumple RF-22.13 (todo o nada) y da mensajes que nombran el lugar. |
| Restricciones en la base y en Python | Solo en Python | Las usarán también la API y el CRUD de HU-30; la base es la última barrera (RF-22.3). |
| `id` slug como clave primaria | `bigint identity` + slug único | La app y los `place_id` del RAG ya usan slug; evita una tabla de traducción en cada consulta. |
| Categorías en tabla | Enum de Postgres | El administrador podrá crear categorías (HU-30) sin migración. |
| Vacío = lista vacía o nulo | Cadena vacía | Una sola representación de «sin dato» (RF-22.4). |
| Comando `seed-places` aparte de `ingest` | Sembrar dentro de `ingest` | `ingest` gasta cuota de Gemini y reemplaza `documents`; los lugares no. |

## 6. Estrategia de pruebas
| Requisito | Test |
|---|---|
| RF-22.1, 22.2 | `tests/integration/test_places_schema.py` › «RF-22.1: existen las columnas de place_categories», «RF-22.2: places tiene todas las columnas y sus tipos» |
| RF-22.3 | › «RF-22.3: rechaza latitud o longitud fuera de rango, id no slug, categoría inexistente y padre igual a sí mismo» |
| RF-22.4 | › «RF-22.4: las listas no aceptan nulos y valen vacío por defecto»; `tests/test_places_seed.py` › «RF-22.4: textos vacíos se guardan como nulo» |
| RF-22.5, 22.6, 22.11 | `tests/integration/test_places_seed.py` › «RF-22.5: carga las 9 categorías», «RF-22.6: carga todos los lugares de la semilla real con lat/lng», «RF-22.11: verified_at queda vacío» |
| RF-22.7 | `tests/test_places_export.py` › «RF-22.7: conserva los slugs y deriva el resto sin colisiones» · `tests/test_places_seed.py` › «RF-22.7: todos los ids de la semilla son slugs únicos» |
| RF-22.8, 22.9 | `tests/test_places_export.py` › «RF-22.8: el mapa cubre todos los ids de la web», «RF-22.9: fusiona las dos Ingeniería Industrial y conserva el registro con más datos» |
| RF-22.10 | › «RF-22.10: completa horario, palabras clave y descripción solo si faltan», «no reemplaza valores de la web» |
| RF-22.12 | `tests/integration/test_places_seed.py` › «RF-22.12: correrla dos veces no duplica ni pisa un horario editado» · `tests/test_places_seed.py` con `FakeDatabase` |
| RF-22.13 | `tests/test_places_seed.py` › «RF-22.13: un lugar inválido cancela todo y nombra el lugar» (sin llamadas a la base) |
| RF-22.14 | `tests/test_places_export.py` › «RF-22.14: el resumen lista fusionados y completados» · `tests/test_places_seed.py` › «el resultado informa insertados y existentes» |
| RF-22.15 | `tests/test_dev_script.py` › «RF-22.15: existe el comando seed-places»; README revisado a mano |
| RF-22.16 | `tests/test_places_seed.py` › «RF-22.16: sin DATABASE_URL o con la base caída sale con código 1 y un mensaje» |
| Escenario 7 | `tests/test_places_seed.py` › prueba que `seed.py` no importa `app.knowledge` (revisa los imports del módulo) |

A mano: correr la exportación real una vez y revisar el resumen (fusiones, campos completados, diferencias); correr `./scripts/dev.sh seed-places` contra la base de desarrollo y consultar la ficha de la FISI con `./scripts/dev.sh psql`.

## 7. Riesgos y dependencias
- **Node con eliminación de tipos:** `places.ts` usa `import type`, que Node 24 acepta; si la versión local es menor, se pasa `--experimental-strip-types`. Alternativa de respaldo: copiar el arreglo a un `.mjs` temporal.
- **Coincidencia por nombre:** `places.py` puede llamar distinto a un lugar y no completarse. El resumen lo muestra; se resuelve a mano en el JSON.
- **Slugs derivados:** quedan fijos al exportar. Cambiar uno después rompe referencias; por eso se versiona el mapa.
- **`documents.metadata.place_id`:** ya usa slugs de `places.py`; los slugs de la web que coinciden se conservan, así que no se rompe nada. La relación formal con `places` llega en HU-29.
- La carga requiere las migraciones aplicadas (servicio `migrate` de HU-23).

## 8. Historial
- 2026-11-12 · Plan creado.
- 2026-11-12 · Ejecutado. Cambio respecto al plan: la exportación corre en Docker (no en el equipo) porque importa `psycopg` a través de `app.places.seed`.
