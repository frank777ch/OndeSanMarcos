# OndeSanMarcos

## 1. ¿Qué es OndeSanMarcos?

Aplicación móvil para el campus de la **Universidad Nacional Mayor de San Marcos (UNMSM)** en Lima, Perú. Resuelve dos problemas concretos:

1. **Desorientación espacial** — mapa 3D interactivo del campus con avatar del usuario en tiempo real via GPS.
2. **Información dispersa** — chatbot con IA que responde preguntas institucionales basándose exclusivamente en documentos oficiales de la universidad (arquitectura RAG).

**La "magia" del proyecto:** si el usuario pregunta en el chat "¿Cómo llego a la biblioteca?", el backend responde con un JSON que incluye coordenadas y el flag `draw_route: true`. El frontend intercepta esto, cambia automáticamente a la pantalla del mapa y dibuja la ruta.

---

## 2. Stack Tecnológico

| Capa            | Tecnología                       | Versión     |
| --------------- | -------------------------------- | ----------- |
| Mobile Frontend | React Native + TypeScript        | Expo SDK 54 |
| Motor de Mapas  | `@rnmapbox/maps`                 | ^10.3.0     |
| Navegación      | React Navigation                 | v7          |
| Estado Global   | Zustand                          | ^5.0.12     |
| Auth + DB       | Supabase (PostgreSQL + pgvector) | ^2.104.1    |
| Backend         | FastAPI (Python)                 | —           |
| IA              | LlamaIndex + RAG                 | —           |
| Build           | Expo EAS                         | —           |

---

## 3. Estructura de Carpetas — Estado Actual

```
frontend/
├── App.tsx                          ✅ Entry point limpio
├── index.ts                         ✅ registerRootComponent
├── app.json                         ✅ Configurado (permisos GPS, scheme, colores UNMSM)
├── babel.config.js                  ✅ Con module-resolver y path aliases
├── tsconfig.json                    ✅ Con path aliases estrictos
├── package.json                     ✅ main: "index.ts"
├── .env                             ✅ Local (NO en Git)
├── .env.example                     ✅ Plantilla en Git
│
├── assets/                          ✅ Recursos estáticos de Expo
│
└── src/
    ├── constants/                   ✅ COMPLETO
    │   ├── colors.ts                ✅ Paleta UNMSM (azul #003087, amarillo #E8B800)
    │   ├── typography.ts            ✅ FontSize, FontWeight
    │   └── config.ts                ✅ Lee variables de .env
    │
    ├── core/                        ✅ (renombrado desde src/app para evitar conflicto con Expo Router)
    │   ├── navigation/              ✅ COMPLETO
    │   │   ├── types.ts             ✅ AuthStackParamList, MainTabsParamList, props de pantallas
    │   │   ├── AuthStack.tsx        ✅ Welcome → Login → Register
    │   │   ├── MainTabs.tsx         ✅ Tab: Mapa | Asistente
    │   │   └── AppNavigator.tsx     ✅ Decide entre AuthStack y MainTabs según sesión
    │   ├── providers/               ✅ COMPLETO
    │   │   └── AuthProvider.tsx     ✅ Escucha onAuthStateChange de Supabase
    │   └── store/                   ✅ COMPLETO
    │       ├── useAuthStore.ts      ✅ user, session, isGuest, isLoading
    │       ├── useMapStore.ts       ✅ userLocation, userHeading, activeRoute, mapMode
    │       └── useChatStore.ts      ✅ messages[], isTyping, addMessage
    │
    ├── features/
    │   ├── auth/
    │   │   └── screens/             ✅ COMPLETO
    │   │       ├── WelcomeScreen.tsx ✅ Fondo azul UNMSM, 3 opciones de acceso
    │   │       ├── LoginScreen.tsx  ✅ Email + password, conectado a Supabase
    │   │       └── RegisterScreen.tsx ✅ Registro + activación por correo
    │   ├── map/
    │   │   ├── screens/
    │   │   │   └── MapScreen.tsx    ✅ Placeholder (Mapbox se integra en siguiente sprint)
    │   │   └── constants/
    │   │       └── unmsm.ts         ✅ Coords UNMSM: lat -12.0565, lng -77.0827
    │   ├── chat/
    │   │   └── screens/
    │   │       └── ChatScreen.tsx   ✅ Placeholder (RAG se integra en siguiente sprint)
    │   └── routing/                 ⏳ Pendiente (Sprint 2)
    │       ├── hooks/
    │       └── utils/
    │
    ├── services/                    ✅ COMPLETO
    │   ├── supabase/
    │   │   ├── client.ts            ✅ Instancia única con AsyncStorage
    │   │   └── auth.service.ts      ✅ signUp, signIn, signOut, getSession, onAuthStateChange
    │   └── api/
    │       └── client.ts            ✅ apiClient.get / apiClient.post hacia FastAPI
    │
    └── shared/                      ⏳ Pendiente (se llena en Sprint 1-2)
        ├── components/
        ├── hooks/
        └── utils/
```

**Leyenda:** ✅ Creado y funcional | ⏳ Pendiente

---

## 4. Archivos de Configuración — Contenido Exacto

### `babel.config.js`

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./src"],
          alias: {
            "@": "./src",
            "@features": "./src/features",
            "@shared": "./src/shared",
            "@services": "./src/services",
            "@constants": "./src/constants",
            "@store": "./src/core/store",
            "@navigation": "./src/core/navigation",
            "@providers": "./src/core/providers",
          },
        },
      ],
    ],
  };
};
```

### `tsconfig.json`

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@features/*": ["src/features/*"],
      "@shared/*": ["src/shared/*"],
      "@services/*": ["src/services/*"],
      "@constants/*": ["src/constants/*"],
      "@store/*": ["src/core/store/*"],
      "@navigation/*": ["src/core/navigation/*"],
      "@providers/*": ["src/core/providers/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.d.ts"]
}
```

### `app.json`

```json
{
  "expo": {
    "name": "OndeSanMarcos",
    "slug": "ondesanmarcos",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "scheme": "ondesanmarcos",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#003087"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.ondesanmarcos.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#003087"
      },
      "package": "com.ondesanmarcos.app",
      "permissions": ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"]
    },
    "web": { "favicon": "./assets/favicon.png" },
    "plugins": ["expo-location"],
    "experiments": { "typedRoutes": false }
  }
}
```

### `.env.example`

```bash
EXPO_PUBLIC_MAPBOX_TOKEN=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=http://192.168.1.X:8000
EXPO_PUBLIC_ENABLE_DEV_LOGS=true
```

---

## 5. Dependencias Instaladas

### `package.json` actual

```json
{
  "name": "frontend",
  "version": "1.0.0",
  "main": "index.ts",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "@react-native-async-storage/async-storage": "2.2.0",
    "@react-navigation/bottom-tabs": "^7.15.10",
    "@react-navigation/native": "^7.2.2",
    "@react-navigation/native-stack": "^7.14.12",
    "@rnmapbox/maps": "^10.3.0",
    "@supabase/supabase-js": "^2.104.1",
    "expo": "~54.0.33",
    "expo-location": "~19.0.8",
    "expo-sensors": "~15.0.8",
    "expo-status-bar": "~3.0.9",
    "react": "19.1.0",
    "react-native": "0.81.5",
    "react-native-dotenv": "^3.4.11",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",
    "zustand": "^5.0.12"
  },
  "devDependencies": {
    "@types/react": "~19.1.0",
    "babel-plugin-module-resolver": "^5.0.3",
    "babel-preset-expo": "*",
    "typescript": "~5.9.2"
  }
}
```

---

## 6. Decisiones de Arquitectura Tomadas

### ¿Por qué `src/core` en vez de `src/app`?

Expo Router (el sistema de navegación basado en archivos de Expo) se activa automáticamente cuando detecta una carpeta llamada `src/app`. Como usamos **React Navigation** (más flexible para este proyecto), renombramos la carpeta a `src/core` para evitar el conflicto. Esto se complementa con `"experiments": { "typedRoutes": false }` en `app.json`.

### ¿Por qué Zustand y no Context API?

Zustand es más simple, no requiere providers anidados, y el estado del mapa (coordenadas GPS actualizándose cada segundo) se beneficia de su sistema de suscripciones granulares sin re-renders innecesarios.

### ¿Por qué las pantallas son placeholder?

`MapScreen` y `ChatScreen` son placeholders intencionales. Mapbox (`@rnmapbox/maps`) requiere **código nativo** y no funciona en Expo Go. Para activarlo se necesita un **Expo Development Build** via EAS. Esto es el siguiente paso crítico del proyecto.

### Flujo de autenticación

```
App inicia
    └── AuthProvider carga sesión desde Supabase (AsyncStorage)
            ├── Hay sesión  → MainTabs (Mapa + Chat)
            ├── isGuest=true → MainTabs (Mapa + Chat)
            └── Sin sesión  → AuthStack (Welcome → Login/Register)
```

---

## 7. Problemas Resueltos Durante el Setup

| Problema                                              | Causa                                     | Solución                                      |
| ----------------------------------------------------- | ----------------------------------------- | --------------------------------------------- |
| `Using src/app as the root directory for Expo Router` | Expo detectaba `src/app` como Expo Router | Renombrar a `src/core` + `typedRoutes: false` |
| `Cannot find module 'babel-preset-expo'`              | No estaba instalado explícitamente        | `npm install --save-dev babel-preset-expo`    |
| `babel.config.js` no existía                          | `create-expo-app` no lo genera siempre    | Crear manualmente con `New-Item`              |
| Pantallas en carpeta incorrecta                       | Error al crear archivos manualmente       | Mover con `Move-Item` de PowerShell           |

---

## 8. Próximos pasos en orden

### 🔴 URGENTE

**Obtener credenciales y hacer el Development Build:**

1. **Mapbox** → https://account.mapbox.com
   - Crear Public Token (`pk.eyJ1...`) → va en `.env` como `EXPO_PUBLIC_MAPBOX_TOKEN`
   - Crear Secret Token (`sk.eyJ1...`) → va en `~/.netrc` (Windows: `C:\Users\TU_USER\.netrc`)
   - Formato del `.netrc`:
     ```
     machine api.mapbox.com
     login mapbox
     password sk.eyJ1...TU_SECRET_TOKEN
     ```

2. **Supabase** → https://supabase.com
   - Crear proyecto en región **South America (São Paulo)**
   - Copiar `Project URL` y `anon key` → van en `.env`
   - Habilitar extensión `pgvector` en SQL Editor: `CREATE EXTENSION vector;`

3. **Expo EAS** → https://expo.dev
   - `npm install -g eas-cli`
   - `eas login`
   - `eas build --profile development --platform android`
   - Instalar el `.apk` generado en el dispositivo Android
   - Correr con: `npx expo start --dev-client`

---

### 🟡 Sprint 1

**HU-1.1 — Mapa 3D base**

Reemplazar el placeholder de `MapScreen.tsx` con:

```typescript
import MapboxGL from '@rnmapbox/maps';
import { Config } from '@constants/config';
import { UNMSM } from '@features/map/constants/unmsm';

MapboxGL.setAccessToken(Config.mapbox.token);

export function MapScreen() {
  return (
    <MapboxGL.MapView style={{ flex: 1 }} styleURL={MapboxGL.StyleURL.Outdoors}>
      <MapboxGL.Camera
        zoomLevel={UNMSM.camera.zoomLevel}
        centerCoordinate={[UNMSM.center.longitude, UNMSM.center.latitude]}
        pitch={UNMSM.camera.pitch}
        animationMode="flyTo"
      />
    </MapboxGL.MapView>
  );
}
```

**HU-2.1 — Chat UI real**

Construir en `src/features/chat/`:

- `components/MessageBubble.tsx` — burbuja de mensaje con estilos usuario/bot
- `components/MessageList.tsx` — FlatList de burbujas
- `components/ChatInput.tsx` — TextInput + botón enviar
- `hooks/useChat.ts` — lógica de envío al backend FastAPI

**Contrato del JSON entre backend y frontend (acordar con el equipo de backend):**

```typescript
// Respuesta normal del bot
{ "text": "La biblioteca está en el pabellón A." }

// Respuesta con ruta (activa el switch automático a mapa)
{
  "text": "Te guío a la biblioteca.",
  "draw_route": true,
  "destination": { "latitude": -12.0550, "longitude": -77.0830 }
}
```

---

### 🟢 Sprint 2

- **HU-1.2** — Avatar con rotación por magnetómetro (`expo-sensors`)
- **HU-3.1** — Trazado de ruta manual A → B en el mapa
- **HU-2.3** — Enrutamiento automático Chat → Mapa (la más compleja)

---

### 🟢 Sprint 3

- **HU-2.2** — Consultas RAG reales al backend
- **HU-2.4** — Guardrails visibles en UI
- Pulido visual, animaciones, loading states
- QA final

---

## 9. Comandos de Referencia Rápida

```powershell
# Levantar en modo Expo Go (sin Mapbox)
npx expo start --clear

# Levantar con Development Build (con Mapbox)
npx expo start --dev-client

# Build de desarrollo en la nube
eas build --profile development --platform android

# Ver estructura de carpetas
tree src

# Verificar archivos en una carpeta
dir src\features\map\screens

# Mover un archivo
Move-Item -Path "origen\archivo.tsx" -Destination "destino\archivo.tsx"

# Crear archivo vacío
New-Item -Name "archivo.ts" -ItemType File

# Ver contenido de un archivo
type archivo.json
```

---

## 10. Convenciones del Proyecto

| Elemento    | Convención                      | Ejemplo                             |
| ----------- | ------------------------------- | ----------------------------------- |
| Componentes | PascalCase                      | `MessageBubble.tsx`                 |
| Hooks       | camelCase con `use`             | `useChat.ts`                        |
| Stores      | camelCase con `use`             | `useMapStore.ts`                    |
| Constantes  | UPPER_SNAKE_CASE                | `UNMSM_CENTER_COORDS`               |
| Servicios   | camelCase con `.service`        | `auth.service.ts`                   |
| Commits     | Conventional Commits en español | `feat(map): agregar avatar con GPS` |

**Reglas de código:**

- TypeScript estricto — prohibido `any`
- Sin lógica de negocio en los screens — solo ensamblan componentes
- Toda llamada a API va en `/services` — los componentes no hacen `fetch` directo
- Un componente = un archivo — si supera ~150 líneas, dividir
