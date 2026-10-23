# HU-23 · Plan técnico

- **Spec:** [spec.md](spec.md)
- **Estado:** Borrador

## 1. Enfoque
1. Mover el esquema a una migración de Flyway y levantar `db` + `migrate` en Docker Compose.
2. Un módulo `app/rag/db.py` concentra el acceso a Postgres (conexión, búsqueda, ingesta, borrado por lugar). Los tres usos actuales de Supabase pasan a usarlo.
3. Quitar Supabase: paquete, variables, carpeta `supabase/`, comentarios y documentación del backend.
4. Comandos nuevos en `script/dev.sh`, pruebas de integración y CI con un Postgres real.

## 2. Contenedores y migraciones
`docker-compose.yml`:

| Servicio | Imagen | Detalle |
|---|---|---|
| `db` | `pgvector/pgvector:pg16` | Volumen `db_data`, `POSTGRES_USER/PASSWORD/DB = ondesanmarcos` (solo desarrollo), `healthcheck: pg_isready`, puerto `127.0.0.1:${DB_PORT:-5432}:5432` |
| `migrate` | `flyway/flyway` (versión fija) | `command: migrate`, `FLYWAY_URL=jdbc:postgresql://db:5432/ondesanmarcos`, usuario y contraseña de `db`, `./backend/db/migrations:/flyway/sql:ro`, `depends_on: db (healthy)`, sale con 0 al terminar |
| `backend` | (existente) | `depends_on: db (healthy), migrate (service_completed_successfully)`; `environment: DATABASE_URL=postgresql://ondesanmarcos:ondesanmarcos@db:5432/ondesanmarcos` (tiene prioridad sobre `backend/.env`) |
| `web` | (existente) | Sin cambios |

Migraciones en `backend/db/migrations/`:
- `V1__pgvector_schema.sql`: contenido de `supabase/migrations/20260704000000_pgvector_schema.sql` **sin** las líneas `grant … to service_role` (ese rol no existe en Postgres común). Mantiene `create extension if not exists vector`, la tabla `documents`, el índice HNSW y `match_documents`.
- Una sola fuente del esquema: se borran `backend/db/schema.sql` y `supabase/`.

## 3. Datos y configuración
- `Settings`: se eliminan `supabase_url` y `supabase_service_key`; se añade `database_url: str = ""` y `db_connect_timeout: int = 3` (segundos). Se conservan `pgvector_table` y `pgvector_match_fn`.
- `backend/.env.example`: `DATABASE_URL=postgresql://ondesanmarcos:ondesanmarcos@localhost:5432/ondesanmarcos` (para correr fuera de Docker; en Docker lo fija `docker-compose.yml`) y se quitan las variables de Supabase.
- Dependencias (`requirements-pgvector.txt`): se quita `supabase`; se añaden `psycopg[binary]`, `psycopg_pool` y `pgvector` (versiones fijas, como el resto).

## 4. Archivos
| Ruta | Qué hace | Cubre |
|---|---|---|
| `docker-compose.yml` | Modifica: `db`, `migrate`, dependencias y `DATABASE_URL` | RF-23.1 a RF-23.3, RF-23.6, RF-23.7 |
| `backend/db/migrations/V1__pgvector_schema.sql` | Nuevo (viene de `supabase/migrations`, sin `grant`) | RF-23.4, RF-23.5 |
| `backend/db/schema.sql`, `supabase/**` | Se eliminan | RF-23.8 |
| `backend/app/config.py` | Modifica: `database_url`, `db_connect_timeout`; quita Supabase | RF-23.8 |
| `backend/app/rag/db.py` | Nuevo: pool de conexiones, `match()`, `replace_all()`, `count_place()`, `delete_place()`, `insert_rows()`, `is_empty()` | RF-23.9 a RF-23.11, RF-23.14, RF-23.15 |
| `backend/app/rag/providers.py` | Modifica: `_build_pgvector_retriever` usa `db.py`; selección por `database_url` | RF-23.9, RF-23.12, RF-23.13, RF-23.15 |
| `backend/app/rag/ingest_pgvector.py` | Modifica: ingesta con `db.replace_all` (una transacción) | RF-23.10 |
| `backend/app/rag/upload_entries.py` | Modifica: contar, borrar e insertar con `db.py` | RF-23.11 |
| `backend/app/rag/pgvector.py`, `vector_store.py`, `retriever.py`, `find_gaps.py`, `app/knowledge/*.py` | Modifica: solo comentarios y textos que nombran Supabase | RF-23.8 |
| `backend/requirements-pgvector.txt`, `requirements-llm.txt`, `requirements-rag.txt` | Modifica: dependencias y comentarios | RF-23.8 |
| `backend/.env.example`, `backend/README.md`, `README.md` | Modifica: variables y flujo | RF-23.17 |
| `backend/pytest.ini` | Modifica: marcador `integration` | RF-23.18 |
| `backend/tests/*` | Modifica y añade tests (ver §7) | RF-23.18 |
| `script/dev.sh` | Modifica: `ingest`, `db-reset`, `psql`; `test` levanta `db` y `migrate` | RF-23.16, RF-23.18 |
| `.github/workflows/backend-ci.yml` | Modifica: servicio Postgres con pgvector, migrar y exportar `DATABASE_URL` | RF-23.18 |

## 5. Diseño del acceso a datos (`db.py`)
- **Driver:** `psycopg` 3 síncrono: el endpoint `chat` y el motor ya son síncronos.
- **Pool:** `psycopg_pool.ConnectionPool(open=False)` creado de forma perezosa en la primera consulta. Así el servidor arranca sin base (RF-23.13) y no hay conexiones en modo mock. `connect_timeout` y `pool timeout` = `db_connect_timeout` (RF-23.14).
- **Vectores:** `pgvector.psycopg.register_vector` para enviar listas como `vector`.
- **Búsqueda:** `select id, content, metadata, similarity from match_documents(%s, %s)` con `dict_row`; devuelve `list[dict]`, igual que el `Matcher` actual.
- **Base vacía:** solo cuando la búsqueda devuelve 0 filas se ejecuta `select exists (select 1 from documents)`; si es falso se lanza `RagProviderError("La base de conocimiento está vacía; ejecuta ./script/dev.sh ingest")` (RF-23.15). Sin costo extra en el caso normal.
- **Errores de conexión:** `psycopg.OperationalError` y `PoolTimeout` se convierten en `RagProviderError` con mensaje claro; el manejador existente de `main.py` lo devuelve como 503 (RF-23.14).
- **Ingesta:** `with conn.transaction(): delete from documents; insert … (executemany por lotes de 100)`; `metadata` con `Jsonb`. El nombre de tabla se compone con `psycopg.sql.Identifier` (no con f-strings).
- **Upload de entradas:** `count_place`, `delete_place` (`where metadata->>'place_id' = %s`) e `insert_rows`, en una transacción por lugar.

## 6. Decisiones
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Flyway en un contenedor `migrate` | Alembic; `schema.sql` en `docker-entrypoint-initdb.d` | SQL puro versionado, historial y checksums; no añade SQLAlchemy ni código Python; sirve igual contra cualquier Postgres |
| `psycopg` 3 síncrono con pool perezoso | Asíncrono; una conexión por consulta | El código ya es síncrono; el pool evita reconectar y la apertura perezosa permite arrancar sin base |
| Eliminar Supabase por completo | Mantener ambos modos | Un solo camino; Supabase sigue siendo Postgres, así que bastaría su cadena de conexión en `DATABASE_URL` |
| Base vacía → 503 con mensaje | Fallback local silencioso; ingesta automática | No oculta el problema ni gasta llamadas a Gemini sin avisar |
| `DATABASE_URL` fijada en `docker-compose.yml` | Dejarla solo en `backend/.env` | `.env` usa `localhost` (fuera de Docker); dentro de Docker el host es `db`. `environment` tiene prioridad |
| Servicio `migrate` aparte | Migrar al arrancar el backend | Separa responsabilidades y falla pronto si la migración está mal |
| Credenciales de desarrollo en el compose | Secretos en `.env` | Es una base local y desechable; no hay datos sensibles |

## 7. Estrategia de pruebas
**Unitarias** (sin base, red ni Gemini): se sustituyen los fakes de Supabase por fakes del módulo `db`.

| Requisito | Test |
|---|---|
| RF-23.8 | `tests/test_config.py`: no existen `supabase_url`/`supabase_service_key`; `database_url` se lee del entorno |
| RF-23.9, RF-23.12, RF-23.13 | `tests/test_providers.py`: con `database_url` selecciona pgvector; sin ella, local; mock no construye el pool |
| RF-23.10 | `tests/test_ingest_pgvector.py`: llama a `replace_all` con corpus y entradas; falla a mitad → no se toca la tabla (fake transaccional) |
| RF-23.11 | `tests/test_upload_entries.py`: cuenta, borra por `place_id` e inserta |
| RF-23.14, RF-23.15 | `tests/test_db.py`: `OperationalError` → `RagProviderError`; 0 filas + tabla vacía → mensaje de base vacía; 0 filas + tabla con datos → lista vacía |
| RF-23.13 | `tests/test_chat_api.py`: en mock, `/api/chat` responde sin tocar la base |

**Integración** (marcador `integration`; se omiten sin `DATABASE_URL`), contra Postgres real con las migraciones aplicadas:

| Requisito | Test |
|---|---|
| RF-23.5 | `tests/integration/test_schema.py`: existen la extensión, la tabla, el índice HNSW y `match_documents` |
| RF-23.9 | `test_match.py`: insertar vectores conocidos y comprobar el orden por similitud |
| RF-23.10 | `test_ingest.py`: dos ingestas dejan las mismas filas; una ingesta que falla conserva los datos |
| RF-23.11 | `test_upload.py`: reemplazo por `place_id` |
| RF-23.15 | `test_empty.py`: tabla vacía → error de base vacía |

**Manual** (con la clave de Gemini): escenarios 1, 3, 4, 8, 9 y 11 de `spec.md` con `./script/dev.sh`; en especial la ingesta real y la consulta con vectores.

## 8. Riesgos y dependencias
- **Clave de Gemini:** la ingesta hace una llamada de embeddings por fragmento; el plan gratuito tiene límites de uso y puede devolver errores 429. La ingesta debe fallar con un mensaje claro sin dejar datos a medias (transacción).
- **Puerto 5432 ocupado** en la máquina: el puerto se puede cambiar con `DB_PORT`.
- **Dimensión del vector:** 768, fija en `V1`; debe coincidir con `EMBEDDING_DIM`. Cambiarla exige una migración nueva.
- **Flyway en Apple Silicon:** la imagen oficial es multiarquitectura; no debería haber problema, pero se comprueba.
- **CI:** al ejecutar pruebas de integración necesita un servicio Postgres con pgvector y aplicar las migraciones (con la imagen de Flyway). El umbral de cobertura (80 %) se mantiene.
- **`documents/`** sigue mencionando Supabase hasta HU-20.
- La base de Supabase de producción no se toca; deja de ser usada por el código.

## 9. Historial
- 2026-10-23 · Plan creado tras resolver las preguntas abiertas del spec.
