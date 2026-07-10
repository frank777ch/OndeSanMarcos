# 📝 Resumen del avance — Backend RAG

**Fecha:** 07/07/2026 · **Estado:** desplegado en producción con **LLM real (Gemini)** sobre **corpus oficial** y **recuperación semántica con pgvector** (Supabase + embeddings Gemini); el frontend ya consume el backend

> 📖 Guía viva y detallada (cómo correr, activar proveedores reales, contrato y
> próximos pasos) en [`documents/07-avance-backend.md`](../documents/07-avance-backend.md).

---

## 🎯 Objetivo de esta iteración

Construir el **backend del asistente IA**, enfocado en el **RAG y su conexión con el chat**.
Arrancó **probable de forma aislada** (modo mock) y hoy corre en **producción** con LLM real
(Gemini), **recuperación semántica con pgvector** y el **frontend ya cableado** a la API.

---

## ✅ Qué se construyó

Un backend **FastAPI** con un **motor RAG completo** que corre sin servicios externos:

| Pieza | Archivo | Qué hace |
|-------|---------|----------|
| App + healthcheck | `app/main.py` | FastAPI, CORS, `/health` y router del chat. |
| Configuración | `app/config.py` | `RAG_USE_MOCK`, `top_k`, umbral, llaves (pydantic-settings). |
| Contrato | `app/schemas/chat.py` | `ChatRequest`, `ChatResponse`, `LocationResult`, `Coordinate` (+ `draw_route`/`destination`). |
| Base de conocimiento | `app/knowledge/` | 37 lugares (espejo del front) + corpus oficial (41 docs desde `sources/unmsm_info.md`) + entradas aprobadas (`entries/`). |
| Guardrails | `app/rag/guardrails.py` | Limita el alcance a temas UNMSM por léxico + raíces del dominio (HU-2.4). |
| Intención | `app/rag/intent.py` | Detecta intención de navegación para el enrutamiento (HU-2.3). |
| Embeddings | `app/rag/embeddings.py` | Mock bag-of-words + **Gemini real** (`gemini-embedding-001`, 768 dims). |
| Vector store / pgvector | `app/rag/vector_store.py` · `app/rag/pgvector.py` | Almacén en memoria (mock) y **retriever real Supabase pgvector** (RPC `match_documents`, coseno HNSW). |
| Ingesta | `app/rag/ingestion.py` · `app/rag/ingest_pgvector.py` | Pipeline carga → troceado → embeddings; ingesta a pgvector (corpus + entradas). |
| Retriever | `app/rag/retriever.py` | Indexa por fragmentos + recuperación top-k. |
| LLM | `app/rag/llm.py` | Mock anclado al contexto + **Gemini**/OpenAI/Anthropic reales (import perezoso). |
| Proveedores | `app/rag/providers.py` | Selecciona mock vs reales; `RagProviderError` accionable. |
| Motor | `app/rag/engine.py` | Orquesta guardrails → recuperación → lugares (solo relevantes) → generación → ruta. |
| Tooling de conocimiento | `app/rag/find_gaps.py` · `app/rag/upload_entries.py` | Detecta lugares del mapa sin descripción, redacta borradores (Gemini) y sube los aprobados a Supabase. |
| Endpoint | `app/api/chat.py` | `POST /api/chat` conectado al motor (errores → 503). |
| Pruebas | `tests/` | 76 tests (guardrails, retriever, ingesta, pgvector, proveedores, motor, enrutamiento, entradas, endpoint); `conftest.py` fuerza modo mock (hermético). |

---

## 🔗 Conexión con el chat (frontend ya cableado)

Se implementó **exactamente el contrato** que el frontend consume en
`services/api/chatApi.ts`:

```
POST /api/chat   { "query": string }
              →  { "answer": string, "locations": [{ id, name, schedule? }],
                   "draw_route": bool, "destination": Coordinate? }
```

Los `id` de `locations` coinciden con `CAMPUS_PLACES` del front, de modo que el botón
**"Ver en mapa"** funciona sin cambios. **El frontend ya apunta al backend por defecto**
(`Config.api.baseUrl` → backend de Render; el mock del chat solo se activa con
`EXPO_PUBLIC_USE_MOCK_CHAT=true`). Pendiente en el front: consumir `draw_route`/
`destination` para trazar la ruta en el mapa automáticamente.

---

## 🧠 Decisiones clave

1. **Mock-first / proveedores enchufables.** El motor define interfaces
   (`EmbeddingProvider`, `LLMProvider`) con implementaciones mock por defecto. Esto refleja
   el patrón `useMock` del frontend y permite probar el RAG sin LLM ni base vectorial.
2. **SDKs del LLM, `llama-index` y `supabase` quedan opcionales** (`requirements-rag.txt`).
   Algunos paquetes pesados pueden no tener wheels para versiones muy nuevas de Python; el
   núcleo solo necesita `fastapi` + `pydantic` (Python 3.11+), garantizando que **todo corre
   y se testea ya**. Los proveedores reales se importan de forma perezosa.
3. **Recuperación exacta por léxico** (bag-of-words ajustado al corpus) en vez de hashing,
   para que los resultados de prueba sean correctos y predecibles.
4. **Respuestas ancladas al contexto** en el LLM mock: nunca responde de "su" conocimiento,
   respetando el principio anti-alucinación del RAG (HU-2.2).

---

## 🧪 Resultado de las pruebas

```
76 passed
```

Corren siempre en **modo mock** (deterministas, sin red, vía `tests/conftest.py`).
Cubren: alcance in/out de los guardrails, que el retriever devuelve el documento correcto,
el pipeline completo (respuesta con lugar, fuera de alcance, sin información), la detección
de lugares relevantes, la recuperación con pgvector (matcher inyectado, sin red), las
entradas de conocimiento, la selección de proveedores y el endpoint HTTP.

Ejemplos verificados:
- *"¿a qué hora abre la biblioteca?"* → horario + `location: biblioteca-central` (sin lugares incidentales).
- *"dame una receta de ceviche"* → declina (fuera de alcance), sin lugares.
- *"cómo contacto al decanato"* → "No tengo esa información oficial" (in-scope sin datos).

---

## ✅ Hecho en esta iteración

1. **Pipeline de ingesta** (`app/rag/ingestion.py`): carga, troceado con solapamiento y
   embeddings; el retriever indexa por fragmentos (HU-2.2).
2. **Proveedores reales** (`app/rag/providers.py` + `llm.py`): LLM OpenAI/Anthropic con import
   perezoso y errores accionables; retriever local como respaldo. Mock sigue por defecto.
3. **Enrutamiento automático (HU-2.3)**: `ChatResponse` ahora lleva `draw_route` + `destination`;
   el motor detecta intención de navegación.
4. **Guardrails + errores (HU-2.4)**: alcance por límite de palabra; el endpoint responde 503
   ante proveedores mal configurados.

## ✅ Nuevo desde entonces

- **Corpus oficial real** (37 lugares + 41 docs desde `sources/unmsm_info.md`).
- **LLM real (Gemini)** activado y desplegado en Render (`RAG_USE_MOCK=false`).
- **Recuperación semántica con pgvector** (Supabase + embeddings Gemini `gemini-embedding-001`,
  768 dims, coseno HNSW; RPC `match_documents`). Cae con gracia a recuperación local sin Supabase.
- **Umbral de score** recalibrado para embeddings densos (`RAG_SCORE_THRESHOLD=0.55`; el antiguo
  0.12 era para bag-of-words).
- **Modelo de entradas de conocimiento**: `find_gaps` detecta lugares del mapa sin descripción y
  redacta borradores anclados con Gemini; `upload_entries` sube los aprobados a Supabase; el
  respaldo versionado vive en `app/knowledge/entries/`. Hoy Supabase tiene **55 filas** (48 del
  corpus base + 7 lugares agregados: rectorado, clínica de odontología y 5 cafeterías).
- **Frontend cableado**: la app consume el backend de Render por defecto.
- **Lugares relevantes**: el chat ya no arrastra menciones incidentales.

## 🚧 Próximos pasos

1. **Consumo del enrutamiento en el frontend**: leer `draw_route`/`destination` en el chat y
   trazar la `polyline` en el mapa (cierra HU-2.3).
2. **Ampliar el corpus**: seguir cerrando gaps de lugares del mapa con `find_gaps`/`upload_entries`.

---

## ▶️ Cómo probarlo (resumen)

```bash
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
pytest                       # corre los 76 tests (modo mock, sin red)
# Para LLM real en local: pip install -r requirements-llm.txt y crea .env
# (RAG_USE_MOCK=false, LLM_PROVIDER=gemini, LLM_API_KEY=...); .env está gitignoreado.
# Para pgvector: pip install -r requirements-pgvector.txt y define SUPABASE_URL/SUPABASE_SERVICE_KEY.
uvicorn app.main:app --reload   # levanta la API en http://localhost:8000
```
