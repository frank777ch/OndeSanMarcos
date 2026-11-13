# HU-28 · Plan técnico

- **Spec:** [spec.md](spec.md)
- **Estado:** Ejecutado

## 1. Enfoque
Los lugares pasan de una constante importada a un **store de Zustand** (`usePlacesStore`) que se llena una vez con dos peticiones a la API (HU-27). Todo lo que hoy importa `PLACES` o `PLACE_CATEGORIES` lee del store: los componentes con selectores, y el código que no es de React (`useMapStore`, `planRoute`, `mockChat`) con `usePlacesStore.getState()`. La carga se dispara en `main.tsx`, antes de renderizar, para que ocurra en cualquier ruta (RF-28.1). El estado de carga y de error se muestra en el mapa con un componente pequeño; el resto de la interfaz no cambia.

Los tipos `Place` y `PlaceCategory` se mueven a `features/map/types.ts` (ya no hay datos en ese módulo) y la categoría pasa de unión de 9 literales a `string`, porque el administrador podrá crear categorías (HU-30).

## 2. Datos y tipos
- **`features/map/types.ts`:** `Place` (los campos actuales más `shortName?`, `email?`, `website?`, `accessHint?`, `imageUrl?`, `parentPlaceId?`, `verifiedAt?`; `category: string`; `coordinates: LngLat`) y `PlaceCategory { id, label, color }`. `PlaceCategoryId = string`.
- **Forma cruda de la API** (`placesApi.ts`): `ApiPlace` y `ApiCategory` en `snake_case`, tal como los define el backend.
- **Conversión** (`toPlace`): `lat`/`lng` → `coordinates: [lng, lat]`; `detailed_schedule` → `detailedSchedule`; `category_id` → `category`; `null` y `[]` → `undefined` (RF-28.2). Una respuesta que no sea un arreglo, o un lugar sin `id`, nombre, categoría o coordenadas numéricas, es un error `invalid` (no se descartan filas en silencio).
- **`usePlacesStore`:**
  ```ts
  status: 'idle' | 'loading' | 'ready' | 'error'
  places: Place[]            // orden de la API
  byId: Record<string, Place>
  categories: PlaceCategory[] // orden de la API
  load: () => Promise<void>   // no hace nada si ya está 'loading' o 'ready'; tras 'error' vuelve a pedir
  ```
  `categories` expuestas a la interfaz = las de la API que tengan al menos un lugar (`visibleCategories`, selector derivado, RF-28.8).
- **Mensaje de error:** constante `PLACES_ERROR_MESSAGE` («No pudimos cargar los lugares del campus. Revisa tu conexión e inténtalo de nuevo.»). El store ignora `ApiError.message`, cuyo texto habla del asistente, y no muestra `detail` (RF-28.4, RF-28.5).

## 3. Archivos
| Ruta (bajo `web/`) | Qué hace | Cubre |
|---|---|---|
| `src/features/map/types.ts` | Tipos `Place`, `PlaceCategory`, `PlaceCategoryId` | RF-28.2, RF-28.10 |
| `src/services/api/placesApi.ts` | `fetchPlacesAndCategories()`: ambos `GET` en paralelo con `apiClient`, validación y `toPlace` | RF-28.1, RF-28.2, RF-28.4, RF-28.5 |
| `src/features/map/store/usePlacesStore.ts` | Estado, `load`, `byId`, `visibleCategories` | RF-28.1, RF-28.3, RF-28.4, RF-28.6, RF-28.8, RF-28.11 |
| `src/main.tsx` | Llama a `usePlacesStore.getState().load()` antes de renderizar | RF-28.1 |
| `src/features/map/components/PlacesStatus.tsx` | Aviso «Cargando lugares…» (`role="status"`) o error con «Reintentar» (`role="alert"`); no renderiza nada con `ready` | RF-28.3 a RF-28.5 |
| `src/features/map/components/MapOverlay.tsx` | Incluye `PlacesStatus` | RF-28.3, RF-28.4 |
| `src/features/map/components/PlacesLayer.tsx` | Puntos desde el store; no renderiza hasta `ready` | RF-28.3, RF-28.7 |
| `src/features/map/utils/places.ts` | `placesToGeoJSON(places, categories)` con el color de la categoría (gris si no se encuentra) | RF-28.7 |
| `src/features/map/components/CategoryChips.tsx` | Botones desde `visibleCategories`; iconos por id con `MapPin` por defecto; no renderiza hasta `ready` | RF-28.3, RF-28.8 |
| `src/features/map/components/PlaceSearch.tsx`, `PlaceCombobox.tsx` | Lugares y etiquetas de categoría desde el store; búsqueda deshabilitada hasta `ready` | RF-28.3, RF-28.9 |
| `src/features/map/utils/search.ts` | `shortName` cuenta como palabra clave | RF-28.9 |
| `src/features/map/components/PlaceCard.tsx` | Lugar y etiqueta desde el store; secciones de correo, web (solo `http(s)`) y «Cómo encontrarlo» | RF-28.10, RF-28.11 |
| `src/features/map/components/FlyToSelection.tsx` | Coordenadas desde el store | RF-28.11 |
| `src/features/map/store/useMapStore.ts` | `toggleCategory` y `selectPlace` leen `usePlacesStore.getState().byId` | RF-28.8, RF-28.11 |
| `src/features/routing/utils/planRoute.ts` | `pointCoordinates` y `pointLabel` leen del store | RF-28.12 |
| `src/features/chat/store/useChatStore.ts` | Guarda todos los lugares de la respuesta; se quita `KNOWN_PLACE_IDS` | RF-28.14 |
| `src/features/chat/components/AssistantMessage.tsx` | Filtra las tarjetas con `usePlacesStore` en el render, así aparecen cuando terminan de cargar los lugares | RF-28.14 |
| `src/features/chat/mock/mockChat.ts` | Lee `usePlacesStore.getState().places` | RF-28.6 |
| `src/features/map/data/places.ts` y `places.test.ts` | **Se borran** | RF-28.6, RF-28.15 |
| `scripts/dump-places.mjs` | **Se borra** | RF-28.15 |
| `../backend/README.md` | Quita el paso de regenerar la semilla con `dump-places.mjs`; la semilla pasa a ser solo el JSON versionado | RF-28.15 |
| `src/test/fixtures/places.ts` | Lugares y categorías de ejemplo y `seedPlaces()` que llena el store | RF-28.16 |
| Pruebas existentes que importan `PLACES` | Pasan a usar `seedPlaces()` y los ids de las fixtures | RF-28.16 |

## 4. Estado y comunicación
- **Carga:** `main.tsx` → `load()` → `status: 'loading'` → `fetchPlacesAndCategories()` → `ready` con `places`, `byId` y `categories`; cualquier excepción → `error`. «Reintentar» llama otra vez a `load()` (permitido solo desde `error`). Una carga en curso no se duplica (RF-28.1: una sola petición).
- **Navegación:** el store vive fuera de las rutas, así que ir de `/asistente` a `/mapa` no vuelve a pedir nada.
- **Lectura:** componentes con `usePlacesStore((s) => s.byId[id])` y similares; código sin React con `getState()`. Antes de `ready`, `byId` está vacío: todo id se ignora (RF-28.11) y las listas están vacías.
- **Selección y filtros:** `useMapStore` no guarda lugares, solo ids; los pasos que dependen de la categoría de un lugar consultan el store en el momento (sin cambios de comportamiento).
- **Chat:** el mensaje guarda las ubicaciones tal cual llegan; `AssistantMessage` filtra por `byId`. Si los lugares llegan después, el componente se vuelve a renderizar y aparecen las tarjetas (RF-28.14). Si un id nunca existe, nunca aparece (RF-05.18).
- **Caché de red:** `apiClient` usa el `fetch` por defecto; el navegador respeta `Cache-Control: public, max-age=60` y revalida con `ETag` de HU-27. No hay que programar nada.
- **Persistencia:** no se guardan ids de lugar en el navegador (solo estado de barra lateral y aviso de ubicación), así que el cambio de ids numéricos a slugs no deja datos viejos.

## 5. Decisiones
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Store de Zustand con `getState()` para código sin React | Contexto de React o React Query | El proyecto ya usa Zustand, y `useMapStore`, `planRoute` y `mockChat` leen los lugares fuera de componentes. No se añade una dependencia. |
| Cargar en `main.tsx` | Cargar al montar `MapPage` o con un efecto en el layout | La spec pide cargar en cualquier ruta (RF-28.1), y las tarjetas del chat necesitan los lugares aunque no se haya visitado el mapa. |
| `category` como `string` | Mantener la unión de 9 literales | El administrador podrá crear categorías (HU-30); una unión cerrada obligaría a recompilar. |
| Iconos por id con icono por defecto | Icono en la base de datos | Fuera de alcance; las categorías nuevas se ven con `MapPin` hasta que se decida. |
| Error por respuesta inválida, sin descartar filas | Filtrar lugares mal formados | Un dato corrupto debe notarse; el backend ya valida con restricciones de la base. |
| Filtrar las tarjetas del chat al renderizar | Filtrar al recibir la respuesta (como hoy) | Cumple RF-28.14 sin lógica de espera. |
| `shortName` tratado como palabra clave | Orden propio en el buscador | Mantiene el orden y los rangos de HU-11. |
| Enlace web solo con `http(s)` | Mostrar cualquier URL | El valor lo escribe un administrador; un `javascript:` no debe llegar a un `href`. |
| Título de sección «Cómo encontrarlo» | «Cómo llegar» | Evita confundirlo con el botón «Cómo llegar» de la ficha (HU-13). |
| Sin copia local de respaldo | Instantánea de la API en el repositorio | Decidido en la spec. |

## 6. Estrategia de pruebas
| Requisito | Test |
|---|---|
| RF-28.1 | `usePlacesStore.test.ts` › «RF-28.1: pide lugares y categorías una vez, sin duplicar si ya cargan o ya están listos» · `placesApi.test.ts` › «RF-28.1: GET /api/places y /api/place-categories» |
| RF-28.2 | `placesApi.test.ts` › «RF-28.2: lat/lng a [lng, lat]», «detailed_schedule a detailedSchedule», «null y listas vacías pasan a sin dato» |
| RF-28.3 | `PlacesStatus.test.tsx` › «RF-28.3: muestra el aviso de carga» · `CategoryChips.test.tsx`, `PlaceSearch.test.tsx` y `PlacesLayer` › «sin datos no muestran botones, resultados ni puntos» |
| RF-28.4, 28.5 | `usePlacesStore.test.ts` › «RF-28.4: red, tiempo, 500, 503 y respuesta inválida terminan en error», «reintentar vuelve a cargar» · `PlacesStatus.test.tsx` › «RF-28.4: mensaje sin detalles técnicos y botón Reintentar», «RF-28.5: el 503 muestra el mismo mensaje» |
| RF-28.6, 28.15 | `tests/noLocalPlaces.test.ts` › «RF-28.6: no existe places.ts ni dump-places.mjs ni imports de data/places» (lee el árbol de `src/`) |
| RF-28.7 | `places.test.ts` (utils) › «RF-28.7: un punto por lugar con el color de su categoría» · `PlacesLayer` › «no dibuja lugares ocultos» (la API ya los omite) |
| RF-28.8 | `CategoryChips.test.tsx` › «RF-28.8: botones en el orden de la API», «se oculta una categoría sin lugares», «filtrar y desactivar como en HU-10» · `useMapStore.test.ts` |
| RF-28.9 | `search.test.ts` › «RF-28.9: encuentra por nombre corto», y las de HU-11 sobre las fixtures · `PlaceSearch.test.tsx` › «no llama a la red al teclear» |
| RF-28.10 | `PlaceCard.test.tsx` › «RF-28.10: muestra correo, web y cómo encontrarlo cuando existen», «sin esos datos no hay secciones», «una web que no es http(s) no se vuelve enlace», «ficha mínima» |
| RF-28.11 | `useMapStore.test.ts` › «RF-28.11: un id desconocido se ignora y antes de cargar no se elige nada» · `FlyToSelection.test.tsx` |
| RF-28.12 | `planRoute.test.ts` › «RF-28.12: nombre y coordenadas salen de los lugares cargados» y los casos de HU-13 con fixtures de coordenadas reales |
| RF-28.13 | `usePlacesStore.test.ts` › «RF-28.13: los lugares usan el slug de la API como id» |
| RF-28.14 | `useChatStore.test.ts` › «RF-28.14: guarda todas las ubicaciones» · `AssistantMessage.test.tsx` › «aparece la tarjeta cuando los lugares terminan de cargar» y «se omite un id inexistente» |
| RF-28.16 | Todo el conjunto: `npm run test` sin backend (se simula `fetch`) |
| RF-28.17 | revisión manual de `histories.md` |

A mano (con el backend real y Mapbox, que requiere token): escenarios 1 a 8 y 10 de la spec. Con `docker compose stop backend` y `stop db` se comprueba el error y el reintento. El escenario 9 se prueba con el asistente en modo mock y con el real (`fisi`).

## 7. Riesgos y dependencias
- **Muchas pruebas dependen de `PLACES`:** `FlyToSelection`, `PlaceCard`, `places` (utils), `search`, `mockChat`, `planRoute`, y las de datos. Se reescriben con las fixtures; las de `planRoute` necesitan coordenadas reales cerca del grafo, así que la fixture las copia de algunos lugares actuales.
- **Se pierde la comprobación de datos de `places.test.ts`** (55 lugares, ids únicos, categorías válidas): ya la cubren las restricciones de la base y los tests de HU-22 y HU-27.
- **Mapa sin lugares mientras carga:** el mapa base y la ubicación funcionan; solo faltan los puntos. El retraso depende de la API (ya con caché de 60 s).
- **Ids que el asistente devuelve:** hasta HU-29 muchas tarjetas del chat se omiten (aceptado en la spec). `fisi` y otros slugs coincidentes sí funcionan.
- **Vite dev y CORS:** el backend ya permite `*` en desarrollo; no hay cambios en `VITE_API_URL`.
- Requiere HU-27 en el backend y los lugares cargados (`seed-places`).

## 8. Historial
- 2026-11-12 · Plan creado.
- 2026-11-12 · Ejecutado. Cambios respecto al plan: (1) las pruebas de datos reales de `planRoute` (RF-13.23 y RF-13.24) leen la semilla del backend en vez de perderse; (2) `PlacesLayer` tiene su propia prueba; (3) el exportador de HU-22 se conserva como registro, y el README del backend ya no lo presenta como paso normal.
