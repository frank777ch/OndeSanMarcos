# 3. Backend y RAG

> **Estado:** el backend está **en producción** (`POST /api/chat` desplegado en Render) con **LLM real (Gemini)** y **recuperación semántica con Supabase pgvector** (embeddings Gemini). El modo mock persiste para los tests. Este documento describe la arquitectura conceptual; para el detalle de **lo que existe en el código** y cómo correrlo, ver [07-avance-backend](./07-avance-backend.md).

El asistente responde **solo con información oficial de la UNMSM**. Para lograrlo se usa **RAG (Retrieval-Augmented Generation)**: en vez de dejar que el modelo "invente", primero se **recuperan** fragmentos de documentos institucionales y luego se le pide al LLM que **genere** la respuesta usando ese contexto.

---

## 3.1 ¿Por qué RAG?

| Problema sin RAG                                        | Solución con RAG                                          |
| ------------------------------------------------------- | --------------------------------------------------------- |
| El LLM alucina datos (horarios, oficinas inexistentes). | Las respuestas se anclan a documentos reales (HU-2.2).    |
| El conocimiento del modelo está congelado.              | Se actualiza agregando documentos a la base vectorial.    |
| No hay forma de citar la fuente.                        | Cada respuesta se construye desde fragmentos recuperados. |

```mermaid
graph LR
    q["Consulta del usuario"] --> r["RECUPERACIÓN<br/>busca fragmentos relevantes<br/>en la base de conocimiento"]
    r --> a["AUMENTACIÓN<br/>arma el prompt:<br/>system + contexto + consulta"]
    a --> g["GENERACIÓN<br/>el LLM redacta la respuesta<br/>usando solo ese contexto"]
    g --> resp["Respuesta confiable<br/>+ lugares relacionados"]

    classDef step fill:#fff7ed,stroke:#ea580c,color:#1e293b;
    class r,a,g step;
```

---

## 3.2 Arquitectura del backend (FastAPI)

```mermaid
graph TD
    subgraph fastapi["Backend FastAPI"]
        direction TB
        router["Routers<br/>/api/chat · /health"]
        schema["Schemas (Pydantic)<br/>ChatRequest · ChatResponse"]
        guard["Guardrails<br/>léxico + raíces + system prompt"]
        engine["Motor RAG propio<br/>retriever + orquestación"]
        embed["Embeddings Gemini<br/>gemini-embedding-001 (768d)"]
        router --> schema
        router --> guard
        guard --> engine
        engine --> embed
    end

    subgraph supa["Supabase"]
        vstore["Postgres + pgvector<br/>tabla documents(embedding vector(768))<br/>RPC match_documents (coseno HNSW)"]
    end

    llm["Gemini (gemini-2.5-flash)"]

    engine -->|"match_documents (coseno)"| vstore
    engine -->|"prompt final"| llm
    client["App React Native"] -->|"POST /api/chat"| router

    classDef ext fill:#eef2ff,stroke:#3b5bdb,color:#1e293b;
    class vstore,llm ext;
```

| Componente                  | Responsabilidad                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------- |
| **Routers**                 | Exponen los endpoints HTTP (`/api/chat`, `/health`).                               |
| **Schemas (Pydantic)**      | Validan y tipan request/response.                                                  |
| **Guardrails**              | Aplican el filtro de alcance (léxico + raíces) y el _system prompt_ (HU-2.4).      |
| **Motor RAG propio**        | Recupera contexto y coordina la llamada al LLM.                                    |
| **Embeddings Gemini**       | Convierten texto en vectores (`gemini-embedding-001`, 768 dims) para la búsqueda.  |
| **pgvector**                | Almacena e indexa los embeddings (tabla `documents`, índice HNSW coseno).          |

---

## 3.3 Pipeline de ingesta (offline)

Proceso **previo y periódico** que alimenta la base de conocimiento. No ocurre durante la conversación.

```mermaid
flowchart TD
    docs["Corpus oficial UNMSM<br/>(sources/unmsm_info.md + entradas aprobadas)"]
    load["1 · Carga<br/>(load_documents)"]
    chunk["2 · Troceado<br/>(split_documents, con solapamiento)"]
    emb["3 · Embeddings Gemini<br/>(gemini-embedding-001, por fragmento)"]
    store["4 · Almacenamiento<br/>(insert en Supabase pgvector)"]
    idx["5 · Índice HNSW listo<br/>para búsqueda semántica"]

    docs --> load --> chunk --> emb --> store --> idx

    classDef io fill:#ecfeff,stroke:#0891b2,color:#1e293b;
    class docs,idx io;
```

> En el código, `python -m app.rag.ingest_pgvector` reconstruye la base (corpus +
> entradas aprobadas → pgvector). Para sumar lugares del mapa que aún no están en el
> corpus, `find_gaps` redacta borradores anclados (Gemini) y `upload_entries` sube los
> aprobados. Agregar información no cambia la app (objetivo del [Product Vision Board](./06-backlog-y-roadmap.md)).

---

## 3.4 Pipeline de consulta (online, en cada pregunta)

```mermaid
sequenceDiagram
    autonumber
    participant C as App
    participant API as FastAPI /api/chat
    participant G as Guardrails
    participant E as Motor RAG propio
    participant EMB as Embeddings Gemini
    participant V as Supabase pgvector
    participant L as LLM Gemini

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

> La implementación **aplana** este modelo en **una sola tabla** `documents` con columnas `content`, `metadata (jsonb)` y `embedding (vector(768))`, más la función RPC `match_documents` (similitud coseno, índice HNSW). El esquema real está en `backend/db/schema.sql`; ver [09-pgvector-supabase](./09-pgvector-supabase.md). El diagrama anterior muestra el modelo conceptual.

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

| Método | Ruta        | Body                  | Respuesta                                                                              |
| ------ | ----------- | --------------------- | -------------------------------------------------------------------------------------- |
| `POST` | `/api/chat` | `{ "query": string }` | `{ "answer": string, "locations": LocationResult[], "draw_route": bool, "destination": Coordinate? }` |
| `GET`  | `/health`   | —                     | `{ "status": "ok", "service": string, "version": string }`                             |

`LocationResult` (compartido con el frontend, ver [04-modelo-de-datos](./04-modelo-de-datos.md)):

```ts
interface LocationResult {
  id: string; // ej. "rectorado"
  name: string; // ej. "Rectorado"
  schedule?: string; // ej. "Lun–Vie 8:00–17:00"
}
```

### Enrutamiento automático (HU-2.3 — ya en el contrato)

La respuesta **ya** incluye los campos de enrutamiento para consultas de navegación:

```jsonc
{
  "answer": "Te llevo al Rectorado.",
  "locations": [{ "id": "rectorado", "name": "Rectorado" }],
  "draw_route": true,
  "destination": { "latitude": -12.0578, "longitude": -77.084 },
}
```

`draw_route` se activa solo cuando hay intención de navegación **y** un lugar detectado. Falta que el **frontend** consuma `draw_route`/`destination` para cambiar a la pestaña Mapa y trazar el camino. Ver [05-flujos §5.4](./05-flujos.md#54-enrutamiento-automático-chat--mapa).

---

## 3.8 Cómo levantar el backend (referencia)

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

> Variables sensibles (URL de Supabase, llave de servicio, API key del LLM) deben ir en variables de entorno del backend, **nunca** en el cliente móvil.
