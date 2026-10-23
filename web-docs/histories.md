# Historias de usuario: migración a web

Rama: `feat/web`. Un commit por historia (`feat(web): HU-0X …`). Ver `plan.md` para el detalle técnico.

Estados: ⬜ pendiente · 🟨 en curso · ✅ hecha

---

## HU-01 · Rama, limpieza y documentación ✅
**Como** equipo, **quiero** una rama limpia con solo lo necesario **para** trabajar la web sin ruido.
- Tareas: crear `feat/web`; borrar `test/` (prototipo Vue + Babylon) y `render.yaml`; crear `web-docs/plan.md` y `histories.md`.
- Aceptación: la rama existe; `test/` y `render.yaml` ya no están; los docs existen.

## HU-02 · Proyecto base ⬜
**Como** desarrollador, **quiero** un proyecto Vite + React + TypeScript **para** empezar a construir la web.
- Tareas: crear `web/` con Vite; instalar `react-router-dom`, `zustand`, `mapbox-gl`, `react-map-gl`, `lucide-react`, `vite-plugin-svgr`, Vitest; variables `VITE_*` y `web/.env.example` (sin tokens reales).
- Aceptación: `npm run dev`, `npm run build` y `npm run test` funcionan.

## HU-03 · Tema y layout responsive ⬜
**Como** usuario, **quiero** navegar entre Mapa y Asistente en móvil o escritorio **para** usar la app en cualquier pantalla.
- Tareas: tokens de color → variables CSS; fuentes DM Sans y Funnel Display; rutas `/`, `/mapa`, `/asistente`; barra inferior en móvil y lateral en escritorio (corte ~768px).
- Aceptación: se ve bien a 375px y 1440px, sin scroll horizontal.

## HU-04 · Portar lógica ⬜
**Como** desarrollador, **quiero** reutilizar la lógica existente **para** no reescribir lo que ya funciona.
- Tareas: `config`, `client`, `chatApi`, `useChatStore` (con `localStorage`), `useMapStore`, `useThemeStore`, `pathfinder` + JSON de rutas, `geofence`, `unmsm`; pasar sus tests de Jest a Vitest.
- Aceptación: tests en verde.

## HU-05 · Chat ⬜
**Como** visitante, **quiero** preguntarle al asistente **para** resolver dudas del campus.
- Tareas: mensajes, input, sugerencias, indicador de escritura, historial de conversaciones.
- Aceptación: una pregunta llega al backend local y se muestra la respuesta; el historial persiste al recargar.

## HU-06 · Del chat al mapa ⬜
**Como** visitante, **quiero** abrir en el mapa un lugar que me mencionó el asistente **para** ver dónde está.
- Tareas: `LocationCard` navega a `/mapa` y deja el lugar en `useMapStore`.
- Aceptación: clic en la tarjeta navega y centra el lugar.

## HU-07 · Mapa base ⬜
**Como** visitante, **quiero** ver el mapa del campus con sus lugares **para** ubicarme.
- Tareas: Mapbox GL JS con cámara UNMSM; POIs; filtros por categoría; barra de búsqueda.
- Aceptación: se ven y filtran los POIs; buscar centra el lugar.

## HU-08 · Ficha de lugar y selección de ruta ⬜
**Como** visitante, **quiero** ver información de un lugar y pedir cómo llegar **para** decidir mi destino.
- Tareas: `MapPlaceInfoCard` y `MapRouteSelectionModal` en JSX/CSS.
- Aceptación: al tocar un POI se ve su ficha y se puede iniciar una ruta.

## HU-09 · Rutas en el campus ⬜
**Como** visitante, **quiero** ver el camino entre dos puntos **para** llegar caminando.
- Tareas: dibujar ruta con `pathfinder`; `MapRouteInfoCard` con distancia restante.
- Aceptación: la ruta se dibuja entre origen y destino.

## HU-10 · Mi ubicación ⬜
**Como** visitante, **quiero** ver dónde estoy en el mapa **para** orientarme.
- Tareas: `navigator.geolocation.watchPosition`; permisos con mensaje claro; geocerca del campus; brújula opcional (`deviceorientation`).
- Aceptación: con permiso se ve mi punto; sin permiso aparece un aviso.

## HU-11 · Modo libre con avatar ⬜
**Como** visitante, **quiero** explorar el campus con un avatar **para** recorrerlo de forma virtual.
- Tareas: `MapSpawnModal`; avatar `david_idle`/`david_walk`; cámara en modo libre.
- Aceptación: el avatar aparece y se anima como en la app.

## HU-12 · Onboarding de primera visita (opcional) ⬜
**Como** visitante nuevo, **quiero** una breve introducción **para** entender qué puedo hacer.
- Tareas: pantallas del onboarding; flag en `localStorage`.
- Aceptación: se muestra solo la primera vez.

## HU-13 · Cierre ⬜
**Como** equipo, **quiero** que el repo solo tenga la web **para** evitar código muerto.
- Tareas: borrar `frontend/`; actualizar `README.md` y `documents/02-frontend.md`; revocar el token secreto de Mapbox que estaba en `frontend/.env.example`.
- Aceptación: `web/` es el único frontend y la documentación está al día.
