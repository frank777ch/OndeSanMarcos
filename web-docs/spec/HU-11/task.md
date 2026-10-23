# HU-11 · Tareas

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

## Tareas
- [x] T1 · Spec escrita y aprobada (todos)
- [x] T2 · Plan y tareas escritos
- [ ] T3 · Datos: ampliar `data/places.ts` a 55 lugares, `keywords` y 9 categorías, según la tabla de equivalencias del plan (RF-11.1 a RF-11.5)
- [ ] T4 · Actualizar `data/places.test.ts` (conteos, ids únicos, 15 nuevos, FISI) (RF-11.1 a RF-11.5)
- [ ] T5 · `utils/search.ts` con `normalizeText` y `searchPlaces` + `utils/search.test.ts` (RF-11.7 a RF-11.10, RF-11.12)
- [ ] T6 · `useMapStore`: `selectedPlaceId`, `selectPlace` (quita el filtro si oculta el lugar), `clearSelection` + tests (RF-11.13, RF-11.15, RF-11.16)
- [ ] T7 · `PlaceSearch` (cuadro combinado, teclado, limpiar, sin resultados) + `PlaceSearch.test.tsx` (RF-11.6 a RF-11.17)
- [ ] T8 · `MapToolbar`; `CategoryChips` deja de posicionarse solo; ajustar su test (RF-11.5, RF-11.6)
- [ ] T9 · `FlyToSelection` + test con `useMap` simulado (RF-11.13)
- [ ] T10 · `PlacesLayer`: capa del anillo de resaltado con `selectedFilter(id)` en `utils/places.ts` + test (RF-11.14)
- [ ] T11 · Integrar todo en `CampusMap` y actualizar el mock de `CampusMap.test.tsx`
- [ ] T12 · Actualizar `HU-10/spec.md` (RF-10.1, RF-10.2, RF-10.5) y su historial

## Verificación final
- [ ] `npm run test` en verde
- [ ] `npm run build` sin errores
- [ ] `npm run lint` sin avisos
- [ ] Escenarios 1–12 de `spec.md` comprobados (anotar los manuales, que requieren token de Mapbox)
- [ ] `spec.md` en «Implementada» y ✅ en `../../histories.md`
- [ ] Commit `feat(web): HU-11 …` con spec, plan, task y código

## Pendiente / notas
- Limpieza de datos pendiente: el punto 23 repite el nombre del 25.
