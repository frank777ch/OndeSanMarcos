# Mapa propio de la Ciudad Universitaria en Three.js

## Contexto
El mapa público usa Mapbox Standard, que muestra todo Lima con mucho detalle y depende de un token. El usuario quiere un mapa **propio, simple y solo de la universidad** (referencia: estilo sobrio tipo «Rieles de Lima»), dibujado en un canvas 3D con **Three.js (React Three Fiber)**, que siga el **tema claro/oscuro** de la app y mantenga el botón **Vista 2D / 3D**.

Todo lo que hoy cuelga del mapa debe seguir funcionando: lugares (puntos, nombres, clic → ficha), búsqueda y filtros (`MapOverlay`), vuelo al lugar elegido, ruta (línea, encuadre, «X» al pasar el cursor), mi ubicación (punto + halo), volver al campus y el menú `MapActions`.

Fuera de alcance: `features/admin/places/components/LocationPicker.tsx` sigue con Mapbox (se migra después si se quiere).

## Arquitectura

### 1. Datos (una vez, guardados en el repo)
- `scripts/fetch-campus-osm.mjs`: consulta Overpass dentro de `CAMPUS_MAX_BOUNDS` y guarda `web/src/features/map/data/campus-osm.json` con:
  - `boundary`: polígono de la Ciudad Universitaria (`amenity=university`).
  - `buildings`: huellas + `height` (de `height`, o `building:levels × 3 m`, o 9 m por defecto) + nombre si lo hay.
  - `green`: césped, parques, canchas (`leisure=pitch`, `landuse=grass`…), con su tipo.
  - `water` si hay.
  - Recorta todo al contorno y redondea a 6 decimales. Atribución OSM (ODbL) en un texto pequeño abajo a la izquierda.
- Los caminos se dibujan con el `routing/data/campus-paths.json` que ya existe (el mismo grafo de las rutas, así la línea de la ruta siempre cae sobre un camino dibujado).

### 2. Proyección — `features/map/utils/projection.ts`
- `toLocal([lng, lat]) → [x, z]` en metros respecto a `CAMPUS.center` (equirectangular; error despreciable en ~1,5 km). `y` es la altura. `fromLocal` inverso.
- Base de todo lo demás (lugares, ruta, ubicación, cámara). Tests unitarios ida y vuelta.

### 3. Cámara — `features/map/scene/cameraStore.ts` + `CampusCamera.tsx`
- `MapControls` de `@react-three/drei` (arrastrar = desplazar, rueda/pellizco = zoom, botón derecho/dos dedos = girar e inclinar).
- Límites: objetivo dentro del contorno + margen (sustituye `maxBounds`; se amplía si la ubicación del usuario cae fuera, como `expandBounds` hoy), distancia mín./máx. (sustituye `minZoom/maxZoom`).
- API imperativa en un store zustand (la usan los componentes que hoy llaman a `mapRef`/`useMap`):
  - `flyTo(lngLat, { distance?, duration })` — animación con interpolación suave en `useFrame`.
  - `setTilt(flat: boolean)` — 3D ≈ 55° de inclinación, 2D = vista cenital (0°). Botón «Vista 2D/3D» y su etiqueta siguen a la inclinación real (equivalente de `onPitchEnd`).
  - `fitPoints(coords, padding)` — encuadra la ruta respetando `--sidebar-w`, buscador arriba (sustituye `fitBounds` de `FlyToRoute`).
  - `resetToCampus()` — «Volver al campus».
- Equivalencia zoom Mapbox → distancia de cámara en una función, para reutilizar `SELECTED_ZOOM`, `LOCATION_ZOOM`, etc.

### 4. Escena — `features/map/scene/`
| Componente | Qué dibuja | Notas |
|---|---|---|
| `CampusScene.tsx` | `<Canvas>` + luces + cámara + capas | Carga diferida (como hoy `MapPage`). `frameloop="demand"` para no gastar batería. |
| `Ground.tsx` | Suelo del campus (contorno relleno) y fuera un plano de color fondo | |
| `GreenAreas.tsx` | Áreas verdes y canchas, planas, ligeramente sobre el suelo | Una sola malla fusionada. |
| `Paths.tsx` | Caminos como líneas/cintas finas | De `campus-paths.json`. |
| `Buildings.tsx` | Edificios extruidos (`ExtrudeGeometry`), fusionados en una malla | Sombreado suave, sin texturas. En 2D se ven como planta. |
| `Boundary.tsx` | Borde punteado (`LineDashedMaterial`) | Lo que se pidió antes. |
| `PlaceMarkers.tsx` | Puntos de color por categoría (instanciados, siempre de frente) + nombres (`Text` de drei, con halo) | Clic/tap → `selectPlace(id, 'map')`; cursor `pointer`. Filtra con `filterPlaces` (`map/utils/places.ts`). |
| `RouteLine.tsx` | Línea gruesa de la ruta (`Line` de drei) | Hover/tap → `routeHover` del store actual; se engrosa. Prioridad sobre los lugares (se comprueba primero, como hoy). |
| `RouteRemoveButton` | «X» en `Html` de drei | Reutiliza el componente actual cambiando `Marker` por `Html`; misma posición diagonal. |
| `UserLocation.tsx` | Punto azul + halo de precisión (`USER_DOT_COLOR`) | |

### 5. Tema
- Nuevas variables en `index.css` para claro y oscuro: `--map-ground`, `--map-outside`, `--map-building`, `--map-building-top`, `--map-green`, `--map-path`, `--map-boundary`, `--map-label`, `--map-label-halo`.
- `useMapColors()` lee las variables y se actualiza con un `MutationObserver` sobre `data-theme`; las capas reciben los colores y Three.js re-renderiza.

### 6. Integración
- `CampusMap.tsx`: sustituye `<Map>` por `<CampusScene />`; quita la comprobación del token de Mapbox (el mapa público ya no lo necesita), `interactiveLayerIds`, `onMouseMove/onClick` de Mapbox y el `ResizeObserver` (R3F ya se adapta al contenedor). `MapActions`, `MapOverlay`, `LocationNotice`, `RouteDialog` no cambian.
- `FlyToSelection`, `FlyToRoute`, `goToMyLocation`, `backToCampus`, `toggleView` pasan a usar el store de cámara.
- Dependencias nuevas: `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`. `mapbox-gl`/`react-map-gl` se quedan solo por `LocationPicker`.

## Fases (cada una deja la app funcionando)
1. Script + datos + `projection.ts` (+ tests). Revisar el JSON en geojson.io.
2. Escena estática (suelo, verde, caminos, edificios, borde) + cámara + 2D/3D + tema, en una ruta de prueba o detrás de un flag.
3. Lugares + selección + vuelo al lugar.
4. Ruta + encuadre + «X».
5. Mi ubicación + límites ampliados + volver al campus.
6. Sustituir en `CampusMap`, ajustar tests y documentación (nueva HU en `web-docs/spec/`, y actualizar las RF de HU-12/13/15 que mencionan Mapbox).

## Tests
- jsdom no tiene WebGL: en los tests se mockea `@react-three/fiber` (`Canvas` → div) y la escena; se prueban los stores, `projection`, el cálculo de límites/encuadre y los manejadores (clic en lugar, prioridad de la ruta, etiqueta 2D/3D).
- Reescribir `CampusMap.test.tsx` (hoy mockea `react-map-gl`) contra el store de cámara.

## Verificación
- `npx tsc -p tsconfig.app.json --noEmit` y `npx vitest run` desde `web/`.
- `npm run dev`: recorrer escritorio y móvil (DevTools): arrastrar, zoom, girar, 2D/3D, tema claro/oscuro, elegir un lugar (búsqueda y clic), trazar ruta y quitarla con la «X», mi ubicación dentro y fuera del campus. Revisar fluidez (60 fps en el panel de rendimiento) y tamaño del bundle.
