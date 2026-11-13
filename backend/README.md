# ⚙️ Backend — OndeSanMarcos (Asistente RAG)

API del **asistente IA del campus** basada en **RAG (Retrieval-Augmented Generation)**.
Implementa el endpoint `POST /api/chat` que **ya consume el frontend** (la app apunta
por defecto al backend desplegado en Render). En **producción** corre con **LLM real
(Gemini `gemini-2.5-flash`)** sobre el **corpus oficial** del campus y **recuperación
semántica con pgvector** (Postgres + embeddings Gemini `gemini-embedding-001`, 768
dims, similitud coseno HNSW). Si `DATABASE_URL` no está definida, cae con gracia a una
recuperación **local** (bag-of-words). Para desarrollo y pruebas también corre
**aislado en modo mock** (embeddings + LLM deterministas, sin llaves ni servicios
externos).

> Diseño y contexto general: ver [`/documents/03-backend-rag.md`](../documents/03-backend-rag.md).

---

## 🧩 Arquitectura

```
backend/
├── app/
│   ├── main.py            # FastAPI: /health + router del chat
│   ├── config.py          # Settings (pydantic-settings): RAG_USE_MOCK, top_k, umbral, DATABASE_URL...
│   ├── api/chat.py        # POST /api/chat  → motor RAG
│   ├── schemas/chat.py    # ChatRequest / ChatResponse / LocationResult / Coordinate
│   ├── knowledge/         # base de conocimiento
│   │   ├── places.py      #   lugares del campus (37, espejo del front)
│   │   ├── corpus.py      #   corpus oficial (41 docs, derivado de sources/unmsm_info.md)
│   │   ├── entries.py     #   entradas aprobadas (respaldo versionado del conocimiento)
│   │   ├── entries/       #   JSON de entradas (gaps_review.json)
│   │   └── sources/       #   documento oficial verificado (fuente única)
│   └── rag/               # motor RAG
│       ├── guardrails.py       #   filtro de alcance UNMSM: léxico + raíces (HU-2.4)
│       ├── intent.py           #   intención de navegación (HU-2.3)
│       ├── embeddings.py       #   mock bag-of-words + Gemini real (gemini-embedding-001)
│       ├── vector_store.py     #   almacén vectorial en memoria (coseno, usado por el mock)
│       ├── pgvector.py         #   retriever real: Postgres pgvector (match_documents)
│       ├── ingestion.py        #   pipeline de ingesta (carga, troceado, embeddings)
│       ├── retriever.py        #   indexa por fragmentos + recuperación top-k
│       ├── llm.py              #   mock anclado al contexto + Gemini/OpenAI/Anthropic reales
│       ├── providers.py        #   selección de proveedores mock vs reales
│       ├── engine.py           #   orquestación del pipeline
│       ├── ingest_pgvector.py  #   ingesta a Postgres (corpus + entradas → pgvector)
│       ├── find_gaps.py        #   detecta lugares sin descripción y redacta borradores (Gemini)
│       └── upload_entries.py   #   sube entradas aprobadas a Postgres
└── tests/                 # pytest (76): guardrails, retriever, ingesta, pgvector, proveedores, motor, enrutamiento, entradas, endpoint
```

Pipeline de una consulta:

```mermaid
flowchart LR
    q["POST /api/chat<br/>{ query }"] --> g{"Guardrails<br/>¿tema UNMSM?<br/>(léxico + raíces)"}
    g -->|No| d["Declina"]
    g -->|Sí| r["Retriever<br/>pgvector (Postgres)<br/>+ embeddings Gemini"]
    r --> p["Detección de lugares<br/>(keywords + mejor doc)"]
    p --> l["LLM Gemini<br/>respuesta anclada"]
    l --> resp["{ answer, locations,<br/>draw_route, destination }"]
```

> Sin `DATABASE_URL`, el `Retriever` local (bag-of-words) sustituye al paso
> de pgvector; en modo mock todo el pipeline es determinista (sin red).

---

## 🚀 Puesta en marcha

Requiere **Python 3.11+**.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows  (en Linux/Mac: source .venv/bin/activate)
pip install -r requirements.txt

# Configuración (opcional: por defecto ya corre en modo mock)
copy .env.example .env          # Windows  (Linux/Mac: cp .env.example .env)
```

### Ejecutar la API

```bash
uvicorn app.main:app --reload
```

- Healthcheck: http://localhost:8000/health
- Documentación interactiva (Swagger): http://localhost:8000/docs

### Probar el endpoint

```bash
curl -X POST http://localhost:8000/api/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"query\": \"horario de la biblioteca\"}"
```

Respuesta:

```json
{
  "answer": "La Biblioteca Central Pedro Zulen abre de lunes a viernes de 7:30 a 20:00 y los sábados de 8:00 a 17:00. Toca \"Ver en mapa\" para ubicarlo.",
  "locations": [
    { "id": "biblioteca-central", "name": "Biblioteca Central Pedro Zulen", "schedule": "Lun–Sáb 8:00–20:00 · Requiere carné de biblioteca · Tel: 619-7000 anexo 7701" }
  ],
  "draw_route": false,
  "destination": null
}
```

### Ejecutar las pruebas

```bash
pytest                      # unitarias (sin red, sin base, sin Gemini)
```

Con `DATABASE_URL` definida también corren las pruebas de **integración**
(`tests/integration/`) contra Postgres. Crean su propia base `<nombre>_test`, le
aplican las migraciones y la borran al terminar: **nunca tocan la base de
desarrollo**. Sin `DATABASE_URL` se omiten.

---

## 🗄️ Base de datos (Postgres + pgvector)

La recuperación semántica usa un Postgres con la extensión **pgvector**. En
desarrollo corre en Docker; el esquema lo crea **Flyway** con migraciones SQL
versionadas en `db/migrations/` (`V1__pgvector_schema.sql`: extensión `vector`,
tabla `documents`, índice HNSW y la función `match_documents`). Una migración ya
aplicada no se edita: un cambio va en una migración nueva (`V2__...sql`).

Desde la raíz del repo, con Docker:

```bash
./script/dev.sh                 # base de datos + migraciones + backend + web
./script/dev.sh ingest          # embebe el corpus (55 fragmentos) y lo carga en la base
./script/dev.sh psql            # consola SQL
./script/dev.sh db-dump         # copia de seguridad de los vectores (backend/db/dumps/)
./script/dev.sh db-restore      # restaura el último dump, sin llamar a Gemini
./script/dev.sh db-reset        # BORRA la base y la recrea vacía (pide confirmación)
```

Para usar los vectores hay que poner `RAG_USE_MOCK=false` en `backend/.env` (con
`LLM_PROVIDER=gemini` y `LLM_API_KEY`) y haber ingerido el corpus. Si la tabla está
vacía, `POST /api/chat` responde **503** con «La base de conocimiento está vacía;
ejecuta ./script/dev.sh ingest». Si la base no responde, también **503**.

### Cuidar la cuota de Gemini

Cada fragmento necesita una llamada de embeddings, y cada consulta del chat hace
otra, además de la que redacta la respuesta. Por eso:

- La base **no se borra por accidente**: `down` y `clean` la conservan; solo
  `db-reset` la borra, y pide confirmación.
- `ingest` se **niega a sobrescribir** una tabla con datos salvo `--force`.
- Los embeddings se guardan en `backend/.rag_cache/` (ignorada por git): reingerir
  un texto sin cambios **no vuelve a llamar a Gemini**. Al terminar, `ingest`
  indica cuántos se pidieron a Gemini y cuántos vinieron de la caché.
- Ante un error de límite (429/5xx) se reintenta con espera creciente (1, 2, 4,
  8, 16 s). Si se agota, la ingesta falla **sin tocar la tabla**; lo ya embebido
  queda en la caché.
- Las consultas repetidas se resuelven desde una caché en memoria.
- `db-dump` guarda los vectores en un archivo: sirve de respaldo y para
  restaurarlos sin gastar cuota.

### Variables

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Cadena de conexión. En Docker la fija `docker-compose.yml` (host `db`); fuera de Docker usa `localhost:5432` (ver `.env.example`) |
| `DB_CONNECT_TIMEOUT` | Segundos máximos para conectar antes de responder 503 (por defecto 3) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Administrador inicial: al arrancar se crea en `admin_users` si no existe (contraseña hasheada con bcrypt, máx. 72 bytes). Si ya existe no se modifica. `DATABASE_URL` es obligatoria: sin ella la app no arranca y lo informa; cambia la contraseña fuera de desarrollo |
| `JWT_SECRET` | Secreto para firmar los tokens del administrador (**obligatoria**, ≥ 32 caracteres; sin ella la app no arranca). Genérala con `python -c "import secrets; print(secrets.token_urlsafe(48))"` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Vida del token en minutos (por defecto 60, sin renovación) |

---

## 📍 Lugares del campus (tablas `places` y `place_categories`)

Los lugares viven en Postgres (migración `V3__places.sql`): nombre, categoría,
coordenadas (`lat`, `lng`), palabras clave y los campos de la ficha (horario,
teléfono, anexo, descripción, carreras, servicios, cómo llegar…). El `id` es un
slug estable (`fisi`, `puerta-8`). `verified_at` vacío = dato sin confirmar con la
universidad (hoy todos). `is_published` permite ocultar un lugar sin borrarlo.

```bash
./scripts/dev.sh seed-places    # carga db/seed/places.json; no pisa lo que ya existe
```

- La carga es **idempotente**: una segunda corrida no inserta nada y las ediciones
  hechas después se conservan. Si la semilla tiene un lugar inválido, no escribe
  nada y el error nombra el lugar.
- Tras `db-reset` hay que volver a correr `seed-places` (las migraciones crean las
  tablas vacías). Para rehacer un lugar, bórralo con `psql` y vuelve a cargar.
- `db/seed/places.json` es la semilla versionada; `db/seed/place_id_map.json` traduce
  los ids antiguos de la web (`"8"`) a los slugs (`fisi`). La semilla **no** depende de
  `places.ts`, `places.py` ni del corpus.
- La semilla se generó una sola vez a partir de los datos que la web tenía en el código
  (ya retirados, HU-28); desde entonces la fuente de verdad es la base de datos y este JSON
  es solo el punto de partida para un entorno nuevo. `app.tools.places.export_seed` queda
  como registro de cómo se unieron esas fuentes (fusión de duplicados, slugs y mapa de ids).

### API pública de lugares (solo lectura, sin autenticación)

| Endpoint | Devuelve |
|---|---|
| `GET /api/place-categories` | Categorías (`id`, `label`, `color`), ordenadas por `sort_order`. |
| `GET /api/places` | Lugares **publicados**, ordenados por nombre. Filtro opcional `?category=<id>` (una categoría inexistente da `[]`). |
| `GET /api/places/{id}` | Un lugar publicado. Si no existe, está oculto o el id no es un slug: el mismo `404`. |

Cada lugar trae `id`, `name`, `short_name`, `category_id`, `lat`, `lng`, `keywords`,
`description`, `schedule`, `detailed_schedule`, `phone`, `annex`, `email`, `website`,
`access_hint`, `careers`, `services`, `usage`, `image_url`, `parent_place_id`,
`is_published`, `verified_at` (vacío = dato sin confirmar) y `updated_at`. Las listas
sin datos son `[]` y los textos sin dato, `null`. No se exponen `created_at` ni
`updated_by`. Con la base apagada responden `503`.

**Caché:** las respuestas `200` llevan `Cache-Control: public, max-age=60` y un `ETag`
(hash del contenido). Con `If-None-Match` vigente responden `304` sin cuerpo; un cambio
en la base cambia el `ETag`. Tras editar un lugar, un visitante puede ver el dato
anterior hasta 60 s.

```bash
curl -i http://localhost:8000/api/places/fisi
curl -i http://localhost:8000/api/places/fisi -H 'If-None-Match: "<etag>"'   # 304
curl 'http://localhost:8000/api/places?category=puertas'
```

#### Búsqueda de lugares (`GET /api/places/search?q=`)

Pública, solo lugares publicados. Busca en `places` con Postgres (`unaccent` + `pg_trgm`, migración V5; **no usa pgvector ni embeddings**): ignora tildes y mayúsculas y tolera errores de escritura (`bibliotca` → Biblioteca). Orden por niveles: sigla o palabra clave exacta, el nombre empieza con el texto, el nombre lo contiene, una palabra clave lo contiene y, por último, coincidencia aproximada (solo con 3+ caracteres). `q` de 2 a 100 caracteres (con menos de 2, lista vacía); `limit` de 1 a 20 (por defecto 8). Misma caché (`ETag`, 60 s) que el resto de la API pública. Sin índices: con decenas de lugares un escaneo es más barato; si el catálogo crece, agregar un índice GIN `gin_trgm_ops` sobre `immutable_unaccent(lower(name))`.

### API de administración de lugares (requiere sesión de administrador)

Todas las rutas llevan `Authorization: Bearer <token>` (se obtiene en `POST /api/auth/login`; en `/docs`, botón «Authorize») y responden con `Cache-Control: no-store`. Sin token válido: 401.

| Método y ruta | Qué hace |
|---|---|
| `GET /api/admin/places` | Todos los lugares, también los ocultos, con `created_at` y `updated_by`. Filtros: `category`, `published`, `verified`, `q` (sin tildes ni mayúsculas; nombre, sigla, palabras clave e id). |
| `GET /api/admin/places/{id}` | Ficha completa, publicada o no. |
| `POST /api/admin/places` | Crea un lugar (201 + `Location`). El `id` lo asigna el sistema (número incremental desde 1000); no se acepta en el cuerpo. |
| `PUT /api/admin/places/{id}` | **Reemplazo completo**: lo que no se envía queda vacío. Para despublicar: `is_published: false`. |
| `POST /api/admin/places/{id}/reindex` | Repite la sincronización con el asistente. |
| `GET/POST /api/admin/place-categories`, `PUT/DELETE /api/admin/place-categories/{id}` | Categorías con su `places_count`. Solo se borra una categoría sin lugares (409 si tiene). |

Los lugares **no se borran** (`DELETE` responde 405): se despublican.

Campos obligatorios: `name`, `category_id`, `lat`, `lng` (dentro del área del campus: lat -12.070…-12.043, lng -77.096…-77.069). `verified: true` fija `verified_at` (si ya estaba, conserva la fecha); `false` la borra. Un campo desconocido, un `id`, una categoría o un lugar contenedor inexistente, un correo mal escrito o una URL que no sea `http(s)` dan **422** con `detail: [{loc: ["body", "<campo>"], msg}]`.

Las respuestas de crear, editar y reindexar traen `rag_sync`: `ok`, `skipped` (el asistente aún no se conecta a los lugares, HU-29) o `failed` (el cambio **sí** se guardó; se repite con `/reindex`). La conexión con el asistente vive en `app/places/sync.py`.

```bash
TOKEN=$(curl -s localhost:8000/api/auth/login -H 'content-type: application/json' \
  -d '{"username":"admin","password":"..."}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')
curl -s localhost:8000/api/admin/places -H "Authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"name":"Laboratorio de Redes","category_id":"facultades","lat":-12.0535,"lng":-77.0857}'
```

## 🔐 Login de administrador

- `POST /api/auth/login` con `{ "username", "password" }` → `{ "access_token", "token_type": "bearer", "expires_in" }`. Credenciales incorrectas: 401 (mismo mensaje exista o no el usuario). Tras 5 intentos fallidos seguidos de un usuario: 429 con `Retry-After` durante 15 minutos (contador en memoria: pensado para una sola instancia).
- `GET /api/auth/me` con `Authorization: Bearer <token>` → `{ "username" }`; 401 si el token falta, está alterado, venció o el administrador ya no existe.
- Para proteger un endpoint nuevo: `admin: str = Depends(get_current_admin)` (`app/auth/dependencies.py`).
- Prueba rápida en `/docs` con el botón «Authorize» tras hacer login.

---

## 🔌 Contrato del chat

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| `POST` | `/api/chat` | `{ "query": string }` | `{ "answer", "locations": LocationResult[], "draw_route": bool, "destination": Coordinate? }` |
| `GET`  | `/health` | — | `{ "status": "ok", ... }` |

`LocationResult = { id, name, schedule? }` · `Coordinate = { latitude, longitude }`.
Para consultas de navegación ("cómo llego a…"), `draw_route` es `true` y
`destination` trae las coordenadas del lugar (HU-2.3). El **frontend ya consume este
endpoint por defecto** (apunta al backend de Render; el mock del chat solo se activa
con `EXPO_PUBLIC_USE_MOCK_CHAT=true`).

---

## 🔁 Modo mock vs. proveedores reales

Controlado por `RAG_USE_MOCK` (ver `.env.example`):

| | Modo mock (`true`, tests/local) | Modo real (`false`, **producción**) |
|---|---|---|
| Embeddings | `BagOfWordsEmbedding` (sin deps) | **Gemini** `gemini-embedding-001` (768 dims) *(activo)* |
| LLM | `TemplateLLM` (anclado al contexto) | **Gemini** `gemini-2.5-flash` (u OpenAI/Anthropic) *(activo)* |
| Recuperación | en memoria (bag-of-words) | **Postgres + `pgvector`** (coseno HNSW) · local si falta `DATABASE_URL` |
| Requisitos | `requirements.txt` | + `requirements-llm.txt` (Gemini) + `requirements-pgvector.txt` (Postgres); `LLM_API_KEY` y `DATABASE_URL` |

La selección de implementaciones vive en `app/rag/providers.py` (la usa
`engine.build_engine`). Si en modo real falta una llave o dependencia, se lanza
`RagProviderError` y el endpoint responde **503** con instrucciones. Guía
completa de activación en
[`/documents/07-avance-backend.md`](../documents/07-avance-backend.md).
