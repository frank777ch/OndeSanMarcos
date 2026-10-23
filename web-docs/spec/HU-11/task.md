# HU-11 · Tareas

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

## Tareas
- [x] T1 · Spec escrita y aprobada (todos)
- [x] T2 · Plan y tareas escritos
- [x] T3 · Datos: ampliar `data/places.ts` a 55 lugares, `keywords` y 9 categorías, según la tabla de equivalencias del plan (RF-11.1 a RF-11.5)
- [x] T4 · Actualizar `data/places.test.ts` (conteos, ids únicos, 15 nuevos, FISI) (RF-11.1 a RF-11.5)
- [x] T5 · `utils/search.ts` con `normalizeText` y `searchPlaces` + `utils/search.test.ts` (RF-11.7 a RF-11.10, RF-11.12)
- [x] T6 · `useMapStore`: `selectedPlaceId`, `selectPlace` (quita el filtro si oculta el lugar), `clearSelection` + tests (RF-11.13, RF-11.15, RF-11.16)
- [x] T7 · `PlaceSearch` (cuadro combinado, teclado, limpiar, sin resultados) + `PlaceSearch.test.tsx` (RF-11.6 a RF-11.17)
- [x] T8 · `MapToolbar`; `CategoryChips` deja de posicionarse solo; ajustar su test (RF-11.5, RF-11.6)
- [x] T9 · `FlyToSelection` + test con `useMap` simulado (RF-11.13)
- [x] T10 · ~~Capa del anillo de resaltado~~ (hecha y luego retirada junto con RF-11.14)
- [x] T11 · Integrar todo en `CampusMap` y actualizar el mock de `CampusMap.test.tsx`
- [x] T12 · Actualizar `HU-10/spec.md` (RF-10.1, RF-10.2, RF-10.5) y su historial

## Verificación final
- [x] `npm run test` en verde (73 tests)
- [x] `npm run build` sin errores
- [x] `npm run lint` sin avisos
- [ ] Escenarios 1–12 de `spec.md` comprobados (anotar los manuales, que requieren token de Mapbox)
- [x] `spec.md` en «Implementada» y ✅ en `../../histories.md`
- [x] Commit `feat(web): HU-11 …` con spec, plan, task y código

## Pendiente / notas
- Limpieza de datos pendiente: el punto 23 repite el nombre del 25.
- Falta comprobar a mano los escenarios 1–12 en el navegador (requiere token de Mapbox). En especial el vuelo de la cámara.
- Hallazgo al implementar: la sigla «fisi» está dentro de «Físicas»; se corrigió la spec (RF-11.10) para que la palabra clave exacta vaya primero.
- Cambio posterior: se retiró el anillo de resaltado y el contorno de foco del buscador.
