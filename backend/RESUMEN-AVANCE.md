# 📝 Resumen del avance — Backend RAG

**Fecha:** 25/05/2026 · **Rama:** `pedro-rag-backend` · **Estado:** funcional en modo mock + camino a proveedores reales preparado

> 📖 Guía viva y detallada (cómo correr, activar proveedores reales, contrato y
> próximos pasos) en [`documents/07-avance-backend.md`](../documents/07-avance-backend.md).

---

## 🎯 Objetivo de esta iteración

Comenzar el **backend del asistente IA**, enfocado **solo en el RAG y su conexión con el chat**,
**sin conectar el frontend todavía**. La meta era dejarlo **probable de forma aislada** hasta que
el resto de componentes estén listos.

---

## ✅ Qué se construyó

Un backend **FastAPI** con un **motor RAG completo** que corre sin servicios externos:

| Pieza | Archivo | Qué hace |
|-------|---------|----------|
| App + healthcheck | `app/main.py` | FastAPI, CORS, `/health` y router del chat. |
| Configuración | `app/config.py` | `RAG_USE_MOCK`, `top_k`, umbral, llaves (pydantic-settings). |
| Contrato | `app/schemas/chat.py` | `ChatRequest`, `ChatResponse`, `LocationResult`, `Coordinate` (+ `draw_route`/`destination`). |
| Base de conocimiento | `app/knowledge/` | Lugares del campus (espejo del front) + corpus de documentos. |
| Guardrails | `app/rag/guardrails.py` | Limita el alcance a temas UNMSM por límite de palabra (HU-2.4). |
| Intención | `app/rag/intent.py` | Detecta intención de navegación para el enrutamiento (HU-2.3). |
| Embeddings | `app/rag/embeddings.py` | Vectorizador mock bag-of-words (sin dependencias). |
| Vector store | `app/rag/vector_store.py` | Almacén en memoria con similitud coseno. |
| Ingesta | `app/rag/ingestion.py` | Pipeline carga → troceado → embeddings → almacén. |
| Retriever | `app/rag/retriever.py` | Indexa por fragmentos + recuperación top-k. |
| LLM | `app/rag/llm.py` | Mock anclado al contexto + OpenAI/Anthropic reales (import perezoso). |
| Proveedores | `app/rag/providers.py` | Selecciona mock vs reales; `RagProviderError` accionable. |
| Motor | `app/rag/engine.py` | Orquesta guardrails → recuperación → lugares → generación → ruta. |
| Endpoint | `app/api/chat.py` | `POST /api/chat` conectado al motor (errores → 503). |
| Pruebas | `tests/` | 37 tests (guardrails, retriever, ingesta, proveedores, motor, enrutamiento, endpoint). |

---

## 🔗 Conexión con el chat (sin conectar el front)

Se implementó **exactamente el contrato** que el frontend ya consume en
`services/api/chatApi.ts`:

```
POST /api/chat   { "query": string }
              →  { "answer": string, "locations": [{ id, name, schedule? }] }
```

Los `id` de `locations` coinciden con `CAMPUS_PLACES` del front, de modo que el botón
**"Ver en mapa"** funcionará sin cambios cuando se decida apuntar el cliente a este backend
(basta apagar `EXPO_PUBLIC_USE_MOCK_CHAT`). **Hoy no hay ningún cableado al frontend.**

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
37 passed
```

Cubren: alcance in/out de los guardrails, que el retriever devuelve el documento correcto,
el pipeline completo (respuesta con lugar, fuera de alcance, sin información), y el endpoint
HTTP (forma del contrato, validación de entrada, sin lugares fuera de alcance).

Ejemplos verificados:
- *"¿a qué hora abre la biblioteca?"* → respuesta con horario + `location: biblioteca-central`.
- *"dame una receta de ceviche"* → declina (fuera de alcance), sin lugares.
- *"cómo hago mi matrícula"* → "No tengo esa información oficial" (in-scope sin datos).

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

## 🚧 Próximos pasos

1. **Ingesta a pgvector**: implementar `_build_pgvector_retriever` (tabla `documents` + similitud)
   y poblarla con el pipeline de ingesta.
2. **Embeddings reales** (modelo neuronal) en lugar de bag-of-words.
3. **Conectar el frontend**: consumir `draw_route`/`destination`, apuntar `EXPO_PUBLIC_API_URL`
   a este backend y apagar el mock del chat.

---

## ▶️ Cómo probarlo (resumen)

```bash
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
pytest                       # corre los 13 tests
uvicorn app.main:app --reload   # levanta la API en http://localhost:8000
```
