# HU-12 · Tareas

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

## Tareas
- [x] T1 · Spec escrita y aprobada (todos)
- [x] T2 · Plan y tareas escritos
- [x] T3 · Datos: ampliar `Place` y cargar los campos de ficha con el script (RF-12.1, RF-12.2)
- [x] T4 · Actualizar `data/places.test.ts` (campos presentes y ausentes, conteos, economicas en 27 y 31) (RF-12.1, RF-12.2)
- [x] T5 · Store: `selectionOrigin`, `selectPlace(id, origin)`, `clearSelection` y `toggleCategory` que cierra la ficha si oculta el lugar + tests (RF-12.3, RF-12.5, RF-12.8)
- [x] T6 · `placeIdFromFeatures` en `utils/places.ts` + test (RF-12.3)
- [x] T7 · `FlyToSelection`: no vuela con origen `map` + test (RF-12.3)
- [x] T8 · `PlaceCard` (contenido, cierre con botón y Esc, foco, `role="dialog"`) + `PlaceCard.test.tsx` (RF-12.6, RF-12.9 a RF-12.13, RF-12.16)
- [x] T9 · `MapOverlay` (columna con buscador, filtros y tarjeta; margen inferior) y borrar `MapToolbar` (RF-12.14, RF-12.15, RF-12.17)
- [x] T10 · `CampusMap`: clic en puntos, cursor, `MapOverlay`; actualizar el mock de `react-map-gl` en sus tests (RF-12.3, RF-12.5, RF-12.7)
- [x] T11 · `PlaceSearch`: texto sincronizado con la selección y Esc con lista abierta que no se propaga + tests (RF-12.4, RF-12.6, RF-12.18)
- [x] T12 · Nota en el historial de `HU-11/spec.md` y `HU-11/plan.md`

## Verificación final
- [x] `npm run test` en verde (108 tests)
- [x] `npm run build` sin errores
- [x] `npm run lint` sin avisos
- [ ] Escenarios de `spec.md` con el mapa real (manual, requiere token de Mapbox): 1, 6, 7, 10 y 14. El resto está cubierto por tests.
- [x] `spec.md` en «Implementada»; tabla resumen y título en `../../histories.md` con ✅
- [x] Commit `feat(web): HU-12 …` con spec, plan, task y código

## Pendiente / notas
- Datos «demo» sin verificar con la universidad (horarios, teléfonos, carreras).
- El botón «Cómo llegar» lo añade HU-13.
- Cambio en datos: 38 lugares con información y 17 con ficha mínima (Ciencias Económicas ocupa dos puntos, 27 y 31).
- Falta comprobar a mano en el navegador: toque en puntos, cursor, ubicación de la tarjeta, logo de Mapbox visible y scroll interno en fichas largas.
