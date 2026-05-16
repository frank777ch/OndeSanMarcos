# 📱 OndeSanMarcos — Frontend

> Aplicación móvil de geolocalización 3D y asistencia inteligente para el campus de la UNMSM.  
> Stack: **React Native + TypeScript + Expo + Mapbox + Supabase**

---

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#1-requisitos-previos)
2. [Credenciales y Servicios Externos](#2-credenciales-y-servicios-externos)
3. [Instalación y Setup](#3-instalación-y-setup)
4. [Estructura de Carpetas](#4-estructura-de-carpetas)
5. [Variables de Entorno](#5-variables-de-entorno)
6. [Scripts Disponibles](#6-scripts-disponibles)
7. [Roadmap Frontend](#7-roadmap-frontend)
8. [Convenciones de Código](#8-convenciones-de-código)

---

## 1. Requisitos Previos

### 🖥️ Software a instalar (en orden)

| Herramienta | Versión mínima | Enlace | Para qué sirve |
|---|---|---|---|
| **Node.js** | 18.x LTS | https://nodejs.org | Motor de JavaScript |
| **npm** | 9.x (viene con Node) | — | Gestor de paquetes |
| **Git** | 2.x | https://git-scm.com | Control de versiones |
| **Expo CLI** | Latest | `npm i -g expo-cli` | Herramienta de Expo |
| **EAS CLI** | Latest | `npm i -g eas-cli` | Build en la nube |
| **VS Code** | Latest | https://code.visualstudio.com | Editor recomendado |

### 📱 Para probar la app en tu dispositivo

| Opción | Plataforma | Instrucciones |
|---|---|---|
| **Expo Go** (más fácil) | Android / iOS | Instalar desde la tienda de apps |
| **Android Emulator** | Android | Requiere Android Studio |
| **iOS Simulator** | iOS (solo en Mac) | Requiere Xcode |

> ⚠️ **Nota importante sobre Mapbox:** `@rnmapbox/maps` **NO funciona en Expo Go** porque incluye código nativo. Necesitarás un **Expo Development Build** (se explica en la sección de setup).

### 🔌 Extensiones de VS Code recomendadas

```
dbaeumer.vscode-eslint
esbenp.prettier-vscode
dsznajder.es7-react-js-snippets
bradlc.vscode-tailwindcss
ms-azuretools.vscode-docker
```

---

## 2. Credenciales y Servicios Externos

Necesitarás cuentas en estos 3 servicios. **Todos tienen tier gratuito suficiente para el proyecto.**

---

### 🗺️ A. Mapbox (Motor de Mapas 3D)

**Para qué:** Renderizar el mapa 3D del campus, trazar rutas, mostrar el avatar.

**Pasos para obtener el token:**
1. Ir a https://account.mapbox.com/auth/signup/
2. Crear cuenta gratuita
3. En el dashboard, ir a **"Tokens"** → **"Create a token"**
4. Nombrar el token: `ondesanmarcos-dev`
5. Dejar los scopes por defecto (lectura de estilos y mapas)
6. Copiar el token — empieza con `pk.eyJ1...`

**También necesitarás el Secret Token** para la instalación nativa:
1. En la misma sección de Tokens → **"Create a secret token"**
2. Habilitar el scope `DOWNLOADS:READ`
3. Copiar el token — empieza con `sk.eyJ1...`
4. ⚠️ Este token solo se muestra una vez, guárdalo en un lugar seguro

```
EXPO_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...  ← va en tu .env
MAPBOX_SECRET_TOKEN=sk.eyJ1...       ← va en ~/.netrc (ver setup)
```

---

### 🗄️ B. Supabase (Base de Datos + Auth)

**Para qué:** Autenticación de usuarios, almacenamiento de embeddings (pgvector), datos de sesión.

**Pasos:**
1. Ir a https://supabase.com → **"Start your project"**
2. Crear organización: `ondesanmarcos`
3. Crear proyecto: `ondesanmarcos-dev`
4. Región: **South America (São Paulo)** — la más cercana a Perú
5. Anotar la contraseña de la DB (guárdala)
6. Una vez creado, ir a **Settings → API**
7. Copiar:
   - `Project URL` → `EXPO_PUBLIC_SUPABASE_URL`
   - `anon public` key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

---

### ☁️ C. Expo (Build y OTA Updates)

**Para qué:** Compilar la app con código nativo (necesario por Mapbox), distribución al equipo.

**Pasos:**
1. Ir a https://expo.dev → crear cuenta
2. Crear organización: `ondesanmarcos`
3. Instalar EAS CLI: `npm install -g eas-cli`
4. Login: `eas login`

---

## 3. Instalación y Setup

### Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/TU_ORG/ondesanmarcos.git
cd ondesanmarcos/frontend
```

### Paso 2 — Configurar el Secret Token de Mapbox

Este paso es necesario para que npm pueda descargar el SDK nativo de Mapbox.

**En macOS/Linux:**
```bash
# Agregar al archivo ~/.netrc
echo "machine api.mapbox.com
login mapbox
password sk.eyJ1...TU_SECRET_TOKEN" >> ~/.netrc

chmod 600 ~/.netrc
```

**En Windows (PowerShell):**
```powershell
# Crear o editar C:\Users\TU_USUARIO\.netrc
Add-Content -Path "$env:USERPROFILE\.netrc" -Value "machine api.mapbox.com`nlogin mapbox`npassword sk.eyJ1...TU_SECRET_TOKEN"
```

### Paso 3 — Crear el archivo `.env`

```bash
cp .env.example .env
```

Llenar con tus credenciales reales (ver sección de Variables de Entorno).

### Paso 4 — Instalar dependencias

```bash
npm install
```

### Paso 5 — Crear el Development Build (necesario por Mapbox)

```bash
# Asegúrate de estar logueado en Expo
eas login

# Build para Android (más rápido para probar)
eas build --profile development --platform android

# Build para iOS (requiere cuenta Apple Developer)
eas build --profile development --platform ios
```

> 💡 El build tarda ~10-15 minutos la primera vez. EAS te enviará un link de descarga al correo. Instala el `.apk` en tu dispositivo Android.

### Paso 6 — Levantar el servidor de desarrollo

```bash
npx expo start --dev-client
```

Escanea el QR con la app de Development Build instalada (NO con Expo Go).

---

## 4. Estructura de Carpetas

```
frontend/
├── .env                          # Variables de entorno locales (NO subir a Git)
├── .env.example                  # Plantilla de variables (SÍ subir a Git)
├── app.json                      # Config de Expo (nombre, versión, permisos)
├── App.tsx                       # Entry point — solo monta el NavigationContainer
├── eas.json                      # Config de builds (dev / preview / production)
├── package.json
├── tsconfig.json
│
├── assets/                       # Recursos estáticos
│   ├── fonts/                    # Tipografías custom
│   ├── icons/                    # Iconos SVG/PNG de la app
│   └── images/                   # Imágenes (logo, splash, onboarding)
│
└── src/                          # 🧠 Todo el código vive aquí
    │
    ├── app/                      # Configuración global de la aplicación
    │   ├── navigation/           # Stack, Tab y tipos de navegación
    │   │   ├── AppNavigator.tsx  # Raíz: decide entre AuthStack y MainTabs
    │   │   ├── AuthStack.tsx     # Pantallas de login/registro
    │   │   ├── MainTabs.tsx      # Bottom tabs: Mapa | Chat | Perfil
    │   │   └── types.ts          # Tipos de RootStackParamList
    │   ├── providers/            # Context providers globales
    │   │   ├── AuthProvider.tsx  # Sesión de Supabase
    │   │   └── ThemeProvider.tsx # Tema claro/oscuro (futuro)
    │   └── store/                # Estado global (Zustand)
    │       ├── useAuthStore.ts
    │       ├── useMapStore.ts    # Coordenadas, ruta activa, modo del mapa
    │       └── useChatStore.ts   # Historial de mensajes del chat
    │
    ├── features/                 # 🏗️ Una carpeta por épica del backlog
    │   │
    │   ├── map/                  # EPIC01 — Navegación y Mapa 3D
    │   │   ├── components/
    │   │   │   ├── MapView3D.tsx       # Componente principal de Mapbox
    │   │   │   ├── UserAvatar.tsx      # Avatar del usuario en el mapa
    │   │   │   ├── RouteLayer.tsx      # Polyline de la ruta activa
    │   │   │   └── MapControls.tsx     # Botones de zoom, centrar, etc.
    │   │   ├── hooks/
    │   │   │   ├── useGPS.ts           # Suscripción al GPS del dispositivo
    │   │   │   └── useCompass.ts       # Suscripción al magnetómetro
    │   │   ├── screens/
    │   │   │   └── MapScreen.tsx       # Pantalla completa del mapa
    │   │   └── constants/
    │   │       └── unmsm.ts            # Coords del campus, bounds, zoom inicial
    │   │
    │   ├── chat/                 # EPIC02 — Asistente IA (RAG)
    │   │   ├── components/
    │   │   │   ├── MessageBubble.tsx   # Burbuja de mensaje (usuario/bot)
    │   │   │   ├── MessageList.tsx     # FlatList de burbujas
    │   │   │   └── ChatInput.tsx       # Campo de texto + botón enviar
    │   │   ├── hooks/
    │   │   │   └── useChat.ts          # Lógica de envío y recepción
    │   │   ├── screens/
    │   │   │   └── ChatScreen.tsx
    │   │   └── types/
    │   │       └── chat.types.ts       # Message, Role, RoutePayload
    │   │
    │   ├── routing/              # EPIC03 — Motor de Rutas
    │   │   ├── hooks/
    │   │   │   └── useRouting.ts       # Calcula y dibuja rutas en el mapa
    │   │   └── utils/
    │   │       └── routeParser.ts      # Parsea el JSON {coords, draw_route}
    │   │
    │   └── auth/                 # EPIC04 — Gestión de Accesos
    │       ├── components/
    │       │   └── SocialButton.tsx
    │       ├── screens/
    │       │   ├── WelcomeScreen.tsx   # "Continuar como Invitado" | "Login"
    │       │   ├── LoginScreen.tsx
    │       │   └── RegisterScreen.tsx
    │       └── hooks/
    │           └── useAuth.ts          # Wraper de Supabase Auth
    │
    ├── shared/                   # 🔧 Código reutilizable entre features
    │   ├── components/           # UI genérica
    │   │   ├── Button.tsx        # Botón custom con variantes
    │   │   ├── Input.tsx         # Input custom con validación
    │   │   ├── Toast.tsx         # Notificaciones tipo toast
    │   │   └── LoadingOverlay.tsx
    │   ├── hooks/                # Hooks genéricos
    │   │   └── usePermissions.ts # Manejo de permisos GPS, cámara, etc.
    │   └── utils/                # Funciones puras sin side effects
    │       ├── validators.ts     # Validar email, contraseña, etc.
    │       └── formatters.ts     # Formatear coords, fechas, etc.
    │
    ├── services/                 # 🌐 Conexiones con el mundo exterior
    │   ├── supabase/
    │   │   ├── client.ts         # Instancia única del cliente Supabase
    │   │   └── auth.service.ts   # Funciones de login, register, logout
    │   └── api/
    │       ├── client.ts         # Cliente HTTP (fetch/axios) hacia FastAPI
    │       └── chat.service.ts   # POST /chat → retorna respuesta + coords
    │
    └── constants/                # 🔢 Valores globales inmutables
        ├── colors.ts             # Paleta de colores de la app
        ├── typography.ts         # Fuentes y tamaños
        └── config.ts             # URLs, timeouts, flags de features
```

---

## 5. Variables de Entorno

Crea el archivo `.env` en la raíz de `/frontend` con estos valores:

```bash
# ─── Mapbox ───────────────────────────────────────
# Token público (empieza con pk.)
EXPO_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...

# ─── Supabase ─────────────────────────────────────
# URL del proyecto
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
# Clave anónima (anon key)
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# ─── Backend (FastAPI) ────────────────────────────
# URL de tu backend local durante desarrollo
EXPO_PUBLIC_API_URL=http://192.168.1.X:8000
# En producción cambiaría a: https://api.ondesanmarcos.com

# ─── Feature Flags ────────────────────────────────
EXPO_PUBLIC_ENABLE_DEV_LOGS=true
```

> ⚠️ **Reglas de oro:**
> - `.env` está en `.gitignore`. **Nunca lo subas al repositorio.**
> - El `.env.example` sí se sube, con los valores vacíos.
> - En React Native con Expo, solo las variables que empiezan con `EXPO_PUBLIC_` son accesibles en el código cliente.

---

## 6. Scripts Disponibles

```bash
# Levantar servidor de desarrollo (usar con Development Build)
npx expo start --dev-client

# Levantar solo para Android
npx expo start --dev-client --android

# Build de desarrollo en la nube (EAS)
eas build --profile development --platform android
eas build --profile development --platform ios

# Build de preview (para compartir con el equipo sin Play Store)
eas build --profile preview --platform android

# Linter
npm run lint

# Verificar tipos TypeScript
npm run type-check
```

---

## 7. Roadmap Frontend

### 📊 Mapa de dificultad y orden recomendado

```
SEMANA        PANTALLA / FEATURE                      DIFICULTAD   HU
─────────────────────────────────────────────────────────────────────
Sprint 1
  Sem 1-2   [ ] Setup completo del entorno             ★☆☆☆☆       —
            [ ] WelcomeScreen (Invitado / Login)        ★☆☆☆☆      HU-4.1
            [ ] LoginScreen + RegisterScreen            ★★☆☆☆      HU-4.2
            [ ] Mapa 3D base centrado en UNMSM          ★★★☆☆      HU-1.1
  Sem 3     [ ] Controles táctiles del mapa             ★★☆☆☆      HU-1.1
            [ ] Integración GPS → Avatar en pantalla    ★★★☆☆      HU-1.1

Sprint 2
  Sem 4-5   [ ] ChatScreen + burbujas de mensajes       ★★☆☆☆      HU-2.1
            [ ] Conexión real al backend FastAPI         ★★★☆☆      HU-2.2
            [ ] Guardrails visibles en UI               ★☆☆☆☆      HU-2.4
  Sem 6     [ ] Avatar con rotación por magnetómetro    ★★★★☆      HU-1.2
            [ ] Trazado de ruta manual (A → B)          ★★★★☆      HU-3.1

Sprint 3
  Sem 7-8   [ ] Enrutamiento automático Chat→Mapa       ★★★★★      HU-2.3
            [ ] Pulido: animaciones, loading states     ★★★☆☆       —
  Sem 9     [ ] QA, corrección de bugs, documentación   ★★☆☆☆       —
```

---

### 🟢 Lo más fácil (empieza aquí)

1. **WelcomeScreen** — Solo dos botones. Sin lógica de negocio. Te permite tener la primera pantalla andando en 2 horas.

2. **LoginScreen / RegisterScreen** — Formularios simples. Supabase Auth lo hace en ~20 líneas. Te da confianza rápida.

3. **ChatScreen (solo UI, sin backend)** — Armar las burbujas con datos hardcodeados. El diseño es fácil y visualmente motivador.

4. **Mapa base (sin GPS)** — Mostrar el campus en 3D centrado en la UNMSM. Una vez que ves el mapa en pantalla, el equipo se motiva mucho.

---

### 🔴 Lo más difícil (planifícalo con tiempo)

1. **Enrutamiento Automático Chat → Mapa (HU-2.3)** ⚠️ La más compleja del proyecto.
   - El backend debe devolver JSON con `{text, draw_route: true, coordinates: [...]}`.
   - El frontend debe interceptar ese JSON, hacer el cambio de tab automáticamente y dibujar la polyline.
   - Requiere coordinación exacta entre backend y frontend.
   - Recomendación: diseña el contrato del JSON desde el día 1 con el equipo de backend.

2. **Avatar con magnetómetro (HU-1.2)** — Los sensores del dispositivo tienen jitter (temblor). El filtro de suavizado es matemático y requiere calibración en físico. No se puede probar bien en emulador.

3. **Development Build con Mapbox** — La configuración inicial del SDK nativo de Mapbox es el mayor bloqueador técnico del proyecto. Destina tiempo la primera semana exclusivamente para esto. Si no pasa este paso, nadie puede trabajar en el mapa.

---

## 8. Convenciones de Código

### Nombrado

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componentes | PascalCase | `MapView3D.tsx` |
| Hooks | camelCase con `use` | `useGPS.ts` |
| Stores (Zustand) | camelCase con `use` | `useMapStore.ts` |
| Constantes | UPPER_SNAKE_CASE | `UNMSM_CENTER_COORDS` |
| Types/Interfaces | PascalCase con sufijo | `ChatMessage`, `RoutePayload` |
| Archivos de servicios | camelCase con `.service` | `auth.service.ts` |

### Reglas generales

- **TypeScript estricto:** No se permite `any`. Siempre tipar los props y el return de los hooks.
- **Un componente = un archivo.** Si un componente supera ~150 líneas, dividirlo.
- **Sin lógica de negocio en los screens.** Los screens solo ensamblan componentes y conectan stores/hooks.
- **Toda llamada a la API va en `/services`.** Los componentes no hacen `fetch` directamente.
- **Commits en español, siguiendo Conventional Commits:**

```bash
feat(map): agregar componente de avatar con GPS
fix(auth): corregir redirección luego del login
chore(deps): actualizar @rnmapbox/maps a v10.1
docs(readme): agregar instrucciones de setup para Windows
```

---

## 🆘 Solución de Problemas Frecuentes

**Error: `Mapbox token is not set`**
→ Verificar que `.env` existe y tiene `EXPO_PUBLIC_MAPBOX_TOKEN`. Reiniciar el servidor de Expo.

**Error: `Unable to download Mapbox SDK` durante `npm install`**
→ El Secret Token de Mapbox no está configurado en `~/.netrc`. Revisar el Paso 2 del setup.

**El mapa no carga en Expo Go**
→ Mapbox requiere código nativo. Necesitas el Development Build (ver Paso 5).

**El GPS no funciona en el emulador**
→ Normal. Para probar el avatar con GPS real, usar un dispositivo físico.

---

*Documentación mantenida por el equipo OndeSanMarcos — Última actualización: Abril 2026*