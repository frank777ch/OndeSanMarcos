# HU-40 · Tareas

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

> Se trabaja en la rama `test/own-map`. Cada fase deja la app funcionando; `<Map>` de Mapbox se sustituye solo en la fase 6.

## Fase 1 · Datos y proyección
- [x] T1 · Script `scripts/fetch-campus-osm.mjs` (Overpass → contorno, edificios con altura, verde) (RF-40.2, 40.3)
- [x] T2 · Generar `campus-osm.json`, revisarlo (geojson.io) y anotar cuántos edificios usan la altura por defecto (RF-40.2)
- [x] T3 · `projection.ts` con `toLocal`/`fromLocal` y sus tests (RF-40.2)
- [x] T4 · Test de los datos: polígonos cerrados y alturas positivas (RF-40.3)

## Fase 2 · Escena estática y cámara
- [x] T5 · Instalar `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three` (RF-40.1)
- [x] T6 · Variables `--map-*` en claro y oscuro y `useMapColors` con su test (RF-40.15)
- [x] T7 · `CampusScene` con `Ground`, `GreenAreas`, `Paths`, `Buildings` y atribución a OpenStreetMap (RF-40.2, 40.3, 40.4)
- [x] T8 · `Boundary` punteado (RF-40.8)
- [x] T9 · `cameraStore` y `CampusCamera`: desplazar, zoom, girar/inclinar, límites, vuelo, 3D/2D (RF-40.5, 40.6, 40.7)
- [x] T10 · Pantalla de prueba de la escena (ruta temporal) y revisión visual en claro/oscuro

## Fase 3 · Lugares
- [x] T11 · `PlaceMarkers`: puntos por categoría, nombres, filtro y clic a nivel del suelo (RF-40.9)
- [x] T12 · `FlyToSelection` con el store de cámara (RF-40.10)

## Fase 4 · Ruta
- [x] T13 · `RouteLine` con hover/tap, grosor y prioridad sobre los lugares (RF-40.11, 40.12)
- [x] T14 · `RouteRemoveButton` con `Html` de drei (RF-40.12)
- [x] T15 · `FlyToRoute` con `fitPoints`, descontando barra lateral, buscador y filtros (RF-40.11)

## Fase 5 · Ubicación
- [x] T16 · `UserLocation` (punto y halo) (RF-40.13)
- [x] T17 · Botón de ubicación y «Volver al campus» con el store de cámara; ampliar límites si la posición cae fuera (RF-40.6, 40.14)

## Fase 6 · Sustitución y cierre
- [x] T18 · `CampusMap` usa `CampusScene`; quitar token de Mapbox, eventos de Mapbox y `ResizeObserver`; retirar `RouteLayer`, `PlacesLayer`, `UserLocationLayer` (RF-40.1, 40.16)
- [x] T19 · Reescribir `CampusMap.test.tsx` y demás tests que mockean `react-map-gl` (todos)
- [x] T20 · Carga diferida: comprobar que three y los datos solo se descargan en `/mapa` (RF-40.18)
- [ ] T21 · Medir fluidez en escritorio y celular, y optimizar si hace falta (RF-40.17)
- [x] T22 · Actualizar los requisitos de HU-12, HU-13, HU-15 y HU-28 que mencionan Mapbox

## Verificación final
- [x] `npm run test` en verde (76 archivos, 592 pruebas)
- [x] `npm run build` sin errores (el mapa va en un paquete aparte, MapPage, que solo se descarga en /mapa)
- [x] `npm run lint` sin avisos
- [ ] Escenarios de `spec.md` comprobados (anotar los que son manuales)
- [ ] `spec.md` en «Implementada»; tabla resumen y título en `../../histories.md` con ✅
- [ ] Decidir qué se hace con `LocationPicker` y con `mapa-threejs-plan.md` (borrar o conservar)
- [ ] Commit `feat(web): HU-40 …` con spec, plan, task y código

## Pendiente / notas
- Probado con capturas en un Chromium sin cabeza (escritorio): vista inicial, lugares, nombres, selección, ruta con «X», 2D. Falta probar a mano en el navegador: gestos (arrastrar, zoom, girar), táctil, tema oscuro, ubicación real y fluidez (T21).
- Nombres de los lugares: se muestran con la cámara a menos de 900 m; en zonas densas pueden solaparse (sin detección de colisiones).
- Detalle visual bajo al inicio (bloques y sombreado suave); se refina después.
- `LocationPicker` sigue con Mapbox hasta decidirlo al terminar.
