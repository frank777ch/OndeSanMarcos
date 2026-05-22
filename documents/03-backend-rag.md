# 3. Backend y RAG

> **Estado:** el backend está **planificado**. Hoy solo existe `backend/requirements.txt` con las dependencias base (`fastapi`, `uvicorn`, `supabase`, `llama-index`). Este documento define la **arquitectura objetivo** del asistente IA para que sea fácil de visualizar y construir.

El asistente responde **solo con información oficial de la UNMSM**. Para lograrlo se usa **RAG (Retrieval-Augmented Generation)**: en vez de dejar que el modelo "invente", primero se **recuperan** fragmentos de documentos institucionales y luego se le pide al LLM que **genere** la respuesta usando ese contexto.

---

## 3.1 ¿Por qué RAG?

| Problema sin RAG | Solución con RAG |
|------------------|------------------|
| El LLM alucina datos (horarios, oficinas inexistentes). | Las respuestas se anclan a documentos reales (HU-2.2). |
| El conocimiento del modelo está congelado. | Se actualiza agregando documentos a la base vectorial. |
| No hay forma de citar la fuente. | Cada respuesta se construye desde fragmentos recuperados. |

```mermaid
graph LR
    q["❓ Consulta del usuario"] --> r["🔍 RECUPERACIÓN<br/>busca fragmentos relevantes<br/>en la base de conocimiento"]
    r --> a["✍️ AUMENTACIÓN<br/>arma el prompt:<br/>system + contexto + consulta"]
    a --> g["🤖 GENERACIÓN<br/>el LLM redacta la respuesta<br/>usando solo ese contexto"]
    g --> resp["✅ Respuesta confiable<br/>+ lugares relacionados"]

    classDef step fill:#fff7ed,stroke:#ea580c,color:#1e293b;
    class r,a,g step;
```

---

## 3.2 Arquitectura del backend (FastAPI)

```mermaid
graph TD
    subgraph fastapi["⚙️ Backend FastAPI"]
        direction TB
        router["Routers<br/>/api/chat · /health"]
        schema["Schemas (Pydantic)<br/>ChatRequest · ChatResponse"]
        guard["Guardrails<br/>system prompt + filtro de alcance"]
        engine["RAG Engine (LlamaIndex)<br/>retriever + query engine"]
        embed["Embeddings<br/>(modelo de vectorización)"]
        router --> schema
        router --> guard
        guard --> engine
        engine --> embed
    end

    subgraph supa["🗄️ Supabase"]
        vstore["Postgres + pgvector<br/>tabla documents(embedding)"]
    end

    llm["🤖 Proveedor LLM"]

    engine -->|"similarity search"| vstore
    engine -->|"prompt final"| llm
    client["📱 App React Native"] -->|"POST /api/chat"| router

    classDef ext fill:#eef2ff,stroke:#3b5bdb,color:#1e293b;
    class vstore,llm ext;
```

| Componente | Responsabilidad |
|------------|-----------------|
| **Routers** | Exponen los endpoints HTTP (`/api/chat`, `/health`). |
| **Schemas (Pydantic)** | Validan y tipan request/response. |
| **Guardrails** | Aplican el *system prompt* y descartan consultas fuera del dominio UNMSM (HU-2.4). |
| **RAG Engine (LlamaIndex)** | Recupera contexto y coordina la llamada al LLM. |
| **Embeddings** | Convierten texto en vectores para la búsqueda semántica. |
| **pgvector** | Almacena e indexa los embeddings de los documentos. |

---

## 3.3 Pipeline de ingesta (offline)

Proceso **previo y periódico** que alimenta la base de conocimiento. No ocurre durante la conversación.

```mermaid
flowchart TD
    docs["📄 Documentos oficiales UNMSM<br/>(PDF, web, reglamentos, horarios)"]
    load["1 · Carga<br/>(LlamaIndex readers)"]
    chunk["2 · Troceado<br/>(chunking en fragmentos)"]
    emb["3 · Embeddings<br/>(vectorización de cada fragmento)"]
    store["4 · Almacenamiento<br/>(insert en pgvector)"]
    idx["5 · Índice listo<br/>para búsqueda semántica"]

    docs --> load --> chunk --> emb --> store --> idx

    classDef io fill:#ecfeff,stroke:#0891b2,color:#1e293b;
    class docs,idx io;
```

> Agregar nueva información institucional = volver a correr la ingesta con los documentos nuevos. La app no cambia (objetivo de negocio del [Product Vision Board](./06-backlog-y-roadmap.md)).

---

## 3.4 Pipeline de consulta (online, en cada pregunta)

```mermaid
sequenceDiagram
    autonumber
    participant C as 📱 App
    participant API as FastAPI /api/chat
    participant G as Guardrails
    participant E as RAG Engine (LlamaIndex)
    participant EMB as Embeddings
    participant V as pgvector
    participant L as LLM

    C->>API: POST { query }
    API->>G: validar alcance (¿tema UNMSM?)
    alt fuera de contexto
        G-->>C: { answer: "No tengo esa información oficial", locations: [] }
    else dentro de contexto
        G->>E: query
        E->>EMB: vectorizar(query)
        EMB-->>E: embedding
        E->>V: similarity search (top-k)
        V-->>E: fragmentos relevantes
        E->>L: system prompt + contexto + query
        L-->>E: respuesta en lenguaje natural
        E-->>API: answer + lugares detectados
        API-->>C: { answer, locations }
    end
```

---

## 3.5 Modelo de datos de la base de conocimiento (pgvector)

Esquema mínimo propuesto para Supabase:

```mermaid
erDiagram
    DOCUMENT ||--o{ CHUNK : "se trocea en"
    CHUNK ||--|| EMBEDDING : "tiene"

    DOCUMENT {
        uuid id PK
        text source "origen (PDF/URL)"
        text title
        timestamptz created_at
    }
    CHUNK {
        uuid id PK
        uuid document_id FK
        text content "fragmento de texto"
        int  position
    }
    EMBEDDING {
        uuid   id PK
        uuid   chunk_id FK
        vector embedding "pgvector (n dimensiones)"
    }
```

> En la práctica con LlamaIndex + Supabase suele usarse **una sola tabla** (p. ej. `documents`) con columnas `content`, `metadata (jsonb)` y `embedding (vector)`. El diagrama anterior muestra el modelo conceptual; la implementación puede aplanarlo.

---

## 3.6 Guardrails (HU-2.4)

Para evitar el uso indebido de la API del LLM, el backend restringe el alcance del asistente:

```mermaid
flowchart TD
    q["Consulta entrante"] --> check{"¿Relacionada con la UNMSM?<br/>(system prompt + heurística)"}
    check -->|No| decline["Declina amablemente:<br/>'Solo puedo ayudarte con temas de la UNMSM'"]
    check -->|Sí| rag["Continúa al pipeline RAG"]
    rag --> found{"¿Hay contexto relevante?"}
    found -->|No| nodata["'No tengo esa información oficial'"]
    found -->|Sí| answer["Respuesta basada en documentos"]
```

---

## 3.7 Contrato de la API

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| `POST` | `/api/chat` | `{ "query": string }` | `{ "answer": string, "locations": LocationResult[] }` |
| `GET`  | `/health` | — | `{ "status": "ok" }` |

`LocationResult` (compartido con el frontend, ver [04-modelo-de-datos](./04-modelo-de-datos.md)):

```ts
interface LocationResult {
  id: string;        // ej. "rectorado"
  name: string;      // ej. "Rectorado"
  schedule?: string; // ej. "Lun–Vie 8:00–17:00"
}
```

### Evolución (HU-2.3 — enrutamiento automático)

La respuesta crecerá para soportar el dibujo automático de rutas:

```jsonc
{
  "answer": "Te llevo al Rectorado.",
  "locations": [ { "id": "rectorado", "name": "Rectorado" } ],
  "draw_route": true,
  "destination": { "latitude": -12.0578, "longitude": -77.084 }
}
```

El frontend detectará `draw_route` para cambiar a la pestaña Mapa y trazar el camino. Ver [05-flujos §5.4](./05-flujos.md#54-enrutamiento-automático-chat--mapa).

---

## 3.8 Cómo levantar el backend (referencia)

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload    # cuando exista main.py
```

> Variables sensibles (URL de Supabase, llave de servicio, API key del LLM) deben ir en variables de entorno del backend, **nunca** en el cliente móvil.
