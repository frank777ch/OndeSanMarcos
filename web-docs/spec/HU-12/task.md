# HU-12 · Tareas

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

## Tareas
- [x] T1 · Spec escrita y aprobada (todos)
- [x] T2 · Plan y tareas escritos
- [ ] T3 · Datos: ampliar `Place` y cargar los campos de ficha con el script (RF-12.1, RF-12.2)
- [ ] T4 · Actualizar `data/places.test.ts` (campos presentes y ausentes, conteos, economicas en 27 y 31) (RF-12.1, RF-12.2)
- [ ] T5 · Store: `selectionOrigin`, `selectPlace(id, origin)`, `clearSelection` y `toggleCategory` que cierra la ficha si oculta el lugar + tests (RF-12.3, RF-12.5, RF-12.8)
- [ ] T6 · `placeIdFromFeatures` en `utils/places.ts` + test (RF-12.3)
- [ ] T7 · `FlyToSelection`: no vuela con origen `map` + test (RF-12.3)
- [ ] T8 · `PlaceCard` (contenido, cierre con botón y Esc, foco, `role="dialog"`) + `PlaceCard.test.tsx` (RF-12.6, RF-12.9 a RF-12.13, RF-12.16)
- [ ] T9 · `MapOverlay` (columna con buscador, filtros y tarjeta; margen inferior) y borrar `MapToolbar` (RF-12.14, RF-12.15, RF-12.17)
- [ ] T10 · `CampusMap`: clic en puntos, cursor, `MapOverlay`; actualizar el mock de `react-map-gl` en sus tests (RF-12.3, RF-12.5, RF-12.7)
- [ ] T11 · `PlaceSearch`: texto sincronizado con la selección y Esc con lista abierta que no se propaga + tests (RF-12.4, RF-12.6, RF-12.18)
- [ ] T12 · Nota en el historial de `HU-11/spec.md` y `HU-11/plan.md`

## Verificación final
- [ ] `npm run test` en verde
- [ ] `npm run build` sin errores
- [ ] `npm run lint` sin avisos
- [ ] Escenarios 1–14 de `spec.md` comprobados (anotar los manuales, que requieren token de Mapbox)
- [ ] `spec.md` en «Implementada»; tabla resumen y título en `../../histories.md` con ✅
- [ ] Commit `feat(web): HU-12 …` con spec, plan, task y código

## Pendiente / notas
- Datos «demo» sin verificar con la universidad (horarios, teléfonos, carreras).
- El botón «Cómo llegar» lo añade HU-13.
