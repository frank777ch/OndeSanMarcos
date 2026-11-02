# HU-13 · Plan técnico

- **Spec:** [spec.md](spec.md)
- **Estado:** Ejecutado

## 1. Enfoque
1. Un módulo nuevo `features/routing` con funciones puras: `pathfinder` (grafo de caminos + Dijkstra), `planRoute` (origen y destino → resultado o error) y `formatDistance`. No depende de React ni de Mapbox, así que se prueba sin mapa.
2. El grafo se construye una vez, perezosamente, desde `rutas-caminos-completo.json` (copiado de `frontend/src/features/routing/utils/`, 20 `LineString`, ~17 KB).
3. `useRouteStore` guarda el diálogo (abierto/cerrado), el origen, el destino y el resultado; es la única fuente de verdad y lo que HU-14 leerá para dibujar.
4. El buscador actual se divide: `PlaceCombobox` (campo + lista, sin saber del mapa) y `PlaceSearch` (lo conecta a `useMapStore`). El diálogo usa dos `PlaceCombobox` con otras acciones.
5. `RouteDialog` se apoya en `Modal`, que gana lo que le falta: foco inicial, atrapar foco y devolver el foco.
6. `RouteButton` va bajo el botón de ubicación en `CampusMap`; `PlaceCard` gana «Cómo llegar».

## 2. Datos y tipos
```ts
type Coord = [number, number]            // [lng, lat], igual que LngLat

type RoutePoint =
  | { kind: 'place'; placeId: string }
  | { kind: 'my-location'; coordinates: Coord }

interface PlannedRoute {
  origin: RoutePoint
  destination: RoutePoint
  path: Coord[]            // origen → tramo de acceso → caminos → tramo de acceso → destino
  distance: number         // metros, suma de todos los tramos (RF-13.21, RF-13.22)
}

type RouteError =
  | 'same-place'           // RF-13.13
  | 'origin-too-far'       // RF-13.23
  | 'destination-too-far'  // RF-13.23
  | 'no-path'              // RF-13.24

type RouteResult = { ok: true; route: PlannedRoute } | { ok: false; error: RouteError }
```

- **Constante:** `MAX_ACCESS_DISTANCE = 150` m (RF-13.23).
- **Grafo:** nodos = vértices de las líneas; dos vértices a ≤ 5 m son el mismo nodo (une cruces mal digitalizados, igual que la app anterior). Aristas en ambos sentidos con peso haversine (RF-13.20).
- **Punto de entrada:** se usa el **nodo más cercano** (como pedía la historia), no una proyección sobre el segmento. Es suficiente con los nodos tan cercanos de este archivo; si se ve mal en pruebas a mano, se pasa a proyección (anotado como riesgo).
- **Tramos de acceso:** distancia haversine en línea recta del origen a su nodo y del nodo al destino; ambos entran en `path` y en `distance` (RF-13.22). Si el origen coincide con el nodo, no se repite el punto.
- **Coordenadas de un `RoutePoint`:** `place` → `Place.coordinates`; `my-location` → las guardadas al elegirlo.
- **Formato (RF-13.21):** `< 1000` → `Math.round(m) + ' m'`; si no → `(m / 1000).toFixed(1)` con coma decimal + `' km'`.
- **Misma ubicación (RF-13.13):** dos `place` con el mismo `placeId`. «Mi ubicación» contra un lugar no se compara.

## 3. Archivos
| Ruta | Qué hace | Cubre |
|---|---|---|
| `web/src/features/routing/data/campus-paths.json` | Nuevo: copia de `rutas-caminos-completo.json` | RF-13.20 |
| `web/src/features/routing/utils/distance.ts` | Nuevo: `haversine(a, b)`, `pathLength(coords)`, `formatDistance(m)` | RF-13.21, RF-13.22 |
| `web/src/features/routing/utils/pathfinder.ts` | Nuevo: `buildGraph(geojson)`, `nearestNode(graph, point)`, `shortestPath(graph, fromId, toId)` (Dijkstra con cola de prioridad), `getCampusGraph()` en caché | RF-13.20, RF-13.24 |
| `web/src/features/routing/utils/planRoute.ts` | Nuevo: `planRoute(origin, destination, graph?)` → `RouteResult`; resuelve coordenadas, aplica umbral y arma `path` y `distance` | RF-13.13, RF-13.20 a RF-13.24 |
| `web/src/features/routing/store/useRouteStore.ts` | Nuevo: `open`, `origin`, `destination`, `status`, `result`, `notice`; acciones `openDialog(destinationId?)`, `closeDialog`, `setOrigin`, `setDestination`, `swap`, `clear`, `chooseMyLocation` | RF-13.2, RF-13.3, RF-13.6, RF-13.8, RF-13.10 a RF-13.19, RF-13.25 a RF-13.27, RF-13.32 |
| `web/src/features/routing/components/RouteButton.tsx` | Nuevo: botón «Planificar ruta» (icono `Route`) que abre el diálogo | RF-13.1, RF-13.35 |
| `web/src/features/routing/components/RouteDialog.tsx` | Nuevo: título, dos campos, «Intercambiar», resultado/avisos, foco | RF-13.2 a RF-13.6, RF-13.12, RF-13.28 a RF-13.30, RF-13.34, RF-13.35 |
| `web/src/features/routing/components/RouteResult.tsx` | Nuevo: distancia y nombres, o aviso; región `status`/`alert` | RF-13.23, RF-13.24, RF-13.28, RF-13.29 |
| `web/src/features/map/components/PlaceCombobox.tsx` | Nuevo: campo + lista extraídos de `PlaceSearch`; props `label`, `value` (texto), `onChoose`, `onClear`, `onEdit`, `extraOptions`, `inputRef` | RF-13.7, RF-13.10, RF-13.11, RF-13.14, RF-13.36 |
| `web/src/features/map/components/PlaceSearch.tsx` | Modifica: queda como envoltorio de `PlaceCombobox` con `useMapStore` (comportamiento y tests de HU-11 intactos) | RF-13.9 |
| `web/src/components/Modal/Modal.tsx` | Modifica: foco inicial configurable, atrapar Tab, devolver foco al cerrar, `role="dialog"` ya existente | RF-13.4, RF-13.34 |
| `web/src/features/map/components/PlaceCard.tsx` | Modifica: botón «Cómo llegar»; Esc no cierra la ficha si hay un diálogo modal abierto | RF-13.31 a RF-13.33 |
| `web/src/features/map/components/CampusMap.tsx` | Modifica: monta `RouteButton` bajo el de ubicación y `RouteDialog` | RF-13.1, RF-13.5 |
| `web/src/features/routing/**/*.test.ts(x)`, `PlaceCombobox.test.tsx`, `Modal.test.tsx`, `PlaceCard.test.tsx`, `CampusMap.test.tsx` | Nuevos y ajustes (RF-12.13 se reemplaza por RF-13.31) | todos |
| `web-docs/spec/HU-12/spec.md` | Nota en el historial: RF-12.13 reemplazado por RF-13.31 | RF-13.31 |

## 4. Estado (stores) y comunicación
`useRouteStore`:
- `open: boolean`, `origin: RoutePoint | null`, `destination: RoutePoint | null`, `status: 'idle' | 'locating' | 'calculating' | 'done'`, `result: RouteResult | null`, `notice: string | null` (mensaje de ubicación, RF-13.17).
- `openDialog(destinationId?)`: abre; si trae `destinationId`, lo fija como destino (RF-13.32) y recalcula si ya hay origen. No toca `useMapStore`, así que la ficha sigue abierta (RF-13.33).
- `closeDialog()`: solo `open = false`; origen, destino y resultado se conservan (RF-13.6, RF-13.27). Es un estado en memoria: se pierde al recargar.
- `setOrigin(point | null)` / `setDestination(point | null)`: guardan, limpian `result` y `notice`, y llaman a `recompute()` (RF-13.25). Con `null` el resultado queda vacío y el diálogo no muestra nada (RF-13.30).
- `swap()`: intercambia y recalcula (RF-13.12).
- `recompute()`: si falta alguno → `status = 'idle'`, `result = null`. Si no → `status = 'calculating'`, cede un turno con `setTimeout(0)` para que React pinte el indicador y ejecuta `planRoute`. Un contador `requestId` descarta resultados viejos si el usuario cambió algo mientras tanto (RF-13.25, RF-13.26). El cálculo es síncrono y rápido; el estado `calculating` existe para que el indicador sea correcto si el grafo tarda en cargarse la primera vez.
- `chooseMyLocation()`:
  - `useLocationStore.permission` `'denied'` o `'unsupported'` → `origin` queda como estaba, `notice = 'No podemos usar tu ubicación. Elige un lugar como punto de partida.'` y no se pide nada (RF-13.17).
  - Otros casos → `status = 'locating'` (RF-13.16), `locate()` del store de ubicación (en `'prompt'`/`'unknown'` dispara la petición del navegador, RF-13.18). Éxito → `setOrigin({ kind: 'my-location', coordinates })`. Fallo → `notice = 'No pudimos obtener tu ubicación.'` y el origen sigue vacío.
  - `locate()` ya descarta lecturas duplicadas (RF-15.11); si devuelve `null` por estar ocupado, se trata como fallo (origen vacío y aviso). Mientras `status === 'locating'` el campo de origen se deshabilita para que no haya otra elección.
  - Usa `locate()` y no `position` guardada, para tener una lectura fresca (RF-13.15). Esto también actualiza el punto azul del mapa, lo cual es coherente con HU-15 (RF-15.17).

**Campos del diálogo.**
- `PlaceCombobox` recibe `value` (texto mostrado) y avisa `onEdit` al teclear; `RouteDialog` descarta el punto elegido en cuanto se edita el texto (RF-13.11) y mantiene el texto escrito en un estado local del campo.
- El texto mostrado para un `RoutePoint` sale de `pointLabel(point)`: nombre del lugar o «Mi ubicación».
- Para el origen, `extraOptions=[{ id: 'my-location', label: 'Mi ubicación' }]` se muestra como primera opción cuando el campo está enfocado y vacío (RF-13.14). El destino no pasa `extraOptions`.
- Elegir un resultado llama a `onChoose(place)` del diálogo (→ `setOrigin`/`setDestination`) y no toca `useMapStore` (RF-13.9).

**Foco y Esc.**
- `Modal` acepta `initialFocus?: RefObject` (por defecto el primer enfocable); `RouteDialog` pasa una función que elige el primer campo vacío (RF-13.4, RF-13.32 → «Punto de partida»).
- `Modal` guarda `document.activeElement` al abrir y lo restaura al cerrar; atrapa Tab/Shift+Tab dentro del diálogo.
- Esc: `PlaceCombobox` hace `stopPropagation` con su lista abierta (igual que hoy) → cierra solo la lista (RF-13.3). Si no, llega al `document` y `Modal` cierra. `PlaceCard` ignora Esc si existe `[aria-modal="true"]` en el documento, para que la ficha no se cierre a la vez (RF-13.33).

**Botón.** `RouteButton` se monta en el mismo contenedor `flex-col gap-2` de `CampusMap`, después del botón de ubicación (RF-13.1). Usa `IconButton` con `label="Planificar ruta"` (RF-13.35).

**HU-14.** Lee `useRouteStore.result` (`ok: true`) para dibujar `route.path`; esta historia no monta ninguna capa en el mapa (RF-13.27).

## 5. Decisiones
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Extraer `PlaceCombobox` de `PlaceSearch` | Duplicar el buscador en el diálogo | RF-13.7 pide el mismo comportamiento; un solo componente evita que diverjan |
| Nodo más cercano como entrada al grafo | Proyectar al segmento más cercano | Igual a la historia y a la app anterior; menos código. Se revisa si se ve mal a mano |
| Dijkstra propio con cola de prioridad | A\* | Sin heurística clara gana poco con ~cientos de nodos; Dijkstra ya existe y es suficiente |
| Cálculo síncrono en la página | Web Worker | Grafo de ~17 KB; un worker complica tests y el build sin beneficio |
| `useRouteStore` en memoria | Guardar en `sessionStorage` | RF-13.6 solo pide conservar al cerrar y reabrir el diálogo, no al recargar |
| `Modal` compartido mejorado | Diálogo propio nuevo | Reutiliza overlay, título y cierre; mejora también a otros usos |
| Lectura fresca con `locate()` | Reutilizar `position` guardada | Un origen viejo daría una ruta falsa si el usuario se movió (RF-13.15) |
| Umbral de 150 m como constante exportada | Número suelto en el código | Es una pregunta resuelta del spec y puede cambiar |
| Error por punto («origen/destino demasiado lejos») | Un solo error | RF-13.23 pide nombrar cuál de los dos está lejos |

## 6. Estrategia de pruebas
| Requisito | Test |
|---|---|
| RF-13.1 | `components/CampusMap.test.tsx` › el botón «Planificar ruta» está después del de ubicación |
| RF-13.2, RF-13.4 | `components/RouteDialog.test.tsx` › abre con dos campos vacíos y el foco en el primero |
| RF-13.3 | `components/RouteDialog.test.tsx` › Esc y «Cerrar» cierran; con la lista abierta, Esc solo la cierra |
| RF-13.5 | `components/RouteDialog.test.tsx` › `aria-modal="true"`; los botones del mapa siguen en el DOM |
| RF-13.6 | `store/useRouteStore.test.ts` › cerrar y abrir conserva origen, destino y resultado |
| RF-13.7 | `components/PlaceCombobox.test.tsx` › mínimo de caracteres, tildes, teclado, «No encontramos ese lugar» |
| RF-13.8, RF-13.9 | `components/RouteDialog.test.tsx` › elegir guarda el punto y no cambia `useMapStore` |
| RF-13.10, RF-13.11 | `components/RouteDialog.test.tsx` › «Limpiar» vacía y borra el resultado; editar el texto descarta el punto |
| RF-13.12 | `store/useRouteStore.test.ts` › `swap` intercambia, incluidos vacíos, y recalcula |
| RF-13.13 | `utils/planRoute.test.ts` y `components/RouteDialog.test.tsx` › mismo lugar → aviso, sin ruta |
| RF-13.14 | `components/RouteDialog.test.tsx` › «Mi ubicación» solo en el origen, con el campo vacío |
| RF-13.15 a RF-13.18 | `store/useRouteStore.test.ts` › permiso concedido usa la lectura; en curso → `locating` y sin cálculo; denegado o fallo → origen vacío y `notice`; `prompt` llama a `locate()`; denegado no la llama |
| RF-13.19, RF-13.25 | `store/useRouteStore.test.ts` › calcula solo al tener ambos; cambiar un punto recalcula y descarta el viejo (carrera con `requestId`) |
| RF-13.20 | `utils/pathfinder.test.ts` › grafo de prueba: camino más corto correcto, solo por aristas; `planRoute` con lugares reales del campus devuelve un `path` cuyos tramos intermedios están en el grafo |
| RF-13.21 | `utils/distance.test.ts` › haversine conocida; `formatDistance` (`320 m`, `999 m`, `1,2 km`, `1000 m` → `1,0 km`) |
| RF-13.22 | `utils/planRoute.test.ts` › la distancia suma tramos de acceso y camino |
| RF-13.23 | `utils/planRoute.test.ts` › origen/destino a > 150 m → `origin-too-far`/`destination-too-far`; a 150 m exactos pasa |
| RF-13.24 | `utils/planRoute.test.ts` › grafo con dos componentes → `no-path` |
| RF-13.26 | `store/useRouteStore.test.ts` y `components/RouteDialog.test.tsx` › estado `calculating`/`locating` muestra el indicador |
| RF-13.27 | `store/useRouteStore.test.ts` › el `result.route` queda guardado con `path` y `distance`; `components/CampusMap.test.tsx` › no hay capa de ruta |
| RF-13.28 a RF-13.30 | `components/RouteResult.test.tsx` › distancia y nombres; avisos con `role="alert"`; nada sin ambos puntos |
| RF-13.31 a RF-13.33 | `components/PlaceCard.test.tsx` › botón «Cómo llegar» abre el diálogo con el destino, foco en «Punto de partida», la ficha sigue abierta, Esc no la cierra |
| RF-13.34 a RF-13.36 | `components/Modal.test.tsx` y `RouteDialog.test.tsx` › atrapa Tab, devuelve el foco; nombres accesibles; lista como `listbox` |

Manual (token de Mapbox y, para los de ubicación, ubicación simulada con «Sensors» de Chrome): escenarios 1, 4, 6, 7, 14 y 17 en el mapa real; revisar con lugares reales del campus que las distancias sean razonables (por ejemplo, Biblioteca → Comedor) y que ningún lugar quede «sin camino» por estar en una isla del grafo.

## 7. Riesgos y dependencias
- **Grafo desconectado.** Si el JSON tiene tramos sin unir (digitalización), algunos lugares darán «sin camino». Se mide en T3 con un test que cuente componentes conexas; si hay islas, se anota y se corrige el archivo antes de cerrar la historia.
- **Lugares lejos de los caminos.** Puertas o canchas a > 150 m de cualquier nodo no tendrían ruta. Se comprueba con un test sobre todos los `PLACES` (T3); si falla alguno, se revisa si es un dato malo o si el umbral es corto.
- **Nodo más cercano vs. segmento.** Si el nodo más cercano está «detrás» del origen, la ruta hará un pequeño retroceso. Aceptado en esta historia; mejora posible en HU-14.
- **`Modal` compartido.** Cambiarlo puede afectar a otros usos y a `Modal.test.tsx`; se mantienen los tests actuales y se agregan los nuevos.
- **Dos Esc.** `PlaceCard` y `Modal` escuchan `document`; la regla de `aria-modal` evita el cierre doble (probada en T11).
- **Geolocalización por HTTP.** Igual que en HU-15, no funciona desde el celular por IP local; «Mi ubicación» queda no disponible.
- Depende de HU-10, HU-11, HU-12 y HU-15 (ya hechas). Prepara HU-14 (dibujo y tiempo) y HU-16.

## 8. Historial
- 2026-11-02 · Plan creado tras aprobar el spec.
- 2026-11-02 · Ejecutado. La acción se llama `chooseMyLocation` (un nombre `use…` en un store confunde a las reglas de hooks). `Modal` gana `initialFocus`, foco atrapado y devolución de foco. El Esc de la ficha se ignora si hay `[aria-modal="true"]`.
- 2026-11-02 · Ampliación (RF-13.37 a RF-13.41): `useRouteStore` gana `activeRoute` (la ruta dibujada, separada de `result`), `startRoute()` (copia `result.route` a `activeRoute` y cierra el diálogo) y `clearActiveRoute()`. Nuevo `RouteLayer` (fuente GeoJSON `LineString` + capa `line` con `slot="top"`, fuera de `interactiveLayerIds`) dentro de `<Map>`. `RouteDialog` añade «Iniciar ruta» (deshabilitado si `result` no es `ok`) y «Quitar ruta» (si hay `activeRoute`). La cámara no se mueve (HU-14).
- 2026-11-02 · Ampliación (RF-13.42): `FlyToRoute` dentro de `<Map>`; al cambiar `activeRoute` a una ruta nueva llama a `fitBounds` (2 s, `maxZoom` 19) con padding que descuenta la barra lateral (`--sidebar-w`), el buscador y el logo. No fija `pitch`, así que conserva la inclinación. Ignora la ruta ya presente al montar.
- 2026-11-02 · `fitBounds` de Mapbox reinicia inclinación y orientación si no se pasan: `FlyToRoute` pasa `getPitch()` y `getBearing()`. Botón de vista en `CampusMap`: `easeTo({ pitch: 0 | 60 })`, estado `flat` sincronizado con `onPitchEnd` (umbral 1°).
- 2026-11-02 · Ampliación (RF-13.46 a RF-13.49): `Modal` gana `mobileSheet` (por debajo de `md`: arriba, ancho completo, esquinas inferiores redondeadas, animación `sheet-down` con `motion-safe`, `max-h` 85dvh y `env(safe-area-inset-top)`). Asa inferior con Pointer Events; `shouldCloseSheet(dy)` en `Modal/sheet.ts` (umbral 80 px). Sin animación de salida. Solo `RouteDialog` lo usa.
