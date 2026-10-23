# Migrar OndeSanMarcos de app móvil (Expo) a web responsive (Vite + React)

## Contexto
Hoy `frontend/` es una app Expo/React Native (Android/iOS) con login de Supabase, 3 pestañas (Mapa, Asistente, Perfil) y el mapa con `@rnmapbox/maps` (solo nativo). Se quiere una **web responsive, sin login ni registro**, con solo **Mapa + Asistente**, reescrita en **Vite + React** y **sin código móvil**. El backend FastAPI (Render) no cambia; solo se ajusta CORS.

## Paso 0: rama y documentación
1. Crear la rama `feat/web` desde `main` (`git checkout -b feat/web`).
2. En esa rama queda solo lo necesario:
   - **Se queda:** `backend/`, `supabase/`, `documents/`, `.github/`, `README.md`, `.gitignore`, `.gitattributes` y la nueva `web/` y `web-docs/`.
   - **Se borra:** `frontend/` (app Expo) cuando `web/` ya tenga lo portado, `test/` (prototipo Vue + Babylon que la app no usa) y `render.yaml` (sin despliegue por ahora; sigue en `main`).
3. Crear `web-docs/` con:
   - `web-docs/plan.md`: este plan.
   - `web-docs/histories.md`: el trabajo dividido en historias de usuario (ver sección "Historias" abajo), cada una con ID, descripción "Como… quiero… para…", tareas y criterios de aceptación.
4. Commit por historia (`feat(web): HU-0X …`).

## Enfoque
Crear un proyecto nuevo `web/` (Vite + React + TypeScript), portar la lógica pura que ya existe y reescribir solo la UI. Cuando la web funcione, borrar `frontend/`.

### 1. Proyecto base
- `npm create vite@latest web -- --template react-ts`
- Dependencias: `react-router-dom`, `zustand`, `mapbox-gl` + `react-map-gl` (wrapper declarativo, muy parecido a `<MapboxGL.MapView>`/`ShapeSource`/`LineLayer`), `lucide-react` (mismo set de íconos que `lucide-react-native`), `vite-plugin-svgr` (para los SVG de `src/shared/assets`).
- Estilos: CSS Modules o Tailwind; colores de `frontend/src/theme/colors.ts`, `light.ts`, `dark.ts` → variables CSS en `:root`. Fuentes DM Sans y Funnel Display desde Google Fonts.
- Variables de entorno: `EXPO_PUBLIC_*` → `VITE_*` (`VITE_API_URL`, `VITE_MAPBOX_TOKEN`, `VITE_USE_MOCK_CHAT`, `VITE_ENABLE_DEV_LOGS`); `process.env.X` → `import.meta.env.X` en el port de `src/constants/config.ts`. Se eliminan las de Supabase.

### 2. Código que se copia casi sin cambios
| Origen (`frontend/src/…`) | Cambio |
|---|---|
| `services/api/client.ts`, `chatApi.ts` | solo `Config` |
| `features/chat/types/index.ts`, `constants/mockChat.ts` | ninguno |
| `features/routing/utils/pathfinder.ts` + `rutas-caminos*.json` | ninguno |
| `features/routing/hooks/useRouting.ts` | ninguno |
| `features/map/constants/unmsm.ts`, `utils/geofence.ts` | ninguno |
| `core/store/useMapStore.ts`, `useThemeStore.ts` | ninguno |
| `core/store/useChatStore.ts` | `AsyncStorage` → `localStorage` en `createJSONStorage` |
| `features/chat/hooks/useChat.ts` | quitar `LayoutAnimation`; `navigation.navigate('Map')` → `useNavigate()('/mapa')` |
| `assets/avatar/*.webp`, `shared/assets/*.svg`, `favicon.png` | copiar a `web/src/assets` |

### 3. UI que se reescribe (View/Text/StyleSheet → HTML/CSS)
- **Layout** (`App.tsx` + router): rutas `/` (redirige a `/mapa`), `/mapa`, `/asistente`. Navegación como **barra inferior en móvil** (igual que hoy) y **barra lateral / header en escritorio** (media query ~768px). En escritorio se puede mostrar chat y mapa lado a lado como mejora opcional.
- **Chat** (`features/chat/screens/ChatScreen.tsx` y componentes `MessageBubble`, `AIResponse`, `ChatInput`, `SuggestionChips`, `TypingIndicator`, `LocationCard`, `ConversationHistory`): mismo diseño en JSX/CSS; `KeyboardAvoidingView` ya no hace falta.
- **Mapa** (`features/map/screens/MapScreen.tsx`, ~800 líneas, es la parte más grande):
  - `MapboxGL.MapView/Camera` → `<Map>` de react-map-gl; `useMapCamera` pasa a usar `mapRef.flyTo({center, zoom, pitch, bearing, duration})` en lugar de estado de cámara.
  - `ShapeSource`+`LineLayer/CircleLayer/SymbolLayer` → `<Source>`+`<Layer>` (mismas specs de paint/layout).
  - `MarkerView`/`PointAnnotation` (avatar, destino, usuario) → `<Marker>`.
  - `expo-location` → `navigator.geolocation.watchPosition` (requiere HTTPS); `getProviderStatusAsync` y el polling cada 3 s se eliminan (se maneja con el error del permiso). Brújula `watchHeadingAsync` → evento `deviceorientation` (en iOS Safari pide permiso con `DeviceOrientationEvent.requestPermission()`); si no hay, se oculta la rotación.
  - `useLocationPermission` → `navigator.permissions.query({name:'geolocation'})`; quitar ramas de `Platform.OS === 'android'` (también en `MapActionButtons` y `MapLocationButton`).
  - `Alert.alert` → modal/toast propio. Componentes `MapSearchBar`, `MapFilterChips`, `MapPlaceInfoCard`, `MapRouteInfoCard`, `MapRouteSelectionModal`, `MapSpawnModal`, `MapActionButtons` se reescriben en JSX/CSS con la misma lógica.
- **Onboarding** (opcional): se puede conservar `OnboardingScreen` como pantalla de bienvenida la primera visita (flag en `localStorage`); `Welcome/Login/Register/EmailSent/VerifiedEmail` se eliminan.

### 4. Lo que se elimina
- Todo `features/auth`, `features/profile`, `core/providers/AuthProvider.tsx`, `core/store/useAuthStore.ts`, `services/supabase/`, `core/navigation/` (React Navigation).
- Al final, la carpeta `frontend/` completa (`app.config.ts`, `eas.json`, `metro.config.js`, `@rnmapbox/maps`, `expo-*`). La carpeta `supabase/` se queda: el backend la usa para pgvector.

### 5. Ejecución local (sin despliegue por ahora)
- Todo corre en local salvo la base de datos vectorial (Supabase, plan gratis).
- Backend: `cd backend && uvicorn app.main:app --reload --port 8000`, con `backend/.env` apuntando a `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` y `LLM_API_KEY`. `CORS_ORIGINS="*"` (el default) sirve para local.
- Web: `web/.env` con `VITE_API_URL=http://localhost:8000` como valor por defecto (en vez del backend de Render).
- `render.yaml` no se toca por ahora.
- El proyecto Supabase que usaba el frontend para login (`fzwkop…`) deja de usarse; el que importa es el del backend (`fylkzh…`, pgvector).
- **Seguridad:** `frontend/.env.example` tiene commiteado un token secreto `sk.…` de Mapbox (`RNMAPBOX_MAPS_DOWNLOAD_TOKEN`). Revocarlo en Mapbox; ya no hará falta.

### 6. Tests y docs
- Pasar los tests de lógica pura (`geofence`, `useChatStore`, `useThemeStore`, `client`, `chatApi`, `useMapCamera`) de Jest a **Vitest** (API casi idéntica). Borrar los tests de auth.
- Actualizar `README.md` y `documents/02-frontend.md` con el nuevo stack y comandos.

## Historias
**Regla:** cada historia se implementa solo en escritorio (≥ 1024px); lo móvil va después en bloque (HU-21). Ver `histories.md` (HU-01 a HU-21). Se trata como una app nueva construida desde cero; el código anterior de `frontend/` solo sirve de referencia hasta HU-20.

## Verificación
- `cd web && npm run dev` → abrir `http://localhost:5173`; probar en DevTools con vista móvil (375px) y escritorio (1440px).
- Chat: con el backend local levantado, enviar una pregunta y confirmar la respuesta (o con `VITE_USE_MOCK_CHAT=true`); al responder con una ubicación, el botón lleva a `/mapa` y centra el lugar.
- Mapa: POIs y filtros, búsqueda, cálculo de ruta, modo libre con avatar, y GPS (en `localhost` el navegador lo permite sin HTTPS; para probar desde el celular en la misma red hace falta HTTPS, p. ej. `@vitejs/plugin-basic-ssl` + `npm run dev -- --host`).
- `npm run test` (Vitest) y `npm run build` sin errores de TypeScript.
