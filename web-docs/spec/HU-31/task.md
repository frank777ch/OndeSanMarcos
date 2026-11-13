# HU-31 · Tareas

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

> `task.md` es la lista de trabajo, en el orden en que se ejecuta. Cada tarea es pequeña (≲ 1 h) y apunta al requisito que cubre. Se marca `[x]` al terminar.

## Tareas
- [x] T1 · `client.ts`: `PUT`/`DELETE`, respuesta 204, `ApiError.body` y opción `fresh` (`cache: 'no-cache'`); `adminClient.put/delete`; tests (RF-31.34, RF-31.17)
- [x] T2 · `usePlacesStore.refresh()` sin parpadeo, conservando datos si falla, con `fresh`; tests (RF-31.33)
- [x] T3 · `Modal`: opción `blurBackdrop` y tamaño ancho; tests (RF-31.11, RF-31.12)
- [x] T4 · `Combobox` genérico con búsqueda, valores cerrados y teclado; tests (RF-31.14, RF-31.35)
- [x] T5 · `Pagination` y `ConfirmDialog`; tests (RF-31.6a, RF-31.7, RF-31.31)
- [x] T6 · `adminPlacesApi.ts`: tipos, llamadas, `toInput` y `parseFieldErrors`; tests (RF-31.9, RF-31.16, RF-31.17, RF-31.20, RF-31.28)
- [x] T7 · Utilidades puras: `filters.ts` (filtrar, paginar, `clampPage`), `form.ts` (formulario, listas por línea, `descendantIds`, `isDirty`, `canSubmit`) y `bounds.ts`; tests (RF-31.4, RF-31.6a, RF-31.13 a RF-31.15, RF-31.24)
- [x] T8 · `useAdminPlacesStore`: carga, filtros, página, guardar, acciones de fila, aviso del asistente y refresco del público; tests (RF-31.2, RF-31.3, RF-31.6, RF-31.8 a RF-31.10, RF-31.16, RF-31.20, RF-31.33)
- [x] T9 · `PlacesTable` y `PlaceRowActions` (buscador, filtros, contador, vacío, paginación, publicar y verificar); tests (RF-31.2 a RF-31.10, RF-31.35)
- [x] T10 · `LocationPicker` (Mapbox 2D, marcador arrastrable, área permitida, puntos grises, respaldo sin token), cargado con `React.lazy`; tests con el mapa simulado (RF-31.21 a RF-31.27)
- [x] T11 · `PlaceFormDialog`: secciones, selectores, errores por campo, foco, confirmación de descarte, mensaje de red; tests (RF-31.11 a RF-31.19)
- [x] T12 · `RagWarning` con «Reintentar»; tests (RF-31.20)
- [x] T13 · Categorías: store, `CategoriesTable`, `CategoryFormDialog` (selector de color y `#RRGGBB`) y borrado con confirmación; tests (RF-31.28 a RF-31.32)
- [x] T14 · Páginas, rutas `/admin/lugares` y `/admin/categorias` y pestañas en `AdminLayout`; tests (RF-31.1)
- [x] T15 · `fixtures/adminPlaces.ts` y revisión de que ningún test usa red ni token (RF-31.36)
- [x] T16 · Documentación: sección de administración en el README de la web
- [ ] T17 · Prueba manual en el navegador con backend y token: escenarios 1 a 12, el difuminado y el arrastre del marcador

## Verificación final
- [x] `npm run test` (63 archivos, 533 pruebas), `tsc`, `npm run build` y `npm run lint` en verde en `web/`; `LocationPicker` es un chunk aparte y `mapbox-gl` no entra en el de `/admin`
- [ ] Escenarios de `spec.md` comprobados (anotar los que dependen de HU-30 o HU-29)
- [ ] `spec.md` en «Implementada»; tabla resumen y título en `../../histories.md` con ✅
- [ ] Commit `feat(web): HU-31 …` con spec, plan, task y código

## Pendiente / notas
- Pendiente: la prueba manual en el navegador (T17) con backend y token de Mapbox; el difuminado y el arrastre del marcador no se pueden comprobar en jsdom. La API de HU-30 ya existe y se probó con `curl`.
- Se actualizó la prueba de `AdminLayout` de HU-26 (RF-26.15 decía «una sola pestaña»): ahora son tres.
- `PlaceCombobox` y `Combobox` quedan separados; unificarlos es una limpieza futura.
- Texto de error del asistente en `userMessageFor`: las pantallas de administración usan sus propios mensajes.
