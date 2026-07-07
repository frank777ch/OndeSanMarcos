# 1. Arquitectura general

Este documento describe la arquitectura de **OndeSanMarcos** de extremo a extremo: qué piezas existen, **cómo se conecta el frontend con el backend**, qué servicios viven en cada lado y cómo se despliega todo.

---

## 1.1 Visión de alto nivel (diagrama de contexto)

El sistema tiene un **cliente móvil** (React Native) que se comunica con tres proveedores externos: **Supabase** (autenticación + base de conocimiento), el **Backend propio** (asistente IA) y **Mapbox** (mapas). El backend, a su vez, consume un **proveedor LLM** para generar las respuestas del asistente.

```mermaid
graph TD
    user(["Usuario UNMSM<br/>ingresante · estudiante · visitante"])

    subgraph client["Cliente móvil — OndeSanMarcos"]
        app["App React Native + Expo<br/>(Android / iOS)"]
    end

    subgraph cloud["Servicios en la nube"]
        supabase["Supabase<br/>Auth + Postgres + pgvector"]
        backend["Backend API<br/>FastAPI (asistente IA)"]
        mapbox["Mapbox<br/>teselas + estilos 3D"]
        llm["Proveedor LLM<br/>generación de lenguaje"]
    end

    user -->|usa| app
    app -->|"login / sesión (SDK)"| supabase
    app -->|"consultas del chat (HTTPS/JSON)"| backend
    app -->|"render de mapa 3D (SDK)"| mapbox
    backend -->|"recupera contexto (pgvector)"| supabase
    backend -->|"prompt + contexto"| llm

    classDef ext fill:#eef2ff,stroke:#3b5bdb,color:#1e293b;
    classDef cli fill:#e6fffa,stroke:#0d9488,color:#1e293b;
    class supabase,backend,mapbox,llm ext;
    class app cli;
```

> **Nota de estado:** este diagrama ya es el estado **real**. El backend está **desplegado en Render** con **LLM real (Gemini)** y **recuperación semántica con Supabase pgvector** (embeddings Gemini). El **cliente consume el backend por defecto** (`Config.api.baseUrl` → URL de Render; el mock del chat solo se fuerza con `EXPO_PUBLIC_USE_MOCK_CHAT=true`). Ver [§1.7](#17-vista-completa-implementado-vs-planificado) y [07-avance-backend](./07-avance-backend.md).

---

## 1.2 Arquitectura por capas (frontend ↔ backend)

Vista de "contenedores": los módulos internos de cada lado y el **contrato** que los une (`POST /api/chat`).

```mermaid
graph LR
    subgraph FE["FRONTEND — React Native"]
        direction TB
        ui["UI / Pantallas<br/>auth · map · chat · profile"]
        state["Estado global (Zustand)<br/>useAuthStore · useChatStore · useMapStore"]
        svc["Capa de servicios<br/>apiClient · chatApi · supabase"]
        ui --> state
        ui --> svc
        state --> svc
    end

    subgraph BE["BACKEND — FastAPI"]
        direction TB
        api["Routers / Endpoints<br/>/api/chat · /health"]
        guard["Guardrails<br/>(léxico + raíces + system prompt)"]
        rag["Motor RAG propio<br/>retriever + generación"]
        emb["Embeddings Gemini<br/>+ LLM Gemini"]
        api --> guard --> rag --> emb
    end

    subgraph DATA["DATOS"]
        direction TB
        auth["Supabase Auth"]
        vector["Supabase Postgres<br/>+ pgvector (documents)"]
    end

    svc -->|"SDK supabase-js"| auth
    svc -->|"POST /api/chat { query }"| api
    rag -->|"match_documents (coseno)"| vector
    mapbox["Mapbox SDK"]
    ui -->|render| mapbox

    classDef be fill:#fff7ed,stroke:#ea580c,color:#1e293b;
    classDef data fill:#eef2ff,stroke:#3b5bdb,color:#1e293b;
    class api,rag,guard,emb be;
    class auth,vector data;
```

### Servicios en cada lado

| Lado         | Servicio / Módulo                        | Responsabilidad                                                     | Estado                       |
| ------------ | ---------------------------------------- | ------------------------------------------------------------------- | ---------------------------- |
| **Frontend** | `services/supabase/auth.service`         | signUp, signIn, signOut, sesión, listener de auth.                  | ✅                           |
| **Frontend** | `services/supabase/client`               | Cliente Supabase con persistencia en AsyncStorage.                  | ✅                           |
| **Frontend** | `services/api/client` (`apiClient`)      | Wrapper `fetch` genérico (GET/POST, JSON, errores).                 | ✅                           |
| **Frontend** | `services/api/chatApi` (`sendChatQuery`) | Llama `POST /api/chat` con `{ query }`.                             | ✅ (consume el backend real) |
| **Backend**  | Router `/api/chat`                       | Recibe la consulta, orquesta RAG, responde `{ answer, locations, draw_route, destination }`. | ✅                 |
| **Backend**  | Guardrails                               | Limita el alcance a temas UNMSM (HU-2.4).                           | ✅                           |
| **Backend**  | Motor RAG propio                         | Recupera fragmentos relevantes (pgvector) y genera la respuesta (Gemini). | ✅                    |
| **Datos**    | Supabase Auth                            | Usuarios, verificación por correo, sesiones JWT.                    | ✅                           |
| **Datos**    | Supabase Postgres + `pgvector`           | Documentos institucionales + embeddings Gemini (tabla `documents`). | ✅                          |

---

## 1.3 El contrato Frontend ↔ Backend

La frontera entre app y backend es **un único endpoint HTTP**. El cliente ya lo consume (`chatApi.ts`) apuntando por defecto al backend desplegado en Render; el modo mock del chat solo se activa manualmente (`EXPO_PUBLIC_USE_MOCK_CHAT=true`).

**Petición**

```http
POST {EXPO_PUBLIC_API_URL}/api/chat
Content-Type: application/json

{ "query": "¿Cómo llego al Rectorado?" }
```

**Respuesta esperada** (tipada en el front como `ChatResponse`)

```jsonc
{
  "answer": "El Rectorado está en la zona central del campus...",
  "locations": [
    {
      "id": "rectorado",
      "name": "Rectorado",
      "schedule": "Lun–Vie 8:00–17:00",
    },
  ],
}
```

> **Enrutamiento (HU-2.3):** la respuesta ya incorpora el flag `draw_route` y las coordenadas `destination` para las consultas de navegación. Falta que el **frontend** las consuma para cambiar a la pestaña del Mapa y trazar la ruta automáticamente. Ver [05-flujos](./05-flujos.md#54-enrutamiento-automático-chat--mapa).

---

## 1.4 Diagrama de despliegue

Dónde corre cada componente en producción.

```mermaid
graph TB
    subgraph device["Dispositivo del usuario"]
        binary["App OndeSanMarcos<br/>(build EAS: APK/IPA)"]
    end

    subgraph eas["Expo / EAS"]
        build["EAS Build<br/>(compilación nativa en la nube)"]
    end

    subgraph host["Hosting del backend"]
        fastapi["FastAPI + Uvicorn<br/>(contenedor)"]
    end

    subgraph saas["SaaS gestionado"]
        sb["Supabase<br/>Auth + DB + pgvector"]
        mb["Mapbox<br/>tiles API"]
        llmapi["LLM API"]
    end

    build -.->|genera| binary
    binary -->|HTTPS| fastapi
    binary -->|HTTPS SDK| sb
    binary -->|HTTPS SDK| mb
    fastapi -->|SQL / REST| sb
    fastapi -->|HTTPS| llmapi

    classDef saas fill:#eef2ff,stroke:#3b5bdb,color:#1e293b;
    class sb,mb,llmapi saas;
```

**Notas de despliegue**

- La app se compila con **EAS Build** (`eas.json`, `projectId` en `app.config.ts`) porque `@rnmapbox/maps` incluye código nativo y **no funciona en Expo Go**.
- La configuración sensible viaja por **variables de entorno** `EXPO_PUBLIC_*` (ver [02-frontend §2.6](./02-frontend.md#26-configuración-y-variables-de-entorno)).
- El backend es un servicio HTTP independiente; puede desplegarse en cualquier host de contenedores.

---

## 1.5 Ciclo de vida de una consulta (extremo a extremo)

Cómo viaja una pregunta del usuario por toda la pila en la arquitectura objetivo (con backend real):

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant C as App (ChatScreen)
    participant H as useChat (hook)
    participant A as chatApi / apiClient
    participant B as Backend FastAPI
    participant V as Supabase pgvector
    participant L as LLM

    U->>C: Escribe "¿Cómo llego al Rectorado?"
    C->>H: sendMessage()
    H->>A: sendChatQuery(query)
    A->>B: POST /api/chat { query }
    B->>B: Guardrails (¿es tema UNMSM?)
    B->>V: similarity search (embedding de la query)
    V-->>B: fragmentos relevantes (top-k)
    B->>L: prompt = system + contexto + query
    L-->>B: respuesta en lenguaje natural
    B-->>A: { answer, locations }
    A-->>H: ChatResponse
    H->>C: addMessage(assistant)
    C-->>U: Burbuja + tarjetas "Ver en mapa"
```

> En **modo mock** los pasos 4–11 se reemplazan por `mockChatQuery()`, que empareja la consulta contra `CAMPUS_PLACES` localmente. Ver [05-flujos §5.3](./05-flujos.md#53-conversación-con-el-asistente).

---

## 1.6 Decisiones de arquitectura (resumen)

| Decisión                                  | Motivo                                                                     |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| **Arquitectura por features** en el front | Escala por dominio (auth/map/chat) y aísla responsabilidades.              |
| **Zustand** en vez de Redux               | Mínimo boilerplate; selectores simples; persistencia con middleware.       |
| **Supabase como BaaS**                    | Auth + Postgres + `pgvector` en un solo servicio con tier gratuito.        |
| **RAG con motor propio + pgvector**       | Respuestas ancladas a documentos oficiales → evita alucinaciones (HU-2.2). |
| **Backend separado para el LLM**          | Oculta llaves del LLM y centraliza guardrails fuera del cliente.           |
| **Modo mock conmutable**                  | Permite avanzar la UI del chat sin depender del backend.                   |

---

## 1.7 Vista completa: implementado vs. planificado

Una sola vista de todo el sistema (app móvil + backend + servicios externos) con
el **estado real de cada componente**. Verde sólido = implementado; gris punteado
= planificado / no implementado todavía.

```mermaid
graph TB
    user(["Usuario UNMSM"])

    subgraph app["App móvil — React Native + Expo"]
        direction TB
        onb["Onboarding + Auth (Supabase)"]:::done
        tabs["MainTabs: Mapa · Asistente · Perfil"]:::done
        map3d["Mapa 3D Mapbox<br/>POIs · cámara · avatar"]:::done
        chatui["UI Chat (consume backend real)"]:::done
        stores["Estado Zustand (auth/chat/map)"]:::done
        c2m["Chat→Mapa: consumir draw_route"]:::planned
        route["Motor de rutas (polyline A→B)"]:::planned
        sensors["Avatar + brújula (magnetómetro)"]:::planned
    end

    subgraph be["Backend FastAPI — desplegado en Render (LLM real)"]
        direction TB
        api["POST /api/chat · /health"]:::done
        guard["Guardrails (léxico + raíces)"]:::done
        engine["Motor RAG propio"]:::done
        ingest["Ingesta a pgvector (corpus + entradas)"]:::done
        pgr["Retriever pgvector<br/>(embeddings Gemini)"]:::done
        realllm["LLM real Gemini"]:::done
        prov["Selección de proveedores"]:::done
        tooling["Tooling: find_gaps · upload_entries"]:::done
    end

    subgraph cloud["Servicios externos"]
        sbauth["Supabase Auth"]:::done
        mapbox["Mapbox SDK"]:::done
        sbvec["Supabase pgvector (documents)"]:::done
        llmapi["Gemini (Google AI Studio)"]:::done
    end

    subgraph leg["Leyenda"]
        L1["Implementado"]:::done
        L2["Planificado / no implementado"]:::planned
    end

    user --> app
    onb --> sbauth
    map3d --> mapbox
    chatui --> stores
    chatui -->|"POST /api/chat"| api
    api --> guard --> engine
    engine --> prov
    prov --> pgr --> sbvec
    prov --> realllm --> llmapi
    ingest --> sbvec
    tooling --> sbvec
    c2m -.-> map3d
    route -.-> map3d

    classDef done fill:#dcfce7,stroke:#16a34a,color:#14532d;
    classDef planned fill:#f1f5f9,stroke:#94a3b8,stroke-dasharray:5 5,color:#64748b;
```

> El backend está completo y en producción (LLM real Gemini + recuperación con
> pgvector). Lo punteado que resta es del **frontend/mapa**: consumir el
> enrutamiento (`draw_route`) en el mapa, el motor de rutas y los sensores del
> avatar. Estado por historia en [06-backlog-y-roadmap §6.3](./06-backlog-y-roadmap.md#63-historias-de-usuario-y-estado).
