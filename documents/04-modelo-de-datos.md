# 4. Modelo de datos

Diagramas de clases del dominio, de los stores de estado (Zustand) y de las entidades persistidas. Todo refleja el código actual en `frontend/src`.

---

## 4.1 Dominio del Chat

Tipos definidos en `src/features/chat/types/index.ts`.

```mermaid
classDiagram
    class Conversation {
        +string id
        +string title
        +Message[] messages
        +string createdAt
        +string updatedAt
    }

    class Message {
        +string id
        +Role role
        +string content
        +Date timestamp
        +LocationResult[] locations
        +bool isError
        +string failedQuery
    }

    class LocationResult {
        +string id
        +string name
        +string schedule
    }

    class ChatResponse {
        +string answer
        +LocationResult[] locations
    }

    class Role {
        <<enumeration>>
        user
        assistant
    }

    class ChatState {
        <<enumeration>>
        idle
        asking
        answered
    }

    Conversation "1" o-- "*" Message : messages
    Message "1" o-- "*" LocationResult : locations
    Message --> Role
    ChatResponse "1" o-- "*" LocationResult : locations
```

- `ChatResponse` es lo que devuelve `/api/chat` (o el mock). Sus `locations` se copian al `Message` del assistant.
- `failedQuery` guarda la consulta original para el botón **Reintentar**.

---

## 4.2 Dominio del Mapa

Tipos en `src/features/map/constants/unmsm.ts`. `CampusPlace` es el puente entre el chat y el mapa.

```mermaid
classDiagram
    class Coordinate {
        +number latitude
        +number longitude
    }

    class CampusPlace {
        +string id
        +string name
        +string schedule
        +string[] keywords
        +Coordinate coordinate
    }

    class UNMSM {
        +Coordinate center
        +Bounds bounds
        +Camera camera
    }

    CampusPlace "1" *-- "1" Coordinate : coordinate
    UNMSM "1" *-- "1" Coordinate : center

    note for CampusPlace "getCampusPlaceById(id) → CampusPlace?\nCAMPUS_PLACES: CampusPlace[]\nUsado por el chat (mockChat) y la integración Chat→Mapa"
```

> `keywords` permite que `mockChat` empareje consultas sin tildes (ej. "comedor" → Comedor Universitario). `UNMSM_POIS` es un `FeatureCollection` GeoJSON aparte, usado por el render 3D del `MapScreen`.

---

## 4.3 Stores de estado (Zustand)

Los tres stores de `src/core/store/`. El `useChatStore` es el único persistido.

```mermaid
classDiagram
    class useAuthStore {
        +User user
        +Session session
        +bool isGuest
        +bool isLoading
        +setSession(session)
        +setGuest(value)
        +setLoading(value)
        +clear()
    }

    class useChatStore {
        +Conversation[] conversations
        +string activeId
        +ChatState chatState
        +string inputText
        +bool isLoading
        +bool hasHydrated
        +addMessage(message)
        +removeMessage(id)
        +startNewConversation()
        +selectConversation(id)
        +deleteConversation(id)
    }

    class useMapStore {
        +Coordinate userLocation
        +number userHeading
        +Coordinate[] activeRoute
        +bool isRouteActive
        +MapMode mapMode
        +Coordinate focusTarget
        +setUserLocation(coord)
        +setUserHeading(heading)
        +setActiveRoute(coords)
        +clearRoute()
        +setMapMode(mode)
        +setFocusTarget(coord)
        +clearFocusTarget()
    }

    class MapMode {
        <<enumeration>>
        free
        guide
    }

    useChatStore "1" o-- "*" Conversation : conversations
    useMapStore --> MapMode
    useMapStore "1" o-- "1" Coordinate : focusTarget
```

| Store | Persistencia | Clave |
|-------|--------------|-------|
| `useAuthStore` | ❌ (refleja Supabase) | — |
| `useChatStore` | ✅ AsyncStorage | `osm-chat-conversations` (solo `conversations`) |
| `useMapStore` | ❌ | — |

`User` y `Session` provienen de `@supabase/supabase-js`.

---

## 4.4 Entidades persistidas

### Local (dispositivo)

```mermaid
erDiagram
    ASYNC_STORAGE ||--o{ CONVERSATION : "osm-chat-conversations"
    CONVERSATION ||--o{ MESSAGE : contiene
    SUPABASE_SESSION }o--|| ASYNC_STORAGE : "token (auto)"

    CONVERSATION {
        string id PK
        string title
        string createdAt
        string updatedAt
    }
    MESSAGE {
        string id PK
        string role
        string content
        date   timestamp
    }
```

- El **historial del chat** se guarda en AsyncStorage (Zustand `persist`).
- La **sesión de Supabase** también se persiste en AsyncStorage (configurado en `services/supabase/client.ts`), lo que mantiene al usuario logueado entre reinicios.

### Remoto (Supabase)

El esquema de la base de conocimiento (documentos + embeddings con `pgvector`) se detalla en [03-backend-rag §3.5](./03-backend-rag.md#35-modelo-de-datos-de-la-base-de-conocimiento-pgvector). La gestión de usuarios la provee **Supabase Auth** (tabla `auth.users` administrada por Supabase).
