# ⚙️ Backend — OndeSanMarcos (Asistente RAG)

API del **asistente IA del campus** basada en **RAG (Retrieval-Augmented Generation)**.
Implementa el endpoint `POST /api/chat` que ya espera el frontend, pero **funciona de
forma totalmente aislada**: el motor RAG corre en *modo mock* (embeddings + LLM
deterministas, sin llaves ni servicios externos), por lo que se puede desarrollar y
probar sin el frontend ni un LLM real.

> Diseño y contexto general: ver [`/documents/03-backend-rag.md`](../documents/03-backend-rag.md).

---

## 🧩 Arquitectura

```
backend/
├── app/
│   ├── main.py            # FastAPI: /health + router del chat
│   ├── config.py          # Settings (pydantic-settings): RAG_USE_MOCK, top_k, umbral...
│   ├── api/chat.py        # POST /api/chat  → motor RAG
│   ├── schemas/chat.py    # ChatRequest / ChatResponse / LocationResult (contrato del front)
│   ├── knowledge/         # base de conocimiento
│   │   ├── places.py      #   lugares del campus (espejo del front)
│   │   └── corpus.py      #   documentos institucionales de ejemplo
│   └── rag/               # motor RAG
│       ├── guardrails.py  #   filtro de alcance UNMSM (HU-2.4)
│       ├── embeddings.py  #   vectorizador mock (bag-of-words)
│       ├── vector_store.py#   almacén vectorial en memoria (coseno)
│       ├── retriever.py   #   ingesta + recuperación top-k
│       ├── llm.py         #   generación mock anclada al contexto
│       └── engine.py      #   orquestación del pipeline
└── tests/                 # pytest (guardrails, retriever, motor, endpoint)
```

Pipeline de una consulta:

```mermaid
flowchart LR
    q["POST /api/chat<br/>{ query }"] --> g{"Guardrails<br/>¿tema UNMSM?"}
    g -->|No| d["Declina"]
    g -->|Sí| r["Retriever<br/>top-k por coseno"]
    r --> p["Detección de lugares<br/>(keywords + docs)"]
    p --> l["LLM<br/>respuesta anclada"]
    l --> resp["{ answer, locations }"]
```

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
  "answer": "La Biblioteca Central Pedro Zulen brinda servicios... Toca \"Ver en mapa\" para ubicarlo.",
  "locations": [
    { "id": "biblioteca-central", "name": "Biblioteca Central Pedro Zulen", "schedule": "Lun–Sáb 8:00–21:00" }
  ]
}
```

### Ejecutar las pruebas

```bash
pytest
```

---

## 🔌 Contrato del chat

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| `POST` | `/api/chat` | `{ "query": string }` | `{ "answer": string, "locations": LocationResult[] }` |
| `GET`  | `/health` | — | `{ "status": "ok", ... }` |

`LocationResult = { id: string, name: string, schedule?: string }` — coincide con
`src/features/chat/types/index.ts` del frontend. **Aún no se conecta** el frontend:
el cliente puede apuntar aquí cuando se decida (apagando su modo mock).

---

## 🔁 Modo mock vs. proveedores reales

Controlado por `RAG_USE_MOCK` (ver `.env.example`):

| | Modo mock (`true`, por defecto) | Modo real (`false`) |
|---|---|---|
| Embeddings | `BagOfWordsEmbedding` (sin deps) | modelo real vía LlamaIndex |
| LLM | `TemplateLLM` (anclado al contexto) | OpenAI / Anthropic |
| Vector store | en memoria | Supabase + `pgvector` |
| Requisitos | `requirements.txt` | + `requirements-rag.txt` y llaves |

Las interfaces (`EmbeddingProvider`, `LLMProvider`, retriever) están pensadas para
que el cambio a proveedores reales se haga en `app/rag/engine.py:build_engine`
sin tocar el resto.
