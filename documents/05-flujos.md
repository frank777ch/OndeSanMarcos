# 5. Flujos

Diagramas de flujo y secuencia de las interacciones principales. Cada flujo indica si está ✅ implementado o 🟠 planificado.

---

## 5.1 Arranque de la app y gating de sesión ✅

Qué ocurre desde que se abre la app hasta que se decide mostrar el login o las pestañas principales.

```mermaid
sequenceDiagram
    autonumber
    participant App as App.tsx
    participant AP as AuthProvider
    participant AS as authService (Supabase)
    participant Store as useAuthStore
    participant Nav as AppNavigator

    App->>App: useFonts() — carga tipografías
    App->>AP: monta AuthProvider
    AP->>AS: getSession()
    AS-->>AP: session | null
    AP->>Store: setSession(session)
    AP->>AS: onAuthStateChange(listener)
    Note over Store: isLoading = false
    App->>Nav: render
    alt isLoading
        Nav-->>App: render null (sin parpadeo)
    else session ≠ null o isGuest
        Nav-->>App: MainTabs
    else
        Nav-->>App: AuthStack
    end
```

---

## 5.2 Registro con verificación por correo ✅

Usa **deep linking** (`ondesanmarcos://verified-email`) para que el enlace del correo regrese a la app.

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant R as RegisterScreen
    participant AS as authService
    participant SB as Supabase Auth
    participant Mail as 📧 Correo
    participant V as VerifiedEmailScreen

    U->>R: completa email + contraseña + nombre
    R->>AS: signUp(email, password, name)
    AS->>SB: auth.signUp({ emailRedirectTo })
    SB-->>Mail: envía enlace de activación
    AS-->>R: ok → navega a EmailSent
    U->>Mail: abre el correo y toca el enlace
    Mail-->>V: deep link ondesanmarcos://verified-email
    Note over V: cuenta activada → puede iniciar sesión
```

> Si el usuario intenta iniciar sesión sin activar, Supabase rechaza el login (HU-4.2: "Cuenta inactiva").

---

## 5.3 Conversación con el asistente ✅ (mock) · 🟠 (backend)

La pantalla de chat transita entre tres estados visuales. El hook `useChat` decide entre el **mock** y el **backend** según `Config.chat.useMock`.

### Estados de la pantalla

```mermaid
stateDiagram-v2
    [*] --> idle: pantalla inicial
    idle --> asking: el usuario escribe (texto > 0)
    asking --> idle: borra el texto
    asking --> answered: envía el mensaje
    idle --> answered: envía una sugerencia
    answered --> answered: sigue conversando
    answered --> idle: "Nueva conversación"
```

### Secuencia de envío

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant CS as ChatScreen
    participant H as useChat
    participant ST as useChatStore
    participant R as resolveResponse

    U->>CS: escribe y pulsa enviar
    CS->>H: sendMessage()
    H->>ST: addMessage(user)
    H->>ST: setChatState("answered"), setLoading(true)
    H->>R: resolveResponse(query)
    alt Config.chat.useMock = true
        R->>R: mockChatQuery() — empareja CAMPUS_PLACES
    else backend real
        R->>R: sendChatQuery() → POST /api/chat
    end
    R-->>H: ChatResponse { answer, locations }
    H->>ST: addMessage(assistant + locations)
    H->>ST: setLoading(false)
    ST-->>CS: re-render (burbuja + tarjetas)
    Note over ST: el historial se persiste en AsyncStorage
```

> Si el backend falla, `useChat` agrega un mensaje de error con `failedQuery` y la UI muestra **Reintentar** (`retryMessage`).

---

## 5.4 Enrutamiento automático (Chat → Mapa) 🟡 / 🟠

### Hoy (parcial ✅/🟡)

Desde una respuesta del asistente, "Ver en mapa" fija el destino y cambia de pestaña.

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant LC as LocationCard
    participant CS as ChatScreen
    participant MS as useMapStore
    participant Map as MapScreen

    U->>LC: toca "Ver en mapa"
    LC->>CS: handleOpenLocation(location)
    CS->>CS: getCampusPlaceById(location.id)
    CS->>MS: setFocusTarget(coordinate)
    CS->>Map: navigation.navigate("Map")
    Note over Map: 🟡 pendiente: que MapScreen lea focusTarget y recentre la cámara
```

### Objetivo (HU-2.3 — planificado 🟠)

El propio asistente decide cuándo navegar, devolviendo coordenadas y `draw_route`.

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant CS as ChatScreen
    participant B as Backend RAG
    participant MS as useMapStore
    participant Map as MapScreen

    U->>CS: "¿Cómo llego al Rectorado?"
    CS->>B: POST /api/chat
    B-->>CS: { answer, locations, draw_route:true, destination }
    CS->>MS: setActiveRoute(...) / setFocusTarget(destination)
    CS->>Map: navega a Mapa
    Map->>Map: dibuja la ruta (polyline) y vuela al destino
```

---

## 5.5 Modos de cámara del mapa ✅

`useMapCamera` controla la cámara 3D del campus.

```mermaid
stateDiagram-v2
    [*] --> Ninguno: vista pájaro (UNMSM.center, pitch 60)
    Ninguno --> SeleccionSpawn: toca "Modo libre"
    SeleccionSpawn --> Libre: elige punto (MapSpawnModal)
    SeleccionSpawn --> Ninguno: cierra modal
    Libre --> Ninguno: vuelve a vista general
    Ninguno --> Guia: 🟠 (planificado) sigue al usuario
    Guia --> Ninguno: desactiva
```

| Modo | Cámara | Estado |
|------|--------|--------|
| **Ninguno** | Vista general desde arriba (zoom 16, pitch 60). | ✅ |
| **Libre** | Inmersión tipo street view (zoom 19.5, pitch 80). | ✅ |
| **Guía** | Sigue la ubicación real del usuario (HU-1.6). | 🟠 |

---

## 5.6 Avatar y orientación (GPS + brújula) 🟠

Flujo previsto para HU-1.1 / HU-1.2 (hoy el avatar se fija al centro del campus si se conceden permisos).

```mermaid
flowchart TD
    start["Abrir Mapa"] --> perm{"¿Permiso de ubicación?"}
    perm -->|Denegado| toast["Toast de aviso + mapa navegable<br/>(sin avatar) ✅"]
    perm -->|Concedido| loc["Lee posición GPS"]
    loc --> avatar["Muestra avatar ✅ (posición fija hoy)"]
    avatar --> sensors["🟠 Magnetómetro → rota el avatar"]
    sensors --> smooth["🟠 Filtro de suavizado (anti-jitter)"]
```

> Las dependencias `expo-location` y `expo-sensors` ya están instaladas; la rotación por magnetómetro y el suavizado son el trabajo pendiente (HU-1.2, Sprint 3).
