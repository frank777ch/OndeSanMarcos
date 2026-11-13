# HU-27 · Plan técnico

- **Spec:** [spec.md](spec.md)
- **Estado:** Ejecutado

## 1. Enfoque
Un router `app/api/places.py` con los tres endpoints, que leen de `Database` (tres métodos nuevos, una consulta cada uno) y devuelven modelos pydantic. La caché (`Cache-Control` + `ETag` + 304) vive en un helper reutilizable, `app/api/caching.py`, porque los eventos (HU-32) lo necesitarán igual. La base se inyecta con una dependencia propia para reemplazarla en los tests, como hace `get_store` en la autenticación.

## 2. Datos y tipos
- **Esquemas** (`app/schemas/places.py`):
  - `PlaceCategoryOut(id, label, color)`.
  - `PlaceOut` con los campos de RF-27.2 y `Field(description=…)` en cada uno (RF-27.15). Listas con `default_factory=list`; textos opcionales `str | None`. `verified_at` y `updated_at` como `datetime`. No existen `created_at` ni `updated_by` en el modelo, así que no pueden filtrarse (RF-27.3).
- **Consultas** (`Database`):
  - `list_place_categories() -> list[dict]`: `select id, label, color from place_categories order by sort_order, id`.
  - `list_places(category_id: str | None) -> list[dict]`: `select <columnas públicas> from places where is_published and (%s::text is null or category_id = %s) order by name, id`.
  - `get_place(place_id) -> dict | None`: mismas columnas, `where id = %s and is_published`.
  - Columnas públicas en una constante `PUBLIC_PLACE_COLUMNS` (sin `created_at` ni `updated_by`).
- **Caché:** `ETag` = `"` + SHA-256 (hex, 32 primeros caracteres) del cuerpo JSON serializado + `"`. Cuerpo serializado una sola vez con `TypeAdapter(...).dump_json`, para que el `ETag` y la respuesta coincidan byte a byte.

## 3. Archivos
| Ruta | Qué hace | Cubre |
|---|---|---|
| `backend/app/schemas/places.py` | `PlaceCategoryOut` y `PlaceOut` documentados | RF-27.1 a RF-27.4, RF-27.15 |
| `backend/app/rag/db.py` | `list_place_categories`, `list_places`, `get_place` y `PUBLIC_PLACE_COLUMNS` | RF-27.1 a RF-27.8, RF-27.14 |
| `backend/app/api/caching.py` | `cached_json(request, adapter, data)`: serializa, calcula el `ETag`, responde 304 o 200 con `Cache-Control: public, max-age=60` | RF-27.10, RF-27.11 |
| `backend/app/api/places.py` | Router `/api` con los tres endpoints, `get_places_store`, validación del slug y 404 uniforme | RF-27.1 a RF-27.9, RF-27.12, RF-27.15 |
| `backend/app/main.py` | `include_router(places_router)` | RF-27.9 |
| `backend/tests/fake_db.py` | `list_place_categories`, `list_places`, `get_place` en memoria | RF-27.* (tests unitarios) |
| `backend/tests/test_places_api.py` | Pruebas de la API con `TestClient` y base falsa | RF-27.1 a RF-27.13, RF-27.15 |
| `backend/tests/integration/test_places_api.py` | Pruebas contra Postgres con la semilla real | RF-27.2, RF-27.4, RF-27.8, RF-27.14, escenarios 1 a 6 |
| `backend/README.md` | Endpoints, campos y política de caché | RF-27.16 |

## 4. Flujo y comunicación
- **Lista:** `GET /api/places?category=` → `store.list_places(category)` → `PlaceOut` → `cached_json`. `category` es un `Query` opcional de hasta 64 caracteres; un valor desconocido no se valida contra la tabla (devuelve vacío, RF-27.5).
- **Detalle:** si `id` no cumple el patrón de slug (`^[a-z0-9]+(-[a-z0-9]+)*$`, ≤ 100 caracteres) se responde 404 sin tocar la base; si no, `get_place`; `None` → el mismo 404 «Lugar no encontrado.» (RF-27.7).
- **Categorías:** análogo a la lista.
- **Sin autenticación:** los endpoints no declaran `Depends(get_current_admin)` ni leen `Authorization`, así que un token, válido o no, no cambia nada (RF-27.9).
- **Base caída:** `Database.connection` ya lanza `RagProviderError`, que `main.py` convierte en 503 (RF-27.13). Tablas vacías devuelven `[]` con 200 (RF-27.12).
- **`ETag` y `If-None-Match`:** se aceptan varios valores separados por comas, el prefijo débil `W/` y `*`.
- **Orden:** `order by name, id`; con el mismo `ETag` mientras los datos no cambien (RF-27.4, RF-27.11).

## 5. Decisiones
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| `Response` con cuerpo ya serializado y `response_model` solo para la documentación | Devolver el modelo y dejar que FastAPI serialice | Necesitamos los bytes exactos para el `ETag` y para responder 304 sin cuerpo. |
| `ETag` fuerte de contenido (hash del cuerpo) | `ETag` por `max(updated_at)` | `updated_at` no cambia al editar con SQL directo ni al despublicar; el hash no puede quedar desfasado. La lista es pequeña, hashear es barato. |
| Helper `caching.py` genérico | Código dentro de `places.py` | Se reutiliza en eventos (HU-32). |
| Una consulta por endpoint, sin joins | Una consulta por lugar o cargar categorías aparte | RF-27.14; la categoría viaja como `category_id` y las categorías se piden en su propio endpoint. |
| Lista de columnas públicas explícita | `select *` y quitar campos en Python | Un campo nuevo e interno (por ejemplo notas del admin) no se filtraría por error. |
| Slug inválido → 404 sin consultar | 422 de validación | Mismo mensaje que un lugar oculto; no revela nada (RF-27.7). |
| Dependencia propia `get_places_store` | Reusar `get_store` (tipado como `AdminLookup`) | Los tipos y las pruebas quedan separados; ambos devuelven la misma `Database`. |
| Sin paginación | `limit`/`offset` | Fuera de alcance de la spec; el arreglo simple no lo impide después. |

## 6. Estrategia de pruebas
| Requisito | Test |
|---|---|
| RF-27.1 | `tests/test_places_api.py` › «RF-27.1: categorías con id, label y color, ordenadas» |
| RF-27.2, 27.3 | › «RF-27.2: la lista trae todos los campos de la ficha», «RF-27.3: no expone created_at ni updated_by» |
| RF-27.4 | › «RF-27.4: orden por nombre, [] y null cuando no hay dato» · integración › «RF-27.4: el orden es estable entre llamadas» |
| RF-27.5 | › «RF-27.5: filtra por categoría», «categoría inexistente da 200 y lista vacía» |
| RF-27.6, 27.7 | › «RF-27.6: detalle de un lugar publicado», «RF-27.7: inexistente, no publicado y slug inválido dan el mismo 404» |
| RF-27.8 | › «RF-27.8: un lugar no publicado no sale en lista, filtro ni detalle» · integración con la base real |
| RF-27.9 | › «RF-27.9: responde igual sin token, con token válido y con token basura» |
| RF-27.10, 27.11 | › «RF-27.10: Cache-Control y ETag en los tres endpoints», «RF-27.11: If-None-Match vigente da 304 sin cuerpo», «con contenido distinto da 200 y otro ETag», «acepta lista de valores, W/ y *» |
| RF-27.12 | › «RF-27.12: tablas vacías dan 200 y lista vacía» |
| RF-27.13 | › «RF-27.13: base caída da 503 con mensaje» (los tres endpoints) |
| RF-27.14 | `tests/integration/test_places_api.py` › «RF-27.14: cada método de consulta ejecuta una sola sentencia» (se cuenta con un `Database.connection` espiado) |
| RF-27.15 | › «RF-27.15: el esquema OpenAPI incluye los tres endpoints bajo «places» con descripciones» |
| RF-27.16 | revisión manual del README |
| Escenarios 1 a 6 | `tests/integration/test_places_api.py` (semilla real de HU-22 + `TestClient` con la base de pruebas) |

A mano: `curl -i http://localhost:8000/api/places/fisi` y repetirlo con `-H 'If-None-Match: <etag>'`; abrir `/docs` (escenario 8); apagar la base y repetir una petición (escenario 7).

## 7. Riesgos y dependencias
- **Orden por nombre:** depende de la collation de la base (acentos). Es estable y suficiente; si el orden resulta raro con tildes, se reordena en Python con `normalize` sin cambiar el contrato.
- **Caché en el navegador y edición (HU-30):** hasta 60 s de dato anterior; es lo aprobado en la spec.
- **Tamaño de la respuesta:** ~54 fichas con descripción; se espera < 100 KB. La compresión gzip la puede añadir el proxy de despliegue (no es parte de esta historia).
- **Orden de rutas:** `GET /api/place-categories` y `GET /api/places/{id}` no colisionan por tener rutas distintas.
- Requiere que HU-22 haya cargado datos (`seed-places`).

## 8. Historial
- 2026-11-12 · Plan creado.
- 2026-11-12 · Ejecutado. Cambio respecto al plan: `cached_json` valida los datos con el `TypeAdapter` antes de serializar (así acepta filas `dict` sin avisos de pydantic y descarta campos no declarados, una barrera más para RF-27.3).
