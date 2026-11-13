# HU-30 · Plan técnico

- **Spec:** [spec.md](spec.md)
- **Estado:** Aprobado

## 1. Enfoque
Tres capas, como el resto del backend:
1. **Base** (`Database`, SQL directo): métodos de administración para lugares y categorías. Cada escritura es una sentencia o una transacción corta, y el SQL hace lo delicado: el id con `nextval`, `verified_at` con `coalesce`, el recuento de lugares por categoría y la comprobación de ciclos con una consulta recursiva.
2. **Reglas** (`app/places/`): esquemas pydantic de entrada con la validación de campos, un servicio que une esas reglas con las comprobaciones que dependen de la base (categoría y padre existentes, ciclos) y devuelve errores 422 con el mismo formato que los de FastAPI, y un conector `PlaceSync` con el asistente.
3. **API** (`app/api/admin_places.py`): un router `/api/admin` con las dependencias de autenticación de HU-25 y de la base, más un middleware que pone `Cache-Control: no-store` en todo `/api/admin`.

La sincronización con el asistente (RF-30.23 a RF-30.25) se aísla detrás de `PlaceSync`, porque depende de HU-29, que aún no está hecha y cuyo orden quedó pendiente. Hasta que exista, la implementación por defecto devuelve `"skipped"`; cuando exista, se conecta en un solo punto (`app/places/sync.py`) sin tocar la API.

## 2. Datos y tipos
**Migración** `V4__place_id_sequence.sql` (`n` = el siguiente número libre al implementar; hoy `V4`, o `V5` si HU-29 ya usó `V4`):
```sql
create sequence if not exists places_id_seq start 1000;
```
Los ids nuevos salen de `nextval('places_id_seq')::text` (`"1000"`, `"1001"`…). Cumple el patrón de slug de `places.id`. Empieza en 1000 para no confundirse con los ids numéricos antiguos de la web (`"1"`–`"40"`, que aparecen en `place_id_map.json`).

**Constante del área** (`app/places/area.py`): `CAMPUS_AREA = (lat -12.070 a -12.043, lng -77.096 a -77.069)`, que es el recuadro del campus de la web (`CAMPUS.bounds`) más su margen de 0,006° (`CAMPUS_MAX_BOUNDS`). Un comentario enlaza a `web/src/features/map/constants/campus.ts` para mantener ambos alineados.

**Esquemas** (`app/schemas/places_admin.py`, pydantic):
- `PlaceIn`: `model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)` (campos desconocidos y `id` → 422, RF-30.8, RF-30.15). Campos: `name`, `category_id`, `lat`, `lng` obligatorios; el resto de RF-30.7 con valores por defecto; `verified: bool = False`; `is_published: bool = True`. Validadores:
  - `name` 1–200; textos cortos ≤ 300 y `description` ≤ 5000; texto vacío → `None` (RF-30.14).
  - `lat`/`lng` dentro de `CAMPUS_AREA` (RF-30.13).
  - `email` con una expresión simple (`algo@algo.algo`, sin espacios); `website` e `image_url`: `urlparse` con esquema `http`/`https` y host no vacío.
  - listas: sin vacíos ni repetidos (en `keywords` sin distinguir mayúsculas, conservando la primera), ≤ 50 elementos de ≤ 200 caracteres.
- `PlaceAdminOut`: los campos de `PlaceOut` (HU-27) más `created_at` y `updated_by`. `PlaceSavedOut(PlaceAdminOut)` añade `rag_sync: Literal["ok","skipped","failed"]` (respuestas de crear, editar y reindexar).
- `PlaceCategoryIn` (`label` 1–100, `color` `#RRGGBB`, `sort_order` opcional ≥ 0; en la creación también `id` slug de ≤ 64) y `PlaceCategoryAdminOut` (`id`, `label`, `color`, `sort_order`, `places_count`).

**Base** (`Database`, nuevos métodos):
- `admin_list_places(category, published, verified) -> list[dict]` y `admin_get_place(id)`: columnas públicas más `created_at` y `updated_by`; sin filtrar por `is_published` salvo que se pida.
- `create_place(row, username) -> dict`: `insert … values (nextval('places_id_seq')::text, …) returning …` con `updated_by = username`, `verified_at = case when verified then now() end`.
- `update_place(id, row, username) -> dict | None`: `update … set <todos los campos editables>, verified_at = case when %(verified)s then coalesce(verified_at, now()) else null end, updated_at = now(), updated_by = %(user)s where id = %(id)s returning …`.
- `category_exists(id)`, `place_exists(id)` y `would_create_cycle(place_id, parent_id)` (CTE recursiva que sube por `parent_place_id` desde el padre propuesto buscando `place_id`).
- Categorías: `admin_list_categories()` (con `count(places)`), `create_category(row)` (`sort_order` por defecto `coalesce(max(sort_order) + 1, 0)`), `update_category(id, row)` y `delete_category(id) -> "deleted" | "not_found" | ("in_use", n)` con `delete … where not exists (…)` más una consulta de seguimiento para distinguir 404 de 409.
- Un `id` de categoría repetido (`UniqueViolation`) sube como `DuplicateError`.

**Filtro `q`:** se aplica en Python sobre la lista ya filtrada por SQL (son unas decenas de filas), con `normalize_text` (minúsculas y sin tildes, `unicodedata`) sobre `name`, `short_name`, `keywords` e `id`. Evita una extensión de Postgres (`unaccent`) y una dependencia de `app.knowledge`, que se retirará.

## 3. Archivos
| Ruta (bajo `backend/`) | Qué hace | Cubre |
|---|---|---|
| `db/migrations/V<n>__place_id_sequence.sql` | Secuencia `places_id_seq` | RF-30.8 |
| `app/places/area.py` | `CAMPUS_AREA` y `in_campus(lat, lng)` | RF-30.13 |
| `app/places/text.py` | `normalize_text` | RF-30.4 |
| `app/schemas/places_admin.py` | `PlaceIn`, `PlaceAdminOut`, `PlaceSavedOut`, `PlaceCategoryIn`, `PlaceCategoryAdminOut` con descripciones de campo | RF-30.7, RF-30.10, RF-30.13 a RF-30.15, RF-30.18 a RF-30.20, RF-30.29 |
| `app/rag/db.py` | Métodos de administración descritos arriba y `DuplicateError` | RF-30.3 a RF-30.6, RF-30.9 a RF-30.12, RF-30.16, RF-30.18 a RF-30.22, RF-30.27 |
| `app/places/service.py` | `create_place`, `update_place`, `delete_category`…: reglas que dependen de la base (categoría y padre existen, no hay ciclo), traducción a errores 422/404/409, y registro en el log | RF-30.6, RF-30.9, RF-30.13, RF-30.19 a RF-30.21, RF-30.30 |
| `app/places/sync.py` | `PlaceSync` (`sync(place_id) -> "ok"\|"skipped"\|"failed"`), implementación por defecto `"skipped"`, captura de excepciones y registro del fallo; `get_place_sync()` como dependencia | RF-30.23 a RF-30.25 |
| `app/api/admin_places.py` | Router `/api/admin` con los endpoints de lugares y categorías, `Depends(get_current_admin)`, `Location` en el 201, `rag_sync` en las respuestas | RF-30.1 a RF-30.12, RF-30.16 a RF-30.26, RF-30.28, RF-30.29 |
| `app/main.py` | `include_router` y middleware de `Cache-Control: no-store` para `/api/admin` | RF-30.2 |
| `tests/fake_places_admin.py` | Réplica en memoria de los métodos de administración (secuencia, `verified_at`, filtros, categorías) | pruebas unitarias |
| `tests/test_places_admin_schemas.py` | Validación de `PlaceIn` y `PlaceCategoryIn` | RF-30.8, RF-30.13 a RF-30.15, RF-30.19 |
| `tests/test_places_admin_api.py` | API con base falsa y token simulado | RF-30.1 a RF-30.30 |
| `tests/integration/test_places_admin.py` | API y base reales: secuencia, `verified_at`, ciclos, categorías con lugares, atomicidad | RF-30.6 a RF-30.12, RF-30.16 a RF-30.22, RF-30.27 |
| `README.md` | Endpoints de administración, campos, errores y `rag_sync` | RF-30.29 |

## 4. Flujo y comunicación
- **Crear:** `POST` → `PlaceIn` (422 de campos) → servicio comprueba categoría y padre (422 con el campo) → `Database.create_place` → `sync.sync(id)` → `201 PlaceSavedOut` + `Location`. Si la sincronización falla, el lugar ya está guardado (RF-30.24).
- **Editar:** `PUT` → mismo camino con `update_place`; sin fila devuelta → 404. El cuerpo no lleva `id`, así que no hay forma de cambiarlo. El ciclo se comprueba justo antes de actualizar.
- **Despublicar:** es una edición con `is_published: false`; `sync` retira el lugar del índice (HU-29). No hay `DELETE` de lugares, así que el 405 sale de FastAPI al no existir esa ruta (RF-30.17).
- **Reindexar:** `POST /places/{id}/reindex` → 404 si no existe → `sync.sync(id)` → `PlaceSavedOut`.
- **Autenticación:** todas las rutas dependen de `get_current_admin` (401 con `WWW-Authenticate`); las de escritura reciben el `username` para `updated_by`. El botón «Authorize» de `/docs` ya funciona por `HTTPBearer`.
- **Errores 422:** los de pydantic salen con el formato de FastAPI (`detail: [{loc, msg, type}]`); los del servicio usan el mismo formato (`loc: ["body", "category_id"]`), para que HU-31 los muestre junto al campo con un solo manejador.
- **Atomicidad (RF-30.27):** cada escritura es una sola sentencia con `returning`, o una transacción que comprueba y escribe; la sincronización con el asistente va después y no revierte.
- **Caché:** el servidor no cachea lugares; el middleware impide que se cachee la administración. Los cambios se ven en la API pública en el acto, y en un navegador hasta 60 s después por `max-age` (RF-30.26).
- **Registro (RF-30.30):** `logger.info("lugar creado id=%s por=%s")` y análogos, sin contenido de campos.

## 5. Decisiones
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Secuencia de Postgres para el id | `max(id) + 1` en la aplicación | Atómica con varios administradores a la vez; no hay carreras ni reutilización. Deja huecos si un alta falla después de `nextval`; es aceptable. |
| La secuencia empieza en 1000 | Empezar en 1 | Evita confundir los ids nuevos con los numéricos antiguos de la web. Se cambia con una línea si el equipo prefiere otro valor. |
| `PlaceIn` con `extra="forbid"` | Ignorar campos desconocidos | Un error de escritura no se pierde en silencio (RF-30.15) y `id` queda rechazado sin código extra. |
| Validar categoría y padre en el servicio, además de las claves foráneas | Dejar que falle la clave foránea | Permite un error 422 con el nombre del campo; las claves foráneas siguen como última barrera. |
| `verified` booleano en vez de aceptar `verified_at` | Aceptar la fecha del cliente | La hora la fija el servidor y no se puede falsificar ni retroceder (RF-30.11). |
| `coalesce(verified_at, now())` en SQL | Leer y luego escribir | Una sola sentencia; conserva la fecha original sin carreras. |
| Filtro `q` en Python | `ilike` con `unaccent` | Sin extensión nueva, y reutilizable cuando haya más datos si se pagina después. |
| Middleware de `no-store` | Cabecera en cada endpoint | Cubre también 401 y 422 y evita olvidos. |
| `PlaceSync` como punto único de enganche | Llamar a funciones de HU-29 desde el router | HU-29 no existe aún y su orden está pendiente; así HU-30 se implementa y se prueba ya, y la conexión es un cambio en un archivo. |
| 405 por ausencia de ruta | Ruta `DELETE` que responde 405 | Es lo que hace FastAPI por defecto, con `Allow` correcto; menos código. |
| `DELETE` solo para categorías | Sin `DELETE` en categorías | Las categorías no se pueden despublicar, así que sin borrado quedarían categorías vacías para siempre. |

## 6. Estrategia de pruebas
| Requisito | Test |
|---|---|
| RF-30.1 | `test_places_admin_api.py` › «RF-30.1: sin token, alterado o vencido da 401 con WWW-Authenticate en todos los endpoints» (con el almacén de administradores falso de HU-25) |
| RF-30.2 | › «RF-30.2: las respuestas de administración llevan Cache-Control: no-store (200, 401 y 422)» |
| RF-30.3, 30.4 | › «RF-30.3: el listado trae no publicados y created_at y updated_by», «RF-30.4: filtros category, published, verified y q combinados» · integración › «RF-30.4: q sin tildes ni mayúsculas» |
| RF-30.5 | › «RF-30.5: detalle de un lugar no publicado; 404 si no existe» |
| RF-30.6, 30.7 | › «RF-30.6: crea y responde 201 con Location», «RF-30.7: faltan campos obligatorios da 422», «aparece en la API pública» · integración › «RF-30.6: el lugar creado sale en GET /api/places» |
| RF-30.8 | `test_places_admin_schemas.py` › «RF-30.8: id en el cuerpo da 422» · integración › «RF-30.8: dos altas seguidas y concurrentes dan ids distintos y crecientes; el mismo nombre no importa» |
| RF-30.9, 30.10 | › «RF-30.9: PUT reemplaza todo y lo omitido queda vacío», «RF-30.10: updated_by y updated_at», «created_at y updated_by no se aceptan en el cuerpo» |
| RF-30.11 | integración › «RF-30.11: verified fija la hora, la conserva en una segunda edición y la borra con false» |
| RF-30.12 | › «RF-30.12: editar sin cambios responde 200 y actualiza updated_at» |
| RF-30.13 | `test_places_admin_schemas.py` › «RF-30.13: nombre vacío o largo, lat y lng fuera del campus, email, website e image_url (javascript:), textos largos» · API › «categoría inexistente, padre inexistente, padre igual a sí mismo y ciclo de dos niveles, cada uno con su campo» |
| RF-30.14 | › «RF-30.14: recorta, vacío es sin dato, listas sin vacíos ni repetidos y con máximos» |
| RF-30.15 | › «RF-30.15: un campo desconocido da 422» |
| RF-30.16 | › «RF-30.16: despublicar lo quita de lista, filtros y detalle públicos y lo conserva en administración; volver a publicar lo trae» · integración |
| RF-30.17 | › «RF-30.17: DELETE de un lugar da 405 y no cambia nada» |
| RF-30.18 a 30.20 | › «RF-30.18: categorías con places_count (incluye no publicados)», «RF-30.19: crear con id repetido da 409 y sort_order por defecto al final», «RF-30.20: PUT reemplaza label, color y sort_order; el id no cambia» |
| RF-30.21 | › «RF-30.21: borrar una categoría con lugares (aunque estén despublicados) da 409 con la cantidad; vacía da 204; inexistente 404» · integración |
| RF-30.22 | integración › «RF-30.22: las categorías nuevas salen en /api/place-categories» |
| RF-30.23 | › «RF-30.23: guardar, editar y despublicar llaman a la sincronización después de guardar» (con un `PlaceSync` espía) |
| RF-30.24 | › «RF-30.24: si la sincronización lanza una excepción, el lugar queda guardado, responde 200/201 con rag_sync failed y se registra», «sin servicio real rag_sync skipped», «correcto ok» |
| RF-30.25 | › «RF-30.25: reindex repite la sincronización; 404 si el lugar no existe» |
| RF-30.26 | integración › «RF-30.26: un cambio se ve en la API pública en la misma sesión, sin esperar» |
| RF-30.27 | integración › «RF-30.27: un fallo de validación no deja filas ni consume un estado a medias» |
| RF-30.28 | › «RF-30.28: base caída da 503 con mensaje» (todos los endpoints) |
| RF-30.29 | › «RF-30.29: OpenAPI muestra las etiquetas admin-places y admin-place-categories, la seguridad Bearer y descripciones» |
| RF-30.30 | › «RF-30.30: el log registra administrador e id y no el contenido de los textos» (`caplog`) |

A mano, con el backend real: `curl` del flujo completo (login, crear, editar con `verified`, despublicar, comprobar `GET /api/places`, `POST …/reindex`) y revisar `/docs` con «Authorize» (escenario 11 apagando la base). Los escenarios 2, 4 y 9 completos (asistente) quedan pendientes de HU-29.

## 7. Riesgos y dependencias
- **HU-29 pendiente:** sin ella `rag_sync` siempre vale `"skipped"` y no se comprueba que el asistente vea los cambios. El enganche es un solo archivo (`sync.py`).
- **Número de migración:** puede chocar con la de HU-29; se toma el siguiente libre al implementar y se anota en `task.md`.
- **Huecos en los ids** por altas fallidas tras `nextval`: aceptado.
- **Área del campus duplicada** (web y backend): se documenta con un comentario en ambos lados; una sede nueva exigirá cambiar los dos.
- **Edición simultánea:** gana el último en guardar (fuera de alcance en la spec).
- **Cuerpo `PUT` completo:** una llamada manual que omita campos los borra; queda documentado en `/docs` y en el README, y HU-31 siempre envía el formulario entero.

## 8. Historial
- 2026-11-12 · Plan creado.
