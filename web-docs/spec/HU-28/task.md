# HU-28 · Tareas

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

> `task.md` es la lista de trabajo, en el orden en que se ejecuta. Cada tarea es pequeña (≲ 1 h) y apunta al requisito que cubre. Se marca `[x]` al terminar.

## Tareas
- [x] T1 · `features/map/types.ts` con `Place` ampliado, `PlaceCategory` y `PlaceCategoryId = string` (RF-28.2, RF-28.10)
- [x] T2 · `services/api/placesApi.ts`: peticiones en paralelo, validación y `toPlace`; tests con `fetch` simulado (RF-28.1, RF-28.2, RF-28.4, RF-28.5)
- [x] T3 · `usePlacesStore`: estado, `load`, `byId`, `visibleCategories`, mensaje de error y tests (RF-28.1, RF-28.3 a RF-28.6, RF-28.8, RF-28.13)
- [x] T4 · `src/test/fixtures/places.ts` con lugares y categorías de ejemplo y `seedPlaces()` (RF-28.16)
- [x] T5 · Llamar a `load()` desde `main.tsx` (RF-28.1)
- [x] T6 · `useMapStore` y `planRoute` leen del store; adaptar sus tests (RF-28.8, RF-28.11, RF-28.12)
- [x] T7 · `utils/places.ts` (`placesToGeoJSON` con colores de categoría) y `PlacesLayer`; adaptar tests (RF-28.3, RF-28.7)
- [x] T8 · `CategoryChips` desde el store, con iconos por defecto y categorías vacías ocultas; adaptar tests (RF-28.3, RF-28.8)
- [x] T9 · `PlaceSearch`, `PlaceCombobox` y `search.ts` (nombre corto); adaptar tests (RF-28.3, RF-28.9)
- [x] T10 · `PlaceCard` y `FlyToSelection`: lectura del store y nuevas secciones (correo, web `http(s)`, «Cómo encontrarlo»); adaptar tests (RF-28.10, RF-28.11)
- [x] T11 · `PlacesStatus` (carga y error con «Reintentar») dentro de `MapOverlay` y sus tests (RF-28.3 a RF-28.5)
- [x] T12 · Chat: `useChatStore` guarda todas las ubicaciones; `AssistantMessage` filtra al renderizar; `mockChat` lee del store; adaptar tests (RF-28.14, RF-28.6)
- [x] T13 · Borrar `data/places.ts`, `data/places.test.ts` y `scripts/dump-places.mjs`; test que verifica que no quedan; ajustar `backend/README.md` (RF-28.6, RF-28.15)
- [x] T14 · Revisar que no queden importaciones de `PLACES` ni `PLACE_CATEGORIES` y que `PlaceCategoryId` compile como `string` (`npm run build`) (RF-28.6, RF-28.13)

## Verificación final
- [x] `npm run test` en verde sin backend: 51 archivos, 383 pruebas
- [x] `npm run build` sin errores (y `tsc` sin errores)
- [x] `npm run lint` sin avisos
- [ ] Escenarios de `spec.md` comprobados. Por pruebas automáticas: 1 (store y capa de puntos), 2, 3, 4, 6, 7, 8 (rutas con lugares cargados), 9 y 10. **Pendiente a mano** en el navegador con Mapbox y el backend real: 1, 3, 4 (apagar backend y base y pulsar «Reintentar»), 5 (cambiar un horario en la base y recargar) y 7 con un lugar que tenga correo, web y «cómo encontrarlo» (hoy ningún lugar de la base los tiene). Contra el backend real solo se comprobó la capa de datos (54 lugares, 9 categorías, búsqueda y GeoJSON).
- [ ] `spec.md` en «Implementada» (cuando se cierre la verificación manual); tabla resumen y título en `../../histories.md` con ✅
- [ ] Commit `feat(web): HU-28 …` con spec, plan, task y código

## Pendiente / notas
- Falta el commit `feat(web): HU-28 …` (a pedido del equipo).
- Verificación manual en el navegador (ver arriba): no se hizo porque requiere token de Mapbox y abrir la web.
- Se conservaron las comprobaciones RF-13.23 y RF-13.24 (todos los lugares a ≤ 150 m de un camino y conectados) leyendo la semilla `backend/db/seed/places.json` con `import.meta.glob`; se omiten solos si el repo no está completo (p. ej. en el contenedor de la web, que solo monta `web/`).
- `PLACE_CATEGORIES` y el orden de botones ya no están en el código: el orden es el de `sort_order` de la base. «Otros» no se muestra hoy porque no tiene lugares.
- Alinear los ids que devuelve el asistente con los de la tabla: HU-29.
- Marcar al visitante los datos sin verificar: queda para cuando el equipo empiece a verificarlos.
