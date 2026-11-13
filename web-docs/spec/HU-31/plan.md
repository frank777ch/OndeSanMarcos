# HU-31 · Plan técnico

- **Spec:** [spec.md](spec.md)
- **Estado:** Aprobado

## 1. Enfoque
Todo vive en la web (`web/src`), en una carpeta nueva `features/admin/places/` y otra `features/admin/categories/`, apoyada en tres piezas compartidas:
1. **Cliente autenticado ampliado** (`adminClient` y `apiClient`): `PUT`, `DELETE`, respuestas 204 y el cuerpo de los errores, para poder mostrar los 422 de HU-30 junto a cada campo.
2. **Componentes comunes** nuevos: `Combobox` genérico (selector con búsqueda y valores cerrados), `Pagination`, `ConfirmDialog` y la opción `blurBackdrop` del `Modal` existente.
3. **Mapa de ubicación** (`LocationPicker`): un `react-map-gl/mapbox` pequeño y plano, cargado de forma diferida igual que `/mapa` para no meter `mapbox-gl` (≈ 1,9 MB) en el resto de `/admin`.

Los datos de administración van en dos stores de Zustand (`useAdminPlacesStore`, `useAdminCategoriesStore`), separados de `usePlacesStore` (lo que ve el visitante). Tras guardar, el store de administración se actualiza con lo que devuelve el servidor y se **refresca** el store público para que `/mapa` muestre el cambio en la misma sesión (RF-31.33).

Los filtros, la búsqueda y la página viven en el store de administración, no en el componente: así se conservan mientras el diálogo está abierto y al volver de otra pestaña (RF-31.6).

## 2. Datos y tipos
**`services/api/client.ts`:**
- `request` admite `'PUT' | 'DELETE'` además de `GET` y `POST`; el `Content-Type` se envía también en `PUT`.
- Una respuesta 204 (o sin cuerpo) devuelve `undefined` en vez de fallar con `invalid`.
- `ApiError` guarda `body?: unknown` con el JSON de un error HTTP (si lo hay). `message` no cambia: sigue siendo el texto para el usuario y **no** se muestra el `detail` técnico. Se añade el mensaje para 409 y 405 en `userMessageFor` solo si no rompe los textos del asistente; si no, las pantallas de administración muestran su propio texto.
- `apiClient.put` y `apiClient.delete`; `adminClient.put` y `adminClient.delete` pasan por `authenticated` (token y cierre de sesión en 401, RF-31.34).
- Se corrige el texto de error del asistente: `userMessageFor` habla del «asistente»; las pantallas de administración usan su propio mensaje (RF-31.18) en lugar de `error.message`.

**`services/api/adminPlacesApi.ts`:**
- Tipos crudos y de dominio: `AdminPlace` (todos los campos de `PlaceAdminOut` en camelCase: `id`, `name`, `shortName`, `categoryId`, `lat`, `lng`, `keywords`, `description`, `schedule`, `detailedSchedule`, `phone`, `annex`, `email`, `website`, `accessHint`, `careers`, `services`, `usage`, `imageUrl`, `parentPlaceId`, `isPublished`, `verifiedAt`, `createdAt`, `updatedAt`, `updatedBy`), `AdminPlaceInput` (lo que acepta `PlaceIn`: sin `id`, `createdAt`, `updatedBy`; con `verified: boolean`) y `AdminCategory` (`id`, `label`, `color`, `sortOrder`, `placesCount`).
- Funciones: `listAdminPlaces()`, `createPlace(input)`, `updatePlace(id, input)`, `reindexPlace(id)`, `listAdminCategories()`, `createCategory(input)`, `updateCategory(id, input)`, `deleteCategory(id)`. Las de guardar devuelven `{ place, ragSync }`.
- `toInput(place, changes)`: convierte un `AdminPlace` en un `AdminPlaceInput` completo (`verified = verifiedAt != null`) con los cambios aplicados; lo usan las acciones de fila (RF-31.9).
- Errores: `parseFieldErrors(error): { fields: Record<string, string>, general?: string }` lee `error.body.detail` de FastAPI (`[{loc: ["body","email"], msg}]`; para 409/otros, `detail` como texto). Convierte `loc` a nombres de campo del formulario (`category_id → categoryId`) y se queda con el primer mensaje por campo. Un error sin campo conocido va a `general`.

**Stores** (`features/admin/…/store/`):
- `useAdminPlacesStore`: `status` (`idle|loading|ready|error`), `places`, `filters {q, categoryId, published: 'all'|'yes'|'no', verified: 'all'|'yes'|'no'}`, `page`, `busyIds: Set<string>`, `ragWarning: {placeId} | null`; acciones `load()`, `setFilters()`, `setPage()`, `save(id | null, input)`, `togglePublished(place)`, `toggleVerified(place)`, `retryReindex()`. Selectores `selectFiltered` y `selectPage` (20 por página, `clampPage`) en `utils/`.
- `useAdminCategoriesStore`: `status`, `categories`, `load()`, `save`, `remove`.
- Tras un guardado correcto de lugar o categoría: `usePlacesStore.getState().refresh()` (ver abajo).

**`usePlacesStore.refresh()`** (nueva acción de HU-28): vuelve a pedir lugares y categorías aunque ya estén cargados, **sin** pasar por `status = loading` (no parpadea la pantalla) y con `cache: 'no-cache'` en la petición, para saltarse el `max-age` de 60 s de HU-27 (RF-31.33). Si falla, conserva los datos que ya tenía. `fetchPlacesAndCategories` admite una opción `{ fresh: true }` que `apiClient.get` traduce a esa cabecera de caché.

**Utilidades puras** (`features/admin/places/utils/`):
- `filters.ts`: `filterPlaces(places, filters)` con `normalizeText` de `features/map/utils/search.ts` (nombre, nombre corto, palabras clave, id), y `paginate(items, page, size)` con `clampPage`.
- `form.ts`: `placeToForm(place)`, `emptyForm()`, `formToInput(form)`, `isDirty(initial, form)`, `canSubmit(form)`, `listFromText/listToText` (una por línea, sin vacíos ni repetidos), `descendantIds(places, id)` (para excluirlos del selector de lugar contenedor).
- `bounds.ts`: `PLACE_AREA` (el mismo recuadro que `CAMPUS_MAX_BOUNDS`) y `inPlaceArea(lat, lng)`; un comentario enlaza con `backend/app/places/area.py` (RF-31.24).

## 3. Archivos
| Ruta (bajo `web/src/`) | Qué hace | Cubre |
|---|---|---|
| `services/api/client.ts` | `PUT`/`DELETE`, 204, `ApiError.body`, `fresh` | RF-31.34, RF-31.17, RF-31.33 |
| `services/api/adminClient.ts` | `put` y `delete` autenticados | RF-31.34 |
| `services/api/adminPlacesApi.ts` | Llamadas, tipos, `toInput`, `parseFieldErrors` | RF-31.2, RF-31.9, RF-31.16, RF-31.17, RF-31.20, RF-31.28 |
| `features/map/store/usePlacesStore.ts` | Acción `refresh()` | RF-31.33 |
| `components/Modal/Modal.tsx` | Opción `blurBackdrop` (`backdrop-blur-sm`) y `size` ancho para el formulario (`wide`) | RF-31.11, RF-31.12 |
| `components/Combobox/Combobox.tsx` | Selector con búsqueda y valores cerrados, accesible (rol `combobox`/`listbox`, flechas, Enter, Esc) | RF-31.14, RF-31.32, RF-31.35 |
| `components/Pagination/Pagination.tsx` | «Anterior/Siguiente», página y rango | RF-31.6a |
| `components/ConfirmDialog/ConfirmDialog.tsx` | Confirmación sobre `Modal` (despublicar, borrar categoría) | RF-31.7, RF-31.31 |
| `features/admin/places/utils/{filters,form,bounds}.ts` | Utilidades puras | RF-31.4, RF-31.6a, RF-31.13 a RF-31.15, RF-31.24 |
| `features/admin/places/store/useAdminPlacesStore.ts` | Estado de la lista, acciones y refresco del público | RF-31.2, RF-31.3, RF-31.6 a RF-31.10, RF-31.16, RF-31.20, RF-31.33 |
| `features/admin/places/components/PlacesTable.tsx` | Tabla accesible, filtros, buscador, contador, vacío, paginación | RF-31.2 a RF-31.6a, RF-31.35 |
| `features/admin/places/components/PlaceRowActions.tsx` | Editar, publicar/despublicar, verificar | RF-31.7 a RF-31.10 |
| `features/admin/places/components/PlaceFormDialog.tsx` | Diálogo con secciones, validación, errores por campo, confirmación de descarte, aviso de red | RF-31.11 a RF-31.19 |
| `features/admin/places/components/LocationPicker.tsx` | Mapa 2D con marcador arrastrable, puntos grises y respaldo sin token; se carga con `React.lazy` | RF-31.21 a RF-31.27 |
| `features/admin/places/components/RagWarning.tsx` | Aviso persistente y «Reintentar» | RF-31.20 |
| `features/admin/categories/…` | Store, `CategoriesTable`, `CategoryFormDialog` (selector de color y `#RRGGBB`), borrar con confirmación | RF-31.28 a RF-31.32 |
| `pages/AdminPlacesPage.tsx`, `pages/AdminCategoriesPage.tsx` | Páginas de las pestañas | RF-31.1 |
| `routes.tsx` | Rutas `/admin/lugares` y `/admin/categorias` (dentro del guard) | RF-31.1 |
| `layouts/AdminLayout.tsx` | Pestañas «Lugares» (`MapPin`) y «Categorías» (`Tags`) | RF-31.1 |
| `test/fixtures/adminPlaces.ts` | `ADMIN_PLACES`, `ADMIN_CATEGORIES`, `mockAdminApi()` | RF-31.36 |
| `web/README.md` / `web-docs` | Documentación de la pantalla | — |

## 4. Flujo y comunicación
- **Abrir «Lugares»:** `useAdminPlacesStore.load()` pide `GET /api/admin/places` y las categorías (`GET /api/admin/place-categories`) en paralelo; la tabla se pinta cuando ambas llegan. Un 401 cierra la sesión en `adminClient` (RF-31.3).
- **Filtrar:** cada cambio de `filters` pone `page = 1`; `selectFiltered` y `selectPage` se calculan con `useMemo`. Si una acción deja la página vacía, `clampPage` baja a la última válida (RF-31.6a).
- **Crear/editar:** `PlaceFormDialog` guarda el estado del formulario en un `useReducer` local (`initial` y `form`); `isDirty` decide si Esc, X o «Cancelar» cierran directo o muestran la confirmación interna (se intercepta `onClose` del `Modal`, con un estado `confirmingDiscard` que cambia el cuerpo por «¿Descartar los cambios?»). Al guardar llama a `store.save(id | null, formToInput(form))`:
  - éxito: cierra, la fila se reemplaza o se inserta, aviso `Lugar guardado` con `useToastStore`, y se llama a `refresh()` del store público. Si `ragSync === 'failed'`, se activa `ragWarning`;
  - 422/409: `parseFieldErrors` rellena `errors` por campo, el foco va al primero (`ref` por campo) y el diálogo sigue abierto;
  - red o 5xx: mensaje general dentro del diálogo; se puede reintentar.
- **Acciones de fila:** `togglePublished(place)` y `toggleVerified(place)` envían `PUT` con `toInput(place, { isPublished })` o `{ verified }`; `busyIds` deshabilita la fila; con éxito se sustituye la fila con la respuesta y se refresca el público; con error, mensaje y la fila queda como estaba. Despublicar pasa antes por `ConfirmDialog`.
- **Mapa del formulario:** `LocationPicker` recibe `lat`, `lng` (texto del formulario), `onPick(lat, lng)`, `contextPlaces` y `editingId`. El mapa se crea con `pitch: 0`, `dragRotate={false}`, `touchPitch={false}`, `pitchWithRotate={false}`, `maxBounds` = `CAMPUS_MAX_BOUNDS`, el mismo estilo que `CampusMap` y `maxPitch={0}`; el marcador es un `Marker` con `draggable`. El clic y el arrastre pasan por `inPlaceArea`; fuera de él, no se llama a `onPick` y se muestra el aviso (RF-31.24). Los puntos grises son una capa `circle` de una fuente GeoJSON con los demás lugares (sin `interactive`), que excluye `editingId`. Si `Config.mapbox.token` está vacío o el mapa emite `error`, se muestra `<p role="status">` y el formulario sigue igual (RF-31.27). Cuando el usuario escribe coordenadas válidas el marcador se mueve y la cámara hace `easeTo` a ese punto (RF-31.23).
- **Selector (`Combobox`):** recibe `options: {value,label,hint?}[]`, `value`, `onChange(value|null)`, `label`, `required`, `error`. Mantiene un texto de búsqueda aparte; al abrir muestra todas las opciones; al escribir, filtra con `normalizeText`; Enter elige la resaltada; al perder el foco sin haber elegido, el texto se descarta y se restablece al elemento elegido (o a vacío si no lo había, RF-31.14). La lista se dibuja con portal por encima del diálogo (`z-index` 1100), como ya hace `PlaceCombobox` (se reutiliza su lógica de teclado y de posición; no se unifican las dos en esta historia).
- **Categorías:** misma estructura; `placesCount` ya viene de la API. «Borrar» se deshabilita si `placesCount > 0` (con el texto «Tiene N lugares»); un 409 igualmente muestra el motivo y recarga. Tras cada cambio se refresca el público y se recargan los selectores del formulario de lugares porque leen del store de categorías de administración (RF-31.32).
- **Estilos:** solo los tokens de Tailwind que ya usa la web; sin colores nuevos. El difuminado es `backdrop-blur-sm` encima de `bg-overlay`, condicionado por `blurBackdrop` (RF-31.11).
- **Accesibilidad (RF-31.35):** `<table>` con `<th scope="col">`, `aria-label` de cada botón con el nombre del lugar («Editar Puerta 3»), `Modal` ya anuncia su título, `Input` ya enlaza etiqueta y error (`role="alert"`), `aria-live` en el contador y en el cambio de página.

## 5. Decisiones
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Paginación y filtros en pantalla sobre la lista cargada | Paginar en el servidor | La API de HU-30 no pagina y son unas decenas o pocos cientos de filas; el filtrado instantáneo es mejor para quien administra. Se revisa si crece. |
| `Combobox` genérico nuevo | Reutilizar `PlaceCombobox` | `PlaceCombobox` está atado al store público y a los lugares; el nuevo es neutro y sirve para categorías, lugar contenedor y el filtro de la tabla. |
| Selector que descarta lo escrito si no se eligió | Aceptar texto libre y validar en el servidor | Cumple «solo lo ya determinado» (RF-31.14) sin esperar el 422, y el servidor sigue siendo la última barrera. |
| Estado de filtros y página en el store | Estado local del componente | Se conserva al cerrar el diálogo, al guardar y al cambiar de pestaña (RF-31.6). |
| `refresh()` del store público tras guardar, con `no-cache` | Recargar la página o esperar los 60 s | RF-31.33 pide verlo en `/mapa` en la misma sesión; `no-cache` fuerza la revalidación con ETag y cuesta un 304 si no cambió. |
| Respuesta del servidor para actualizar la fila | Recalcular la fila en el cliente | La fila refleja lo que el servidor guardó de verdad (`verified_at`, `updated_by`). |
| Mapbox con `LocationPicker` propio y carga diferida | Leaflet o reutilizar `CampusMap` | Aprobado: ya está en el proyecto y mantiene el aspecto; `CampusMap` trae rutas, ubicación y chips que aquí sobran. La carga diferida evita pesar el resto de `/admin`. |
| Confirmación de descarte dentro del mismo diálogo | Segundo diálogo apilado | Esc no debe cerrar dos capas a la vez; el foco se mantiene en un solo diálogo. |
| `blurBackdrop` como propiedad opcional del `Modal` | Difuminar todos los diálogos | No cambia el aspecto del diálogo de rutas ni de otros; se puede generalizar luego. |
| Pestañas con rutas propias (`/admin/lugares`, `/admin/categorias`) | Pestañas internas sin ruta | Se puede recargar y compartir el enlace; el guard de HU-26 cubre las rutas. |
| `ApiError.body` en vez de adivinar el mensaje desde el texto | Mostrar `error.message` | Los 422 traen el campo; el texto de `message` habla del asistente y no sirve aquí. |
| Test del mapa con un `vi.mock` de `react-map-gl/mapbox` | Probar con Mapbox real | Las pruebas no necesitan token ni WebGL (RF-31.36); como en `CampusMap.test.tsx`. |

## 6. Estrategia de pruebas
Vitest + Testing Library; `fetch` simulado, sin backend ni token (RF-31.36).
| Requisito | Test |
|---|---|
| RF-31.1 | `AdminLayout.test.tsx` › «RF-31.1: pestañas Perfil, Lugares y Categorías» · `routes.test.tsx` › «RF-31.1: sin sesión /admin/lugares lleva al login» |
| RF-31.2, 31.3 | `PlacesTable.test.tsx` › «RF-31.2: muestra todas las filas con categoría, estado, verificación y modificación», «RF-31.3: carga, error con Reintentar y 401 cierra la sesión» |
| RF-31.4, 31.5 | `filters.test.ts` › «RF-31.4: búsqueda sin tildes y filtros combinados» · `PlacesTable.test.tsx` › «RF-31.5: sin resultados con botón limpiar; sin lugares con Nuevo lugar» |
| RF-31.6, 31.6a | `filters.test.ts` › «RF-31.6a: 20 por página y clampPage» · `useAdminPlacesStore.test.ts` › «RF-31.6: filtros y página se conservan al guardar; al filtrar vuelve a la 1» · `Pagination.test.tsx` |
| RF-31.7 | `PlaceRowActions.test.tsx` › «RF-31.7: despublicar pide confirmación; publicar no» |
| RF-31.8, 31.9 | › «RF-31.8: verificar envía PUT», «RF-31.9: el PUT lleva todos los campos con solo uno cambiado» (`adminPlacesApi.test.ts` › `toInput`) |
| RF-31.10 | `useAdminPlacesStore.test.ts` › «RF-31.10: fila deshabilitada mientras guarda; error la deja como estaba» |
| RF-31.11, 31.12 | `Modal.test.tsx` › «blurBackdrop añade el difuminado» · `PlaceFormDialog.test.tsx` › «RF-31.11: título, X y Esc», «RF-31.12: foco al abrir y al cerrar» |
| RF-31.13 | `PlaceFormDialog.test.tsx` › «RF-31.13: secciones y campos; el id solo lectura al editar y ausente al crear» |
| RF-31.14, 31.14a | `Combobox.test.tsx` › «RF-31.14: lista completa, filtra, elige con teclado, lo no elegido se descarta, no hay opción de crear» · `form.test.ts` › «listas por línea sin vacíos ni repetidos» · `descendantIds` |
| RF-31.15 | `PlaceFormDialog.test.tsx` › «RF-31.15: Guardar deshabilitado hasta completar obligatorios y mientras guarda» |
| RF-31.16 | › «RF-31.16: POST al crear y PUT al editar, cierra, aviso y fila actualizada» |
| RF-31.17, 31.18 | › «RF-31.17: 422 junto al campo, foco al primero, sigue abierto», «error sin campo arriba del formulario», «RF-31.18: red o 5xx con mensaje dentro del diálogo» · `adminPlacesApi.test.ts` › `parseFieldErrors` |
| RF-31.19 | › «RF-31.19: con cambios pide confirmación; sin cambios cierra; Seguir editando conserva» |
| RF-31.20 | `RagWarning.test.tsx` › «RF-31.20: failed muestra el aviso y Reintentar llama a reindex; ok y skipped no muestran nada» |
| RF-31.21 a 31.23, 31.25, 31.26 | `LocationPicker.test.tsx` (mapa simulado) › «2D: pitch 0 y rotación desactivada», «clic coloca marcador y llama onPick», «escribir coordenadas mueve el marcador», «al editar parte de la posición actual y sin marcador al crear», «puntos de contexto sin el lugar editado» |
| RF-31.24 | › «clic y arrastre fuera del área no se aceptan y avisan» · `bounds.test.ts` |
| RF-31.27 | › «sin token o con error del mapa muestra aviso y el formulario sigue» |
| RF-31.28 a 31.32 | `CategoriesTable.test.tsx`, `CategoryFormDialog.test.tsx` › «tabla ordenada con conteo», «422 y 409 junto al campo», «Borrar deshabilitado con lugares y con confirmación si vacía; 409 refresca», «selector de color y #RRGGBB», «el selector de lugares muestra la categoría nueva» |
| RF-31.33 | `useAdminPlacesStore.test.ts` › «RF-31.33: tras guardar se refresca el store público con no-cache y /mapa muestra el cambio» · `usePlacesStore.test.ts` › «refresh no pone loading y conserva datos si falla» |
| RF-31.34 | `client.test.ts` › «PUT y DELETE, 204 sin cuerpo y ApiError.body» · `adminClient.test.ts` › «PUT y DELETE llevan el token y un 401 cierra la sesión» |
| RF-31.35 | pruebas por rol y nombre accesibles en cada componente (`getByRole('table')`, `columnheader`, botones con nombre de lugar, `alert`) |
| RF-31.36 | `fixtures/adminPlaces.ts` + comprobación de que ningún test usa red real |

Comprobación a mano (con backend y token): escenarios 3, 5, 6, 8, 9 y 11 en el navegador, incluido el arrastre del marcador y el difuminado (no se puede verificar bien en jsdom).

## 7. Riesgos y dependencias
- **Backend de HU-30:** hasta que exista, solo se prueba con `fetch` simulado. Las pruebas manuales y los escenarios 3, 8 y 9 reales esperan a HU-30 (y el 9 completo, a HU-29).
- **Forma exacta de los errores 422/409:** se asume el formato de FastAPI de HU-30 (`detail: [{loc,msg}]`); `parseFieldErrors` es el único lugar a ajustar.
- **`mapbox-gl` en jsdom:** no corre; el mapa se simula como en `CampusMap.test.tsx`. El arrastre del marcador solo se verifica a mano.
- **Z-index:** la lista del `Combobox` y el mapa dentro de un diálogo de 1000 deben convivir con el `Modal`; se usa el mismo valor 1100 de `PlaceCombobox`.
- **Número de lugares grande:** sin paginación en servidor, la lista completa se descarga; aceptable hoy (54).
- **Tamaño del paquete:** el mapa y `mapbox-gl` se cargan solo al abrir el formulario por primera vez; se comprueba con `npm run build` que no entran en el chunk de `/admin`.
- **Diseño móvil:** fuera de alcance (HU-21); el formulario se diseña para escritorio.

## 8. Historial
- 2026-11-12 · Plan creado.
