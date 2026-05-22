# 📝 Resumen del avance — Backend RAG

**Fecha:** 22/05/2026 · **Rama:** `pedro-rag-backend` · **Estado:** funcional en modo aislado (mock)

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
| Contrato | `app/schemas/chat.py` | `ChatRequest`, `ChatResponse`, `LocationResult` (idénticos al front). |
| Base de conocimiento | `app/knowledge/` | Lugares del campus (espejo del front) + corpus de documentos. |
| Guardrails | `app/rag/guardrails.py` | Limita el alcance a temas UNMSM (HU-2.4). |
| Embeddings | `app/rag/embeddings.py` | Vectorizador mock bag-of-words (sin dependencias). |
| Vector store | `app/rag/vector_store.py` | Almacén en memoria con similitud coseno. |
| Retriever | `app/rag/retriever.py` | Ingesta del corpus + recuperación top-k. |
| LLM | `app/rag/llm.py` | Generación mock **anclada al contexto** (no alucina). |
| Motor | `app/rag/engine.py` | Orquesta guardrails → recuperación → lugares → generación. |
| Endpoint | `app/api/chat.py` | `POST /api/chat` conectado al motor. |
| Pruebas | `tests/` | 13 tests (guardrails, retriever, motor, endpoint). |

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
2. **`llama-index` y `supabase` quedan opcionales** (`requirements-rag.txt`). El entorno usa
   Python 3.14, donde paquetes pesados aún pueden no tener wheels; el núcleo solo necesita
   `fastapi` + `pydantic`, garantizando que **todo corre y se testea ya**.
3. **Recuperación exacta por léxico** (bag-of-words ajustado al corpus) en vez de hashing,
   para que los resultados de prueba sean correctos y predecibles.
4. **Respuestas ancladas al contexto** en el LLM mock: nunca responde de "su" conocimiento,
   respetando el principio anti-alucinación del RAG (HU-2.2).

---

## 🧪 Resultado de las pruebas

```
13 passed in ~1.3s
```

Cubren: alcance in/out de los guardrails, que el retriever devuelve el documento correcto,
el pipeline completo (respuesta con lugar, fuera de alcance, sin información), y el endpoint
HTTP (forma del contrato, validación de entrada, sin lugares fuera de alcance).

Ejemplos verificados:
- *"¿a qué hora abre la biblioteca?"* → respuesta con horario + `location: biblioteca-central`.
- *"dame una receta de ceviche"* → declina (fuera de alcance), sin lugares.
- *"cómo hago mi matrícula"* → "No tengo esa información oficial" (in-scope sin datos).

---

## 🚧 Próximos pasos

1. **Proveedores reales** (cuando se decida el LLM): implementar el camino `RAG_USE_MOCK=false`
   en `engine.build_engine` con LlamaIndex + un LLM y embeddings reales.
2. **Ingesta a pgvector**: migrar el corpus de ejemplo a Supabase y reemplazar el vector store
   en memoria por `pgvector` (pipeline de ingesta de `documents/03-backend-rag.md`).
3. **Enrutamiento automático (HU-2.3)**: extender `ChatResponse` con `draw_route` + `destination`.
4. **Conectar el frontend**: apuntar `EXPO_PUBLIC_API_URL` a este backend y apagar el mock del chat.

---

## ▶️ Cómo probarlo (resumen)

```bash
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
pytest                       # corre los 13 tests
uvicorn app.main:app --reload   # levanta la API en http://localhost:8000
```
