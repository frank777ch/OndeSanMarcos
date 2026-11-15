# HU-40 · Plan técnico

- **Spec:** [spec.md](spec.md)
- **Estado:** Borrador

## 1. Enfoque
Se sustituye Mapbox (`react-map-gl`) por una escena de React Three Fiber (Three.js) que dibuja datos de OpenStreetMap guardados en el repositorio. Todo lo que hoy cuelga del mapa (lugares, ruta, ubicación, vuelos de cámara, vista 3D/2D) se reconecta a una **cámara propia** con una API imperativa en un store de zustand, de modo que `MapOverlay`, `MapActions`, `RouteDialog` y los stores existentes no cambian. Detalle visual bajo: edificios como bloques con sombreado suave, sin texturas. Se construye por fases y se sustituye `<Map>` solo al final; `feat/web` conserva el mapa actual hasta entonces.

## 2. Datos y tipos
**`web/src/features/map/data/campus-osm.json`** (generado una vez con `scripts/fetch-campus-osm.mjs`, consulta Overpass dentro de `CAMPUS_MAX_BOUNDS`):
- `boundary`: polígono de la Ciudad Universitaria (`amenity=university`).
- `buildings[]`: `{ footprint: LngLat[][], height: number, name?: string }`. Altura: `height` → `building:levels × 3 m` → 9 m por defecto. El script cuenta y muestra cuántos edificios usaron la altura por defecto.
- `green[]`: `{ polygon, kind: 'grass' | 'park' | 'pitch' }`; `water[]` si hay.
- Todo recortado al contorno y con coordenadas redondeadas a 6 decimales.
- Los caminos se dibujan con `features/routing/data/campus-paths.json` (RF-40.4).

**Proyección** (`features/map/utils/projection.ts`): `toLocal([lng, lat]) → [x, z]` en metros respecto a `CAMPUS.center`, equirectangular (error despreciable en ~1,5 km); `y` es la altura. `fromLocal` es la inversa.

**Cámara** (`features/map/scene/cameraStore.ts`, zustand):
- Estado: `tilt` (grados), `flat: boolean` (derivado de la inclinación real con umbral, como `FLAT_PITCH`), `bounds` (límites ampliables).
- Acciones: `flyTo(lngLat, { distance?, duration })`, `setFlat(boolean)`, `fitPoints(coords, padding)`, `resetToCampus()`, `expandBounds(coord)`.
- Constantes de `CAMPUS` reutilizadas: `camera.pitch/bearing`, `minZoom/maxZoom` → distancias mín./máx.; función `zoomToDistance` para conservar `SELECTED_ZOOM`, `LOCATION_ZOOM` y `MAX_ZOOM` de `FlyToRoute`.

## 3. Archivos
| Ruta | Qué hace | Cubre |
|---|---|---|
| `scripts/fetch-campus-osm.mjs` | Descarga y limpia los datos de OpenStreetMap | RF-40.2, 40.3 |
| `web/src/features/map/data/campus-osm.json` | Datos del campus | RF-40.2, 40.3 |
| `web/src/features/map/utils/projection.ts` (+ test) | Lng/lat ↔ metros locales | RF-40.2, 40.9, 40.11, 40.13 |
| `web/src/features/map/scene/cameraStore.ts` (+ test) | API de cámara: vuelos, encuadre, 3D/2D, límites | RF-40.6, 40.7, 40.10, 40.11, 40.14 |
| `web/src/features/map/scene/CampusScene.tsx` | `<Canvas>` (`frameloop="demand"`), luces, capas; carga diferida | RF-40.1, 40.16 a 40.18 |
| `web/src/features/map/scene/CampusCamera.tsx` | `MapControls` de drei, límites y animación de vuelo en `useFrame` | RF-40.5, 40.6, 40.7 |
| `web/src/features/map/scene/Ground.tsx` | Suelo del campus y fondo liso exterior | RF-40.2 |
| `web/src/features/map/scene/GreenAreas.tsx` | Áreas verdes y canchas (malla fusionada) | RF-40.2 |
| `web/src/features/map/scene/Paths.tsx` | Caminos como cintas finas | RF-40.2, 40.4 |
| `web/src/features/map/scene/Buildings.tsx` | Edificios extruidos, malla fusionada | RF-40.2 |
| `web/src/features/map/scene/Boundary.tsx` | Contorno punteado (`LineDashedMaterial`) | RF-40.8 |
| `web/src/features/map/scene/PlaceMarkers.tsx` | Puntos por categoría (instanciados) + nombres; clic → `selectPlace(id, 'map')` | RF-40.9 |
| `web/src/features/map/scene/RouteLine.tsx` | Línea de la ruta con hover/tap y grosor; prioridad sobre lugares | RF-40.11, 40.12 |
| `web/src/features/routing/components/RouteRemoveButton.tsx` | Cambia `Marker` por `Html` de drei; misma posición diagonal | RF-40.12 |
| `web/src/features/map/scene/UserLocation.tsx` | Punto azul y halo de precisión | RF-40.13 |
| `web/src/features/map/scene/useMapColors.ts` | Lee las variables `--map-*` y observa `data-theme` | RF-40.15 |
| `web/src/index.css` | Variables `--map-ground/outside/building/green/path/boundary/label/label-halo` en claro y oscuro | RF-40.15 |
| `web/src/features/map/components/CampusMap.tsx` | Sustituye `<Map>` por `<CampusScene />`; quita token de Mapbox, `interactiveLayerIds`, `onMouseMove/onClick` de Mapbox y el `ResizeObserver` | RF-40.1, 40.7, 40.14, 40.16 |
| `FlyToSelection.tsx`, `FlyToRoute.tsx` | Pasan a usar el store de cámara | RF-40.10, 40.11 |
| `RouteLayer.tsx`, `PlacesLayer.tsx`, `UserLocationLayer.tsx` | Se retiran al final (sustituidos por la escena) | RF-40.9, 40.11, 40.13 |
| `web/package.json` | Agrega `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`. `mapbox-gl` y `react-map-gl` se quedan por `LocationPicker` | RF-40.1 |

## 4. Estado (stores) y comunicación
- Se mantienen `useMapStore`, `usePlacesStore`, `useRouteStore` (incluidos `routeHover`, `scheduleHide`, `cancelHide`) y `useLocationStore`.
- `cameraStore` es la única vía para mover la cámara. Los componentes que hoy llaman a `mapRef`/`useMap()` pasan a llamar a sus acciones.
- `flat` se actualiza al terminar cada gesto de inclinación (equivalente de `onPitchEnd`); el botón lo lee.
- `frameloop="demand"`: se llama a `invalidate()` al cambiar datos, tema, selección, ruta, ubicación o durante un vuelo.
- Los toques se resuelven por *raycast* contra el plano del suelo a nivel 0 (sin pisos ni techos), comprobando primero la ruta y luego los lugares.

## 5. Decisiones
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Three.js con React Three Fiber | MapLibre; Mapbox con estilo propio | Pedido del usuario: control total del aspecto y de un mapa solo del campus. |
| Datos de OpenStreetMap guardados en el repo | Extraer teselas de Mapbox | Sus términos no permiten extraerlas; los datos son casi los mismos. |
| Altura: OSM → pisos × 3 m → 9 m | Exigir altura real | Muchos edificios no la tienen; se refina después. |
| Edificios fusionados en una malla | Una malla por edificio | Menos llamadas de dibujo; fluidez en celulares. |
| Toques a nivel del suelo | Raycast contra edificios | Simple y uniforme; sin pisos ni techos. |
| Sustituir `<Map>` solo en la fase final | Flag de Mapbox como respaldo | La rama no se fusiona hasta terminar; `feat/web` es el respaldo. |
| `LocationPicker` queda con Mapbox | Migrarlo ahora | Se decide al terminar el mapa nuevo. |

## 6. Estrategia de pruebas
jsdom no tiene WebGL: se mockea `@react-three/fiber` (`Canvas` → `div`) y la escena; se prueban los stores, las utilidades y los manejadores.

| Requisito | Test |
|---|---|
| RF-40.2, 40.3 | `campus-osm.test.ts` › «RF-40.3: los polígonos están cerrados y las alturas son positivas» |
| RF-40.4 | `Paths.test.tsx` › «RF-40.4: usa el grafo de las rutas» |
| RF-40.6, 40.7, 40.10, 40.11, 40.14 | `cameraStore.test.ts` › «RF-40.6: respeta los límites y se amplían con la ubicación», «RF-40.7: `flat` sigue a la inclinación», «RF-40.11: encuadra la ruta descontando la barra lateral» |
| RF-40.8 | `Boundary.test.tsx` › «RF-40.8: línea punteada» |
| RF-40.9 | `PlaceMarkers.test.tsx` › «RF-40.9: filtra por categoría», «clic elige el lugar con origen map» |
| RF-40.12 | `CampusMap.test.tsx` › «RF-40.12: la ruta tiene prioridad sobre los lugares», `RouteRemoveButton.test.tsx` |
| RF-40.13 | `UserLocation.test.tsx` |
| RF-40.14 | `CampusMap.test.tsx` (nombres y acciones del botón de ubicación; ya cubiertos por RF-15.8/15.12) |
| RF-40.15 | `useMapColors.test.ts` › «RF-40.15: cambia con `data-theme`» |
| RF-40.1, 40.16, 40.18 | `CampusMap.test.tsx` (sin token) y `routes.test.tsx` (carga diferida) |

Se prueba a mano: arrastrar, zoom y giro; 2D/3D; tema claro/oscuro; elegir lugar por búsqueda y por clic; ruta y «X» en escritorio y emulación móvil; ubicación dentro y fuera del campus; fluidez (≈ 60 fps en el panel de rendimiento) y tamaño del paquete (RF-40.17, 40.18).

## 7. Riesgos y dependencias
- **Datos incompletos en OpenStreetMap** (alturas, edificios, canchas): se cuantifica con el script y se completa a mano si hace falta.
- **Rendimiento en celulares**: mallas fusionadas, instancias para los puntos, `frameloop="demand"`; se mide antes de la fase 6.
- **Textos** (`Text` de drei) con muchos lugares: se limita por distancia/zoom si se satura.
- **Peso del paquete**: three y drei añaden peso; se mantienen en el *chunk* diferido del mapa.
- **Specs de otras historias** que mencionan Mapbox (HU-12, HU-13, HU-15, HU-28): se actualizan en la fase 6.
- Depende de HU-12, HU-13, HU-15 y HU-18.

## 8. Historial
- 2026-11-13 · Plan creado a partir de `mapa-threejs-plan.md`.
