# 9. Recuperación con pgvector (Supabase) — local reproducible

Guía para levantar y **reproducir** la recuperación semántica del backend RAG con
**Supabase + pgvector** en local (Docker), poblarla con embeddings reales de
Gemini y verificarla de extremo a extremo. Incluye **evidencia** de una corrida
exitosa. El mismo esquema y script sirven para el proyecto **cloud** (§9.6).

> Complementa el diseño de [`03-backend-rag.md`](./03-backend-rag.md) y el estado
> del motor en [`07-avance-backend.md`](./07-avance-backend.md). El código vive en
> `backend/app/rag/{embeddings.py,pgvector.py,ingest_pgvector.py,providers.py}` y
> el esquema en `backend/db/schema.sql`.

---

## 9.1 Qué añade

Reemplaza la recuperación **local** (bag-of-words léxico, en memoria) por
**embeddings neuronales** (`gemini-embedding-001`, 768 dims) almacenados en
**pgvector** y consultados por **similitud coseno**. Recupera por *significado*,
no solo por coincidencia de palabras.

Se activa cuando `RAG_USE_MOCK=false` **y** `SUPABASE_URL`/`SUPABASE_SERVICE_KEY`
están definidos (ver `app/rag/providers.py::build_retriever`). Sin Supabase, sigue
la recuperación local; en tests, siempre mock (hermético).

---

## 9.2 Requisitos

- **Docker** en ejecución.
- **Node** (para `npx supabase`, no requiere instalar el CLI global).
- **psql** (opcional, para inspeccionar la BD).
- Backend con dependencias: `requirements.txt` + `requirements-llm.txt`
  (Gemini) + `requirements-pgvector.txt` (cliente `supabase`).
- Una **API key de Gemini** (Google AI Studio) en `LLM_API_KEY`.

---

## 9.3 Levantar Supabase local

El proyecto ya está inicializado: `supabase/config.toml` y la migración
`supabase/migrations/20260704000000_pgvector_schema.sql` (copia idempotente de
`backend/db/schema.sql`, con la extensión `vector`, la tabla `documents`, el índice
HNSW coseno, la función `match_documents` y los `grant` para `service_role`).

```bash
# desde la raíz del repo
npx --yes supabase start        # descarga imágenes (~1 GB la 1ª vez) y aplica migraciones
```

Al terminar imprime las credenciales **locales** (claves demo, NO secretas):

```
API_URL:          http://127.0.0.1:54321
DB_URL:           postgresql://postgres:postgres@127.0.0.1:54322/postgres
SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
STUDIO_URL:       http://127.0.0.1:54323   (UI web)
```

> `npx supabase status` reimprime estos valores. `npx supabase stop` apaga el
> stack. `npx supabase db reset` recrea la BD aplicando las migraciones desde cero
> (útil para verificar reproducibilidad del esquema + grants).

---

## 9.4 Poblar y verificar

```bash
cd backend
export SUPABASE_URL="http://127.0.0.1:54321"
export SUPABASE_SERVICE_KEY="<SERVICE_ROLE_KEY del paso anterior>"
# (LLM_API_KEY, LLM_PROVIDER=gemini y RAG_USE_MOCK=false salen de backend/.env)

python -m app.rag.ingest_pgvector          # embebe el corpus e inserta en pgvector
```

Verificación de recuperación (no gasta cuota de LLM):

```bash
python -c "
from app.config import get_settings
from app.rag.providers import build_retriever
r = build_retriever(get_settings())
for q in ['horario de la biblioteca','examen de admision','donde hago deporte']:
    print(q, '->', [(c.document.id, round(c.score,3)) for c in r.retrieve(q,3)])
"
```

---

## 9.5 Evidencia de éxito (corrida del 04/07/2026)

**Esquema aplicado** (migración local):
```
extension vector · table documents · function match_documents
columnas: id bigint, content text, metadata jsonb, embedding vector(768)
service_role: INSERT, SELECT, UPDATE, DELETE
```

**Ingesta:**
```
Ingeridos 48 fragmentos de 41 documentos en la tabla 'documents'.
select count(*) from documents;  -> 48
```

**Recuperación semántica** (retriever = `PgVectorRetriever`):
```
'horario de la biblioteca'  -> doc-biblioteca(0.706), doc-faq-visitantes(0.631), doc-gimnasio(0.631)
'examen de admision'        -> doc-oca(0.690), doc-faq-ingreso(0.667), doc-cepre(0.647)
'donde hago deporte'        -> doc-gimnasio(0.677), doc-estadio(0.650), doc-clinica(0.619)
```
La 3ª es una **victoria semántica**: recupera gimnasio/estadio sin que la consulta
diga esas palabras.

**Motor completo (embed → pgvector → Gemini):**
```
'¿a qué hora abre la biblioteca?' -> locs=['biblioteca-central'] draw_route=False
   "La Biblioteca Central Pedro Zulen abre de lunes a viernes a las 7:30..."
'¿cómo llego al rectorado?'       -> locs=['rectorado'] draw_route=True
```

**Tests:** `pytest` → `43 passed` (herméticos, en modo mock, sin red).

---

## 9.6 Notas y siguiente paso (cloud)

- **Claves locales = demo compartidas.** No son secretas; no usar en producción.
- **Cuota del free tier de Gemini:** `gemini-2.5-flash` permite ~20 generaciones/día
  gratis; los embeddings tienen cuota aparte. Si aparece `429 RESOURCE_EXHAUSTED`,
  es límite de cuota (no un bug): esperar o habilitar billing.
- **Umbral de score:** `RAG_SCORE_THRESHOLD` (0.12) está calibrado para bag-of-words;
  con embeddings densos las similitudes son ~0.6–0.7. La detección de lugares ya no
  depende de un umbral relativo (ver `engine._detect_places`), pero para filtrar
  contexto irrelevante en cloud puede subirse vía env.
- **Cloud:** crear el proyecto en Supabase, correr `backend/db/schema.sql` en el SQL
  Editor (o `supabase db push`), poblar con `ingest_pgvector`, y definir
  `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` como secretos en Render (ver
  [`08-despliegue-render.md`](./08-despliegue-render.md) §8.8).
