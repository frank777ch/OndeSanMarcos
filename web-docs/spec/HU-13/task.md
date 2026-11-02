# HU-13 · Tareas

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

## Tareas
- [x] T1 · Spec escrita y aprobada (todos)
- [x] T2 · Plan y tareas escritos
- [x] T3 · Copiar `rutas-caminos-completo.json` a `features/routing/data/campus-paths.json`; `utils/distance.ts` (`haversine`, `pathLength`, `formatDistance`) + `distance.test.ts` (RF-13.21)
- [x] T4 · `utils/pathfinder.ts` (`buildGraph`, `nearestNode`, `shortestPath` con Dijkstra, grafo en caché) + `pathfinder.test.ts` con un grafo pequeño, incluido uno desconectado (RF-13.20, RF-13.24)
- [x] T5 · `utils/planRoute.ts` (resolver coordenadas, umbral de 150 m, mismo lugar, tramos de acceso, `path` y `distance`) + `planRoute.test.ts` (RF-13.13, RF-13.20 a RF-13.24)
- [x] T6 · Tests de datos reales: todos los `PLACES` quedan a ≤ 150 m de un nodo y el grafo no tiene islas que dejen lugares sin camino; anotar en «Pendiente / notas» lo que falle (RF-13.20, RF-13.23, RF-13.24)
- [x] T7 · `store/useRouteStore.ts` (diálogo, origen, destino, `swap`, `recompute` con `requestId`, `useMyLocation`, `notice`) + `useRouteStore.test.ts` (RF-13.6, RF-13.12, RF-13.15 a RF-13.19, RF-13.25 a RF-13.27, RF-13.32)
- [x] T8 · Extraer `components/PlaceCombobox.tsx` de `PlaceSearch` y dejar `PlaceSearch` como envoltorio; los tests de HU-11 siguen en verde; `PlaceCombobox.test.tsx` (RF-13.7, RF-13.14, RF-13.36)
- [x] T9 · `Modal`: foco inicial, atrapar Tab y devolver el foco + tests nuevos en `Modal.test.tsx` (RF-13.4, RF-13.34)
- [x] T10 · `RouteResult.tsx` y `RouteDialog.tsx` (campos, «Limpiar», «Intercambiar», «Mi ubicación», indicador, avisos) + tests (RF-13.2 a RF-13.5, RF-13.8 a RF-13.14, RF-13.28 a RF-13.30, RF-13.35)
- [x] T11 · `PlaceCard`: botón «Cómo llegar», Esc ignorado si hay diálogo modal; reemplazar el test de RF-12.13 por RF-13.31 a RF-13.33 (RF-13.31 a RF-13.33)
- [x] T12 · `RouteButton.tsx` y montaje de botón y diálogo en `CampusMap`; ajustar `CampusMap.test.tsx` (RF-13.1, RF-13.5, RF-13.27)
- [x] T13 · Nota en `HU-12/spec.md` (historial): RF-12.13 queda reemplazado por RF-13.31
- [x] T14 · Probar a mano con el mapa real: escenarios 1, 4, 6, 7, 14 y 17 y distancias de varios pares de lugares

- [x] T15 · Ampliación: `activeRoute`, `startRoute`, `clearActiveRoute` en el store; `RouteLayer`; botones «Iniciar ruta» y «Quitar ruta» en el diálogo + tests (RF-13.37 a RF-13.41)
- [x] T16 · Ampliación: `FlyToRoute` (`fitBounds` con animación y márgenes por barra lateral, buscador y logo) + tests (RF-13.42)
- [x] T17 · Ampliación: pitch y bearing fijos en `FlyToRoute`; botón «Vista 2D/3D» en `CampusMap` con `onPitchEnd` + tests (RF-13.42 a RF-13.45)
- [x] T18 · Ampliación: `Modal` con `mobileSheet` (arriba, animación, asa con arrastre), `shouldCloseSheet`, animación `sheet-down` y `RouteDialog` con `mobileSheet` + tests (RF-13.46 a RF-13.49)

## Verificación final
- [x] `npm run test` en verde (282 tests)
- [x] `npm run build` sin errores
- [x] `npm run lint` sin avisos
- [x] Escenarios de `spec.md` comprobados (manuales con mapa real: 1, 4, 6, 7, 14, 17, 18, 23 y 24; el resto, por tests)
- [x] `spec.md` en «Implementada»; tabla resumen y título en `../../histories.md` con ✅
- [ ] Commit `feat(web): HU-13 …` con spec, plan, task y código

## Pendiente / notas
- T6: los datos reales pasan: todos los lugares están a ≤ 150 m de un camino y quedan conectados entre sí.
- T14 y los escenarios manuales comprobados a mano con el mapa real.
- El tiempo a pie, el dibujo de la línea y la cancelación de la ruta son de HU-14: aquí solo se calcula y se guarda.
- Elegir un punto tocando el mapa quedó fuera por decisión (P2).
- Sin HTTPS no hay geolocalización desde el celular por IP local (igual que HU-15).
