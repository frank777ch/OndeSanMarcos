# HU-15 · Plan técnico

- **Spec:** [spec.md](spec.md)
- **Estado:** Ejecutado

## 1. Enfoque
1. Un store `useLocationStore` guarda el estado del permiso, si el aviso está abierto, la última posición y si se está localizando.
2. `utils/geolocation.ts` envuelve `navigator.permissions` y `navigator.geolocation` en funciones con promesas, fáciles de simular en tests.
3. `LocationNotice` es el aviso propio (tarjeta no modal) que, al aceptar, dispara la petición del navegador.
4. `UserLocationLayer` dibuja el punto y el halo dentro de `<Map>`.
5. El botón de `CampusMap` decide según el permiso: ubicación del dispositivo o centro del campus.
6. Si la posición cae fuera de los límites del mapa, estos se amplían para que la cámara pueda llegar (RF-15.16).

## 2. Datos y tipos
```ts
type LocationPermission = 'unknown' | 'prompt' | 'granted' | 'denied' | 'unsupported'

interface UserPosition {
  coordinates: LngLat   // [lng, lat]
  accuracy: number      // metros
}
```

- **Lectura:** `getCurrentPosition` con `enableHighAccuracy: true`, `timeout: 10000`, `maximumAge: 0`.
- **Halo:** se dibuja con una capa `circle` cuyo radio en píxeles depende del zoom. Se calcula una tabla de paradas por zoom entero (14 a 22): `max(12 px, metros / metrosPorPíxel(zoom, latitud))`. Se usa una tabla y no un `max` envolviendo la expresión porque Mapbox solo admite `['zoom']` en el nivel superior de una interpolación.
- **Punto:** capa `circle` de 8 px, azul `#2563eb`, borde blanco de 3 px. Halo: mismo azul con opacidad 0.2.
- **Clave de pestaña:** `sessionStorage['osm:location-notice-dismissed'] = '1'` (RF-15.3), siempre dentro de `try/catch` porque puede estar bloqueado.

## 3. Archivos
| Ruta | Qué hace | Cubre |
|---|---|---|
| `web/src/features/map/utils/geolocation.ts` | Nuevo: `queryPermission()`, `readPosition()`, `watchPermissionChange()` | RF-15.4, RF-15.5, RF-15.7, RF-15.9 |
| `web/src/features/map/utils/userLocation.ts` | Nuevo: `haloRadiusStops(accuracy, lat)`, `expandBounds(bounds, point)`, `userLocationToGeoJSON(position)` (funciones puras) | RF-15.15, RF-15.16 |
| `web/src/features/map/store/useLocationStore.ts` | Nuevo: permiso, aviso, posición, `locating`; acciones `init`, `allow`, `dismissNotice`, `locate` | RF-15.1 a RF-15.5, RF-15.7 a RF-15.11, RF-15.17, RF-15.19 |
| `web/src/features/map/components/LocationNotice.tsx` | Nuevo: aviso con «Permitir» y «Ahora no», Esc cierra | RF-15.1, RF-15.2, RF-15.3, RF-15.6, RF-15.13 |
| `web/src/features/map/components/UserLocationLayer.tsx` | Nuevo: fuente y capas del halo y del punto | RF-15.14 a RF-15.19 |
| `web/src/features/map/components/CampusMap.tsx` | Modifica: llama a `init` al montar, monta `LocationNotice` y `UserLocationLayer`, botón con nombre según permiso y estado ocupado, `maxBounds` ampliado | RF-15.7 a RF-15.12, RF-15.16 |
| `web/src/features/map/components/CampusMap.test.tsx` | Modifica: mock de `navigator.geolocation` y `navigator.permissions` | RF-15.7 a RF-15.12 |
| `web/src/components/Toast/toastStore.ts` | Sin cambios: se usa `show(message, 'error')` para el mensaje de RF-15.9 (ya anuncia con `aria-live`) | RF-15.9, RF-15.13 |

## 4. Estado (stores) y comunicación
`useLocationStore`:
- `permission`, `noticeOpen`, `position: UserPosition | null`, `locating`.
- `init()`: si no hay `navigator.geolocation` → `'unsupported'`. Si no, `queryPermission()`. Con `'prompt'` y sin la clave de `sessionStorage`, abre el aviso. Con `'granted'` o `'denied'` no lo abre. Si la API de permisos no existe, se toma como `'prompt'`. Se suscribe al evento `change` del permiso para mantener `permission` al día (y con él el nombre del botón, RF-15.12).
- `dismissNotice()`: cierra el aviso y guarda la clave de pestaña. No llama al navegador.
- `allow()`: cierra el aviso y llama a `readPosition()` solo para que el navegador muestre su petición. El resultado se descarta (RF-15.10): éxito → `permission = 'granted'`; error de permiso → `'denied'`; otros errores no cambian nada.
- `locate()`: devuelve `Promise<UserPosition | null>`. Pone `locating = true` y se ignora si ya está en `true` (RF-15.11). Éxito → guarda `position` y devuelve la posición. Error → devuelve `null` y, si fue por permiso, `permission = 'denied'`. Siempre vuelve a `locating = false`.

`CampusMap` al pulsar el botón:
```
si permission !== 'granted'  → backToCampus()                        (RF-15.8)
si no → pos = await locate()
        pos ? flyTo(pos.coordinates, zoom 18)                         (RF-15.7)
            : backToCampus() + toast de error                        (RF-15.9)
```
El mensaje del toast es «No pudimos obtener tu ubicación. Te llevamos al centro de la universidad.» (si el error fue de permiso, se calla el toast: el botón ya cambia de nombre).

**Límites del mapa:** `maxBounds = position ? expandBounds(CAMPUS_MAX_BOUNDS, position.coordinates) : CAMPUS_MAX_BOUNDS`. `expandBounds` devuelve el rectángulo que incluye los límites actuales y el punto más el margen del campus. Antes del `flyTo` se llama a `getMap().setMaxBounds(...)` de forma imperativa (el cambio de props llega en el siguiente render); la prop `maxBounds` calculada del store cubre el caso de volver al mapa con una posición ya guardada. No se vuela en un efecto sobre `position`, porque el store sobrevive a la navegación y volar al volver al mapa rompería RF-15.10.

**Posición:** el punto se queda en `position` hasta recargar; cada pulsación con permiso reemplaza el valor, no lo acumula (RF-15.17). Si falla una lectura, `position` conserva la anterior pero no se dibuja un punto nuevo (RF-15.19).

**Interacción:** `interactiveLayerIds` sigue siendo solo `['places-circles']`; el punto del usuario no está ahí, así que no captura toques (RF-15.18).

**Accesibilidad:** `LocationNotice` es `role="dialog"` sin `aria-modal`, con título y descripción asociados; un `keydown` de Esc en `document` mientras está abierto equivale a «Ahora no». No hay fondo oscuro ni bloqueo (RF-15.6). No toma el foco al abrirse para no interrumpir la búsqueda.

## 5. Decisiones
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Aviso propio antes de la petición del navegador | Pedir el permiso directo al entrar | Explica el motivo y, si dicen «Ahora no», no se gasta el único intento del navegador |
| Descartar la primera lectura | Dibujar el punto al aceptar | El spec pide que el mapa no se mueva ni muestre nada hasta pulsar el botón |
| Ampliar `maxBounds` con la posición | Quitar `maxBounds` del todo | Se conserva el límite del campus cuando no hay posición lejana y no se depende de que `react-map-gl` acepte `undefined` |
| Tabla de radios por zoom entero | Radio fijo en píxeles | El halo debe representar metros reales (RF-15.15) |
| Toast existente para el mensaje de error | Mensaje propio | Ya anuncia a lectores de pantalla y desaparece solo |
| Una sola fuente de verdad para el permiso (store, con evento `change`) | Consultar el navegador en cada pulsación | El nombre del botón y el aviso dependen del permiso y deben reaccionar a cambios hechos desde el candado del navegador |
| Permiso `'unsupported'` y `'denied'` tratados igual en el botón | Botón oculto | RF-15.8: el botón sigue funcionando como hoy |

## 6. Estrategia de pruebas
| Requisito | Test |
|---|---|
| RF-15.1, RF-15.4, RF-15.5 | `store/useLocationStore.test.ts` › `init` con `prompt` abre el aviso; con `granted`, `denied` o sin geolocalización no |
| RF-15.2 | `store/useLocationStore.test.ts` › `allow` cierra y pide la lectura una vez; `components/LocationNotice.test.tsx` › «Permitir» |
| RF-15.3 | `store/useLocationStore.test.ts` › `dismissNotice` no lee y guarda la clave; `init` con la clave no reabre; sin la clave sí |
| RF-15.6 | `components/LocationNotice.test.tsx` › sin `aria-modal` ni capa que cubra el mapa |
| RF-15.7 | `components/CampusMap.test.tsx` › con permiso, el botón llama a `flyTo` con las coordenadas leídas |
| RF-15.8 | `components/CampusMap.test.tsx` › sin permiso, `flyTo` al centro del campus y sin lectura |
| RF-15.9, RF-15.19 | `components/CampusMap.test.tsx` y `store/useLocationStore.test.ts` › error de lectura: `flyTo` al centro, toast y sin posición nueva |
| RF-15.10 | `store/useLocationStore.test.ts` › tras `init` y `allow` no hay `position`; `components/CampusMap.test.tsx` › `flyTo` no se llama |
| RF-15.11 | `store/useLocationStore.test.ts` › dos `locate()` seguidos hacen una sola lectura; botón deshabilitado mientras `locating` |
| RF-15.12 | `components/CampusMap.test.tsx` › nombre «Mi ubicación» con permiso y «Volver al campus» sin él |
| RF-15.13 | `components/LocationNotice.test.tsx` › Esc cierra como «Ahora no» |
| RF-15.14, RF-15.18 | `components/UserLocationLayer.test.tsx` › fuente con un punto, capas halo y punto con los colores; no está en `interactiveLayerIds` |
| RF-15.15 | `utils/userLocation.test.ts` › radios proporcionales a la precisión y nunca menores que 12 px |
| RF-15.16 | `utils/userLocation.test.ts` › `expandBounds` incluye un punto lejano y no encoge los límites; `components/CampusMap.test.tsx` › `maxBounds` ampliado |
| RF-15.17 | `store/useLocationStore.test.ts` › una segunda lectura reemplaza a la primera |

Manual (requiere token de Mapbox y ubicación real o simulada con las herramientas del navegador, por ejemplo «Sensors» en Chrome): escenarios 1, 2, 4, 5, 10, 11, 12 y 13 sobre el mapa real; comprobar que el halo cambia de tamaño con el zoom y que el aviso no tapa nada importante en móvil.

## 7. Riesgos y dependencias
- **Permissions API.** Safari y algunos navegadores antiguos no la tienen o no soportan `geolocation`. Sin ella el aviso aparece siempre (salvo la clave de pestaña) y el permiso se aprende al aceptar o al pulsar el botón.
- **Contextos no seguros.** La geolocalización solo funciona en HTTPS o `localhost`. Para probar desde el celular con `dev.sh` (IP de la red local, HTTP) no funcionará; en ese caso se trata como no disponible. Se anota en `task.md`.
- **iOS Safari.** Puede volver a preguntar en cada sesión aunque se haya concedido; el aviso solo aparece si el permiso es `prompt`, así que el botón seguirá funcionando.
- **Ubicación imprecisa en escritorio.** Basada en Wi‑Fi o IP, puede dar halos de cientos de metros; es correcto, el halo lo refleja.
- **Colisión visual del aviso en móvil.** Se coloca abajo y centrado, encima de la ficha. Si molesta con la ficha abierta se sube o se oculta (se resuelve al probar a mano).
- Depende de HU-09 (mapa) y de `Toast` (ya existente). Prepara HU-13 (origen «mi ubicación») y HU-16 (seguimiento).

## 8. Historial
- 2026-11-01 · Plan creado tras aprobar el spec.
- 2026-11-01 · Ejecutado. `MapRef` de react-map-gl no expone `setMaxBounds`: se usa `getMap()`. El `flyTo` se hace en el manejador del botón, no en un efecto.
