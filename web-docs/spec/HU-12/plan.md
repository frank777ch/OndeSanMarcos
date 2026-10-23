# HU-12 · Plan técnico

- **Spec:** [spec.md](spec.md)
- **Estado:** Ejecutado

## 1. Enfoque
1. Ampliar `Place` con los campos de ficha y cargarlos desde los datos de la app anterior.
2. Diferenciar el origen de la selección (mapa o búsqueda) para que tocar un punto no mueva la cámara.
3. Detectar el toque sobre los puntos con `onClick` del mapa y la capa `places-circles`.
4. `PlaceCard`: tarjeta con la ficha, cerrable con botón y Esc.
5. Reorganizar la esquina izquierda del mapa en una columna (`MapOverlay`): buscador y filtros arriba, tarjeta abajo.
6. Mantener sincronizado el campo de búsqueda con la selección.

## 2. Datos y tipos
`Place` añade campos opcionales:

```ts
schedule?: string            // «Lun–Vie 8:00–16:00»
description?: string
phone?: string
annex?: string
careers?: string[]
services?: string[]
usage?: string               // auditorios
detailedSchedule?: string[]  // una línea por tramo
```

**Origen de los datos:** los 37 lugares de `CAMPUS_PLACES` en `frontend/src/features/map/constants/unmsm.ts`. Se asignan con la misma tabla de equivalencias de HU-11 (22 al punto existente, 15 a los lugares nuevos). `ciencias-economicas` va a los dos puntos (27 y 31).

**Cómo se generan:** con un script local (en el directorio temporal, no se sube al repo) que evalúa el objeto `CAMPUS_PLACES` con Node y escribe los campos en `data/places.ts`. No se parsea con expresiones regulares porque las descripciones tienen comillas y saltos de línea. El resultado queda como datos escritos en el código. Las coordenadas de entrada (`entranceCoordinate`) no se traen: las usará HU-13.

**Sin datos:** el resto de lugares queda con los campos opcionales ausentes (ficha mínima, RF-12.2).

**Estado «demo»:** los datos de origen están marcados como no verificados. Se anota en `data/places.ts` y en la «Pendiente» de `task.md`; la verificación es tarea del equipo.

## 3. Archivos
| Ruta | Qué hace | Cubre |
|---|---|---|
| `web/src/features/map/data/places.ts` | Modifica: campos opcionales y datos de ficha | RF-12.1, RF-12.2 |
| `web/src/features/map/store/useMapStore.ts` | Modifica: `selectionOrigin`, `selectPlace(id, origin)`, y `toggleCategory` cierra la ficha si oculta el lugar | RF-12.3, RF-12.4, RF-12.8 |
| `web/src/features/map/utils/places.ts` | Añade `placeIdFromFeatures(features)` | RF-12.3 |
| `web/src/features/map/components/PlaceCard.tsx` + `.module.css` | Nuevo: la tarjeta de la ficha | RF-12.6, RF-12.9 a RF-12.16 |
| `web/src/features/map/components/MapOverlay.tsx` + `.module.css` | Nuevo (reemplaza a `MapToolbar`): columna izquierda con buscador, filtros y tarjeta | RF-12.14, RF-12.15, RF-12.17 |
| `web/src/features/map/components/MapToolbar.tsx` + `.module.css` | Se elimina (lo absorbe `MapOverlay`) | — |
| `web/src/features/map/components/CampusMap.tsx` | Modifica: `interactiveLayerIds`, `onClick`, cursor, y monta `MapOverlay` | RF-12.3, RF-12.5, RF-12.7 |
| `web/src/features/map/components/FlyToSelection.tsx` | Modifica: no vuela si el origen es `map` | RF-12.3 |
| `web/src/features/map/components/PlaceSearch.tsx` | Modifica: sincroniza el texto con la selección; Esc con lista abierta no se propaga | RF-12.6, RF-12.18 |
| `web-docs/spec/HU-11/*` | Nota en el historial: la ficha ya existe y el campo se sincroniza | — |

## 4. Estado (stores) y comunicación
`useMapStore` cambia:
- `selectionOrigin: 'map' | 'other' | null`.
- `selectPlace(id, origin = 'other')`: igual que hoy (quita el filtro si lo oculta) y guarda el origen. El clic en el mapa llama con `'map'`.
- `clearSelection()`: también pone `selectionOrigin = null`.
- `toggleCategory(id)`: si tras activar `id` el lugar elegido es de otra categoría, también limpia la selección (RF-12.8).

La ficha está abierta cuando `selectedPlaceId !== null`; no hay otro estado.

**Clic en el mapa** (`CampusMap`):
- `interactiveLayerIds={['places-circles']}`, `cursor` de puntero al pasar por un punto (`onMouseEnter` / `onMouseLeave`).
- `onClick(e)`: `placeIdFromFeatures(e.features)` → si hay id, `selectPlace(id, 'map')`; si no, no hace nada (RF-12.7).

**Cámara:** `FlyToSelection` solo vuela si `selectionOrigin !== 'map'`.

**Buscador:** un efecto en `selectedPlaceId`: si cambia a un lugar, `setQuery(place.name)`; si pasa a `null`, `setQuery('')`. El botón «Limpiar» y la ficha cierran por la misma vía. Esc: si la lista está abierta, `e.stopPropagation()` para que no llegue al listener de la ficha.

**Esc de la ficha:** `PlaceCard` registra un `keydown` en `document` mientras está abierta.

**Foco:** al abrirse (de `null` a un lugar) guarda `document.activeElement` y enfoca «Cerrar»; al cerrarse devuelve el foco a ese elemento si sigue en el documento.

## 5. Decisiones
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Origen de selección en el store | Que cada fuente mueva la cámara por su cuenta | HU-08 (chat) reutiliza `selectPlace` y decide el origen sin tocar el mapa |
| `MapOverlay` como columna flex | Posicionar cada elemento con `absolute` | La tarjeta nunca puede tapar el buscador: comparten un contenedor y la tarjeta se encoge |
| Margen inferior de 2.5 rem en `MapOverlay` | Pegar la tarjeta al borde | Deja visibles el logo y la atribución de Mapbox (RF-12.17) |
| Datos generados con script y escritos en el código | Leerlos en ejecución del TS antiguo | `frontend/` se borra en HU-20; HU-22 los mueve a la base de datos |
| `placeIdFromFeatures` como función pura | Leer `e.features` dentro del componente | Se puede probar sin WebGL |
| Esc con `stopPropagation` desde el buscador | Un estado global de «lista abierta» | Más simple y local |
| Diálogo no modal (`role="dialog"` sin `aria-modal`) | Modal con bloqueo del mapa | El usuario puede seguir usando el mapa con la ficha abierta |

## 6. Estrategia de pruebas
| Requisito | Test |
|---|---|
| RF-12.1, RF-12.2 | `data/places.test.ts` (campos presentes en lugares con datos; ausentes en puertas y canchas; conteos por campo; economicas en 27 y 31) |
| RF-12.3 | `utils/places.test.ts` (`placeIdFromFeatures`) y `store/useMapStore.test.ts` (origen `map`) |
| RF-12.3 | `components/FlyToSelection.test.tsx` (no vuela con origen `map`) |
| RF-12.4, RF-12.18 | `components/PlaceSearch.test.tsx` (elegir abre la ficha; el texto sigue a la selección y se vacía al cerrar) |
| RF-12.5, RF-12.8 | `store/useMapStore.test.ts` (cambiar de lugar; `toggleCategory` limpia la selección si oculta el lugar y la conserva si no) |
| RF-12.6, RF-12.16 | `components/PlaceCard.test.tsx` (botón y Esc cierran; foco al abrir y al cerrar; `role="dialog"` con nombre) |
| RF-12.9 a RF-12.13 | `components/PlaceCard.test.tsx` (nombre y categoría siempre; secciones solo con dato; listas; horario detallado; sin botón «Cómo llegar») |
| RF-12.6 (Esc con lista) | `components/PlaceSearch.test.tsx` (Esc con lista abierta no cierra la ficha) |

Manual (requiere token de Mapbox): escenarios 1, 7, 10 y 14 sobre el mapa real (clic en puntos, clic en vacío, colocación de la tarjeta, logo de Mapbox visible).

## 7. Riesgos y dependencias
- **Clics sobre etiquetas.** Solo los círculos son clicables; tocar el texto de una etiqueta no abre la ficha. Si molesta, se añade la capa de etiquetas a `interactiveLayerIds`.
- **Puntos superpuestos.** Si dos puntos están muy cerca, el clic puede elegir el de arriba; `placeIdFromFeatures` toma el primero.
- **Datos «demo».** Pueden mostrar horarios o teléfonos desactualizados hasta que alguien los verifique.
- **Contenido largo.** Algunas facultades tienen muchas carreras; la tarjeta usa scroll interno.
- Depende de HU-09, HU-10 y HU-11.

## 8. Historial
- 2026-10-23 · Plan creado tras resolver las preguntas abiertas del spec.
- 2026-10-23 · Ejecutado. `IconButton` acepta `ref` (React 19) para enfocar «Cerrar». El campo de búsqueda se sincroniza ajustando el estado al renderizar (no con un efecto) por la regla `set-state-in-effect`. `MapToolbar` se eliminó y lo absorbió `MapOverlay`.
