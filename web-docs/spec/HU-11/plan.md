# HU-11 · Plan técnico

- **Spec:** [spec.md](spec.md)
- **Estado:** Ejecutado

## 1. Enfoque
1. Ampliar el módulo de datos a 55 lugares con `keywords` y 9 categorías.
2. Una utilidad pura de búsqueda (`searchPlaces`).
3. Un store con el lugar seleccionado; elegir un lugar quita el filtro si lo oculta.
4. Un componente `PlaceSearch` (cuadro combinado accesible) y un controlador que hace volar la cámara cuando cambia la selección.
5. ~~Una capa extra con el anillo de resaltado.~~ (Retirado; ver historial.)

## 2. Datos y tipos
- `Place` añade `keywords: string[]` (puede ser vacío).
- `PlaceCategoryId` añade `'administracion' | 'salud' | 'servicios' | 'otros'`.
- `PLACE_CATEGORIES` queda en este orden (RF-11.5): facultades, cafeterias, auditorios, campos-deportivos, puertas, administracion, salud, servicios, otros.
- Colores nuevos: administración `#00838f`, salud `#d81b60`, servicios `#6d4c41`, otros `#757575`.

**Unificación (RF-11.1 a RF-11.4).** El resultado es una lista escrita a mano en `data/places.ts` (no se calcula en ejecución). Reglas para generarla:

| Origen | Qué se hace | Lugares |
|---|---|---|
| Puntos del mapa (40) | Se conservan con su `id` y su ubicación | 40 |
| Lugares del asistente con equivalente (22) | Aportan `keywords` y el nombre corregido al punto existente | 0 nuevos |
| Lugares del asistente sin equivalente (15) | Se añaden con el `id` del asistente y su coordenada | +15 |

Equivalencias (asistente → id del punto):

| Asistente | Punto | | Asistente | Punto |
|---|---|---|---|---|
| `fisi` | 8 | | `ciencias-matematicas` | 22 |
| `psicologia` | 10 | | `ciencias-administrativas` | 24 |
| `fiee` | 11 | | `fii` | 25 |
| `fic` | 12 | | `ciencias-sociales` | 26 |
| `educacion` | 15 | | `ciencias-economicas` | 27 y 31 |
| `figmmg` | 17 | | `ciencias-contables` | 28 |
| `fqiq` | 19 | | `letras-humanidades` | 29 |
| `ciencias-biologicas` | 20 | | `odontologia` | 30 |
| `ciencias-fisicas` | 21 | | `cafeteria-fqiq` / `-odontologia` / `-civil` | 33 / 34 / 35 |
| `auditorio-ella-dunbar-temple` | 37 | | `auditorio-rosa-alarco` | 38 |

Notas:
- Cuando un punto tiene un solo equivalente, adopta el nombre del asistente (corrige, por ejemplo, «Ella Dumber» → «Ella Dunbar»). Los puntos 27 y 31 conservan «(Antiguo)» y «(Nuevo)».
- El punto 23 repite el nombre del 25 («Facultad de Ingeniería Industrial»): se deja como está en los datos de origen y solo el 25 recibe las palabras clave. Queda anotado como limpieza de datos pendiente.

Categorías de los 15 nuevos: **administracion** (Rectorado, OCA, Posgrado, CEPREUNMSM) · **salud** (2 clínicas) · **servicios** (Comedor, Biblioteca, Residencia) · **otros** (Huaca San Marcos) · **cafeterias** (+2) · **campos-deportivos** (Estadio, Gimnasio) · **facultades** (Derecho).

Conteo final: facultades 26, cafeterías 5, auditorios 2, campos deportivos 4, puertas 8, administración 4, salud 2, servicios 3, otros 1 = **55**.

## 3. Archivos
| Ruta | Qué hace | Cubre |
|---|---|---|
| `web/src/features/map/data/places.ts` | Modifica: 55 lugares, `keywords`, 9 categorías | RF-11.1 a RF-11.5 |
| `web/src/features/map/utils/search.ts` | Nuevo: `normalizeText`, `searchPlaces(places, query, limit = 8)` | RF-11.7 a RF-11.10, RF-11.12 |
| `web/src/features/map/store/useMapStore.ts` | Modifica: `selectedPlaceId`, `selectPlace(id)`, `clearSelection()` | RF-11.13 a RF-11.16 |
| `web/src/features/map/components/PlaceSearch.tsx` + `.module.css` | Nuevo: cuadro combinado con lista, botón «Limpiar búsqueda» y mensaje sin resultados | RF-11.6 a RF-11.17 |
| `web/src/features/map/components/MapToolbar.tsx` + `.module.css` | Nuevo: contenedor que apila búsqueda y chips arriba a la izquierda | RF-11.6 |
| `web/src/features/map/components/CategoryChips.module.css` | Modifica: deja de ser `absolute` (lo posiciona `MapToolbar`) | RF-11.5 |
| `web/src/features/map/components/FlyToSelection.tsx` | Nuevo: dentro de `<Map>`, observa `selectedPlaceId` y llama a `flyTo` | RF-11.13 |
| `web/src/features/map/components/CampusMap.tsx` | Modifica: monta `MapToolbar` y `FlyToSelection` | RF-11.6 |
| `web-docs/spec/HU-10/spec.md` | Modifica: RF-10.1, RF-10.2 y RF-10.5 pasan a 55 lugares y 9 categorías | — |

## 4. Estado (stores) y comunicación
`useMapStore` añade:
- `selectedPlaceId: string | null`.
- `selectPlace(id)`: guarda la selección; si hay `activeCategory` y la categoría del lugar es distinta, pone `activeCategory = null` (RF-11.15). Si el `id` no existe, no hace nada.
- `clearSelection()`: `selectedPlaceId = null` (RF-11.16).

`PlaceSearch` guarda en estado local el texto, la lista abierta y el índice resaltado. Al elegir llama a `selectPlace`. Al limpiar llama a `clearSelection`. `FlyToSelection` (dentro de `<Map>`) usa `useMap()` para hacer `flyTo` al lugar seleccionado a zoom 18; queda desacoplado de la barra, de modo que HU-08 (chat) y HU-12 (ficha) pueden reutilizar `selectPlace`.

## 5. Decisiones
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Lista unificada escrita a mano | Fusionar las dos listas en tiempo de ejecución | Los datos son estáticos; así son revisables y no cargan lógica de fusión |
| Conservar ubicación de los puntos del mapa | Usar la del asistente | Los puntos del mapa tienen mejor precisión; las del asistente son «aproximadas» |
| `selectPlace` quita el filtro en el store | Hacerlo en `PlaceSearch` | La regla se aplica igual si luego elige el lugar el chat o la ficha |
| `FlyToSelection` observa el store | `PlaceSearch` llama a `flyTo` | Desacopla la búsqueda del mapa y permite probar cada parte por separado |
| Búsqueda en memoria sobre 55 elementos | Índice o librería de búsqueda | El tamaño no lo justifica |
| Ranking: palabra clave exacta > nombre empieza con > nombre contiene > palabra clave contiene | Orden alfabético | Pone arriba lo más probable; una sigla («FISI») debe ganar a una coincidencia casual dentro de otro nombre («Físicas») |
| Cuadro combinado ARIA (`role="combobox"` + `listbox`) | Lista de botones | Cumple RF-11.17 y es el patrón estándar |

## 6. Estrategia de pruebas
| Requisito | Test |
|---|---|
| RF-11.1 a RF-11.5 | `data/places.test.ts` (55 lugares, ids únicos, sin nombres duplicados salvo los 23/25 conocidos, 9 categorías, conteos por categoría, presencia de los 15 nuevos, `keywords` de FISI) |
| RF-11.7 a RF-11.10, RF-11.12 | `utils/search.test.ts` (tildes, mayúsculas, mínimo 2 letras, orden, límite 8, palabra clave, sin coincidencias) |
| RF-11.13, RF-11.15, RF-11.16 | `store/useMapStore.test.ts` (`selectPlace` quita o conserva el filtro; `clearSelection`; `id` inválido) |
| RF-11.5, RF-11.6, RF-11.9, RF-11.11, RF-11.13, RF-11.16, RF-11.17 | `components/PlaceSearch.test.tsx` (React Testing Library: escribir, elegir con clic y con teclado, limpiar, sin resultados, ARIA) |
| RF-11.13 | `components/FlyToSelection.test.tsx` (con `useMap` simulado, comprueba `flyTo` con las coordenadas) |

Manual (requiere token de Mapbox): escenarios 1–12 de `spec.md` sobre el mapa real; en especial el vuelo de la cámara (RF-11.13).

## 7. Riesgos y dependencias
- **Datos de origen aproximados.** Las coordenadas de los 15 lugares nuevos vienen del asistente y pueden quedar algo desplazadas respecto al mapa real. Se verifican a ojo en el mapa y se corrigen en un cambio aparte.
- **Duplicado 23/25** (Ingeniería Industrial) se deja como está.
- **Etiquetas superpuestas.** Con 55 puntos, algunos nombres pueden taparse; Mapbox oculta los que chocan. Si molesta, se puede acortar `text-max-width` o mostrar nombres según el zoom (mejora aparte).
- **9 chips** pueden ocupar dos filas; el contenedor ya permite saltar de línea.
- Depende de HU-09 y HU-10.

## 8. Historial
- 2026-10-23 · Plan creado tras resolver las preguntas abiertas del spec.
- 2026-10-23 · Ranking con palabra clave exacta primero (ver historial de la spec).
- 2026-10-23 · Ejecutado. Se añadió `selectedFilter` en `utils/places.ts` y los íconos `Landmark`, `HeartPulse`, `ConciergeBell` y `MapPin` para los chips nuevos.
- 2026-10-23 · Se quita la capa del anillo y `selectedFilter` (RF-11.14 retirado). `PlacesLayer` vuelve a ser el de HU-10.
- 2026-10-23 · `PlaceSearch.module.css`: `.input:focus-visible { outline: none }`. Se quita el contorno de foco por decisión de diseño; el campo conserva su sombra y el cursor de texto como indicación. Queda anotado como compromiso de accesibilidad.
