# 2. Frontend (React Native)

App móvil construida con **React Native + Expo + TypeScript**, organizada por **features** (dominios) con capas compartidas (`core`, `services`, `shared`).

---

## 2.1 Estructura de carpetas

```
frontend/src/
├── constants/            # Tokens globales y Config (env)
│   └── config.ts         # ← lee variables EXPO_PUBLIC_* (api, mapbox, supabase, mock)
├── core/                 # Núcleo transversal de la app
│   ├── navigation/       # AppNavigator, AuthStack, MainTabs, types
│   ├── providers/        # AuthProvider (bootstrap de sesión)
│   └── store/            # Zustand: useAuthStore, useChatStore, useMapStore, useThemeStore
├── features/             # Dominios funcionales (uno por carpeta)
│   ├── auth/             # Welcome, Login, Register, EmailSent, VerifiedEmail
│   ├── chat/             # Asistente IA: components, hooks, constants, screens, types
│   ├── map/              # Mapa 3D: components, hooks, constants, screens
│   ├── profile/          # Perfil y ajustes
│   └── routing/          # Motor de rutas (hooks y utils para el cálculo de rutas)
├── services/             # Acceso a sistemas externos
│   ├── api/              # client (fetch), chatApi
│   └── supabase/         # client, auth.service
├── shared/               # Reutilizable entre features
│   ├── assets/           # SVGs de ilustraciones
│   ├── components/       # Button, Input, AuthHeader, StepDots, SettingsItem...
│   ├── hooks/
│   └── utils/
├── theme/                # light.ts, dark.ts, colors.ts (tematización)
└── types/                # Declaraciones globales (svg.d.ts)
```

**Convención:** cada feature agrupa su propio `components/`, `hooks/`, `constants/`, `screens/` y `types/`. Lo que se comparte entre features sube a `shared/` o `core/`.

---

## 2.2 Arquitectura por capas

El flujo de dependencias va de **UI → estado → servicios → exterior**. La UI nunca llama directamente a la red: pasa por la capa de servicios.

```mermaid
graph TD
    subgraph L1["1 · Presentación"]
        screens["Screens (features/*/screens)"]
        comps["Components (features/* + shared)"]
    end
    subgraph L2["2 · Lógica de feature"]
        hooks["Hooks (useChat, useMapCamera)"]
    end
    subgraph L3["3 · Estado global"]
        stores["Zustand stores<br/>useAuthStore · useChatStore · useMapStore"]
    end
    subgraph L4["4 · Servicios"]
        api["apiClient + chatApi"]
        sb["supabase client + auth.service"]
    end
    subgraph L5["5 · Exterior"]
        backend["Backend API"]
        supa["Supabase"]
        mapbox["Mapbox SDK"]
    end

    screens --> comps
    screens --> hooks
    hooks --> stores
    hooks --> api
    stores --> sb
    api --> backend
    sb --> supa
    screens --> mapbox

    classDef ext fill:#eef2ff,stroke:#3b5bdb;
    class backend,supa,mapbox ext;
```

---

## 2.3 Navegación

La app arranca en `App.tsx`, que envuelve todo en `AuthProvider` y monta `AppNavigator`. El navegador raíz **decide entre dos mundos** según el estado de autenticación.

```mermaid
graph TD
    app["App.tsx<br/>(carga fuentes + AuthProvider)"] --> nav["AppNavigator"]
    nav -->|"session ≠ null o isGuest"| main["MainTabs (Bottom Tabs)"]
    nav -->|"no autenticado"| auth["AuthStack (Native Stack)"]

    subgraph auth_screens["AuthStack"]
        w["Welcome"] --> lo["Login"]
        w --> re["Register"]
        re --> es["EmailSent"]
        es -.->|"deep link ondesanmarcos://verified-email"| ve["VerifiedEmail"]
    end
    auth --> auth_screens

    subgraph tabs["MainTabs"]
        m["Mapa"]
        c["Asistente"]
        p["Perfil"]
    end
    main --> tabs
```

- **`AuthStack`** (`@react-navigation/native-stack`): Welcome → Login / Register → EmailSent → VerifiedEmail.
- **`MainTabs`** (`@react-navigation/bottom-tabs`): Mapa, Asistente, Perfil.
- **Deep linking**: esquema `ondesanmarcos://` mapeado en `AppNavigator` (clave para la verificación de correo, que vuelve a la app desde el enlace del email).

### Gating de autenticación (máquina de estados)

```mermaid
stateDiagram-v2
    [*] --> Loading: App inicia
    Loading --> Authenticated: getSession() devuelve sesión
    Loading --> Guest: "Continuar como invitado"
    Loading --> Unauthenticated: sin sesión
    Unauthenticated --> Authenticated: login / registro OK
    Unauthenticated --> Guest: invitado
    Authenticated --> Unauthenticated: signOut()
    Guest --> Unauthenticated: signOut()

    Authenticated --> [*]: MainTabs
    Guest --> [*]: MainTabs
```

> `isLoading` arranca en `true`; mientras dura, `AppNavigator` renderiza `null` (evita parpadeo). `AuthProvider` resuelve `getSession()` y se suscribe a `onAuthStateChange`.

---

## 2.4 Gestión de estado (Zustand)

Tres stores independientes, cada uno dueño de su dominio:

```mermaid
graph LR
    subgraph stores["Zustand stores (core/store)"]
        a["useAuthStore<br/>user · session · isGuest · isLoading"]
        ch["useChatStore<br/>conversations · activeId · chatState<br/>persistido en AsyncStorage"]
        mp["useMapStore<br/>userLocation · userHeading · activeRoute<br/>mapMode · focusTarget"]
        th["useThemeStore<br/>tema actual · primaryColor"]
    end

    AuthProvider --> a
    useChat --> ch
    ChatScreen --> mp
    MapScreen --> mp
    MapScreen --> th

    classDef persist fill:#fef9c3,stroke:#ca8a04;
    class ch persist;
```

| Store            | Persistencia                                          | Notas                                                                   |
| ---------------- | ----------------------------------------------------- | ----------------------------------------------------------------------- |
| `useAuthStore`   | No                                                    | Reflejo de la sesión de Supabase; se rehidrata vía `getSession()`.      |
| `useChatStore`   | **Sí** (AsyncStorage, clave `osm-chat-conversations`) | `partialize` guarda solo `conversations`; el resto es estado de sesión. |
| `useMapStore`    | No                                                    | `focusTarget` permite que el chat centre el mapa en un lugar.           |
| `useThemeStore`  | No                                                    | Gestiona los colores principales de la aplicación y la tematización.    |

Detalle de campos y acciones en [04-modelo-de-datos](./04-modelo-de-datos.md).

---

## 2.5 Composición de los features clave

### Feature `chat`

```mermaid
graph TD
    cs["ChatScreen"] --> uc["useChat (hook)"]
    cs --> ch_comps["Componentes de chat"]
    uc --> store["useChatStore"]
    uc --> resolve{"Config.chat.useMock?"}
    resolve -->|true| mock["mockChatQuery<br/>(empareja CAMPUS_PLACES)"]
    resolve -->|false| chatApi["sendChatQuery → /api/chat"]

    subgraph ch_comps_detail["Componentes"]
        ci["ChatInput"]
        mb["MessageBubble"]
        air["AIResponse"]
        lc["LocationCard"]
        sc["SuggestionChips"]
        ti["TypingIndicator"]
        chist["ConversationHistory"]
    end
    ch_comps --- ch_comps_detail

    cs -->|"'Ver en mapa'"| mapstore["useMapStore.setFocusTarget"]
```

- `useChat` orquesta el ciclo idle → asking → answered, agrega mensajes y maneja errores con botón **Reintentar**.
- `LocationCard` dispara `handleOpenLocation` → `setFocusTarget(coordenada)` → `navigation.navigate('Map')`.

### Feature `map`

```mermaid
graph TD
    ms["MapScreen"] --> mbgl["MapboxGL.MapView<br/>(Standard Style + 3D)"]
    ms --> cam["useMapCamera<br/>(ninguno · libre · guía)"]
    ms --> consts["constants/unmsm<br/>UNMSM · UNMSM_POIS · CAMPUS_PLACES"]

    subgraph map_comps["Componentes flotantes"]
        sb["MapSearchBar"]
        fc["MapFilterChips"]
        lb["MapLocationButton"]
        ab["MapActionButtons"]
        sm["MapSpawnModal"]
        rs["MapRouteSelectionModal"]
        ri["MapRouteInfoCard"]
    end
    ms --- map_comps

    mbgl --> poi["ShapeSource POIs (Circle + Symbol)"]
    mbgl --> route["LineLayer (ruta)"]
    mbgl --> avatar["PointAnnotation (avatar)"]
```

- `useMapCamera` controla la cámara: **modo ninguno** (vista pájaro), **modo libre** (inmersión tipo street view) y navegación punto a punto.
- POIs se filtran por `categoria` mediante `MapFilterChips`.
- `MapScreen` lee activamente `focusTarget` de `useMapStore` (escrito desde `ChatScreen` o los componentes flotantes) para centrar la cámara en el destino e iniciar la navegación de rutas automáticamente si se requiere.

---

## 2.6 Configuración y variables de entorno

Toda la configuración se centraliza en `src/constants/config.ts`, que lee variables `EXPO_PUBLIC_*` (ver `.env.example`):

| Variable                        | Uso                                          | Default                 |
| ------------------------------- | -------------------------------------------- | ----------------------- |
| `EXPO_PUBLIC_API_URL`           | Base del backend (`apiClient`).              | backend en Render¹      |
| `EXPO_PUBLIC_MAPBOX_TOKEN`      | Token público de Mapbox.                     | `''`                    |
| `EXPO_PUBLIC_SUPABASE_URL`      | URL del proyecto Supabase.                   | `''`                    |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Llave anónima de Supabase.                   | `''`                    |
| `EXPO_PUBLIC_USE_MOCK_CHAT`     | Si `= 'true'`, el chat usa respuestas mock.  | backend real²           |
| `EXPO_PUBLIC_ENABLE_DEV_LOGS`   | Logs de desarrollo.                          | `false`                 |

¹ Por defecto apunta al backend desplegado (`https://ondesanmarcos-backend.onrender.com`); define `EXPO_PUBLIC_API_URL` para usar un backend local.
² El chat consume el backend real por defecto; el mock solo se activa con `EXPO_PUBLIC_USE_MOCK_CHAT=true`.

Además, `app.config.ts` expone `mapboxPublicToken` y el `projectId` de EAS vía `expo.extra`.

> **Alias de imports** (definidos en `babel.config.js` / `tsconfig.json`): `@features/*`, `@store/*`, `@services/*`, `@constants/*`, `@navigation/*`, `@providers/*`, `@/theme/*`. Por eso se ve `import { useChat } from '@features/chat/hooks/useChat'`.
