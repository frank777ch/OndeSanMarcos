# HU-36 · Tareas

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

- [x] T1 · Migración `V5__place_search.sql` y aplicarla a la base de desarrollo
- [x] T2 · `Database.search_places` + protocolo `PlacesStore` + `FakeDatabase.search_places`
- [x] T3 · Endpoint `GET /api/places/search` (antes de `/places/{place_id}`) y pruebas unitarias
- [x] T4 · Pruebas de integración contra Postgres real
- [x] T5 · Documentación en `backend/README.md`
- [x] T6 · Web: `signal` en `apiClient.get` y `searchPlacesApi`
- [x] T7 · Web: hook `usePlaceSearch` y pruebas
- [x] T8 · Web: `PlaceCombobox` usa el hook
- [ ] T9 · Prueba manual: «bibliotca» en el mapa y en «Planificar ruta»; backend apagado

## Verificación final
- [x] Backend y web completos en verde (pytest unitarias e integración; web 64 archivos / 544 pruebas, tsc, lint, build)
- [ ] `spec.md` en «Implementada»; ✅ en `../../histories.md`
- [ ] Commit `feat(...): HU-36 …`

## Notas
- Pendiente T9: probar en el navegador («bibliotca» en el mapa y en «Planificar ruta»; backend apagado).
- Cambio de comportamiento (RF-36.18): el aviso «No encontramos ese lugar» espera la respuesta del servidor (o su fallo), para no decir «nada» antes de que lleguen coincidencias aproximadas. Se ajustaron dos pruebas existentes (RF-13.7, RF-11.9).
- `src/test/setup.ts` ahora hace que `fetch` falle por defecto en todas las pruebas (sin red real).
- Nueva acción `usePlacesStore.addMissing` (RF-36.17).
