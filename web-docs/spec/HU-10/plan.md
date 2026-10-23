# HU-10 · Plan técnico

- **Spec:** [spec.md](spec.md)
- **Estado:** Ejecutado

## 1. Enfoque
Un módulo de datos con los 40 lugares y sus 5 categorías; utilidades puras para filtrar y convertir a GeoJSON; un store de zustand con la categoría activa; y dos componentes: la capa de puntos del mapa y la barra de chips. Se filtra en JS y se reenvía el GeoJSON a Mapbox.

## 2. Datos y tipos
- `PlaceCategoryId = 'facultades' | 'cafeterias' | 'auditorios' | 'campos-deportivos' | 'puertas'`.
- `PLACE_CATEGORIES: PlaceCategory[]` con `{ id, label, color }`, en el orden de los chips (RF-10.2, RF-10.5).
- `PLACES: Place[]` con `{ id, name, category, coordinates: LngLat }` (RF-10.1).
- Origen: los 40 puntos de `frontend/src/features/map/constants/unmsm.ts` (`UNMSM_POIS`). Los `id` originales («1»…«40») se conservan como string.

## 3. Archivos
| Ruta | Qué hace | Cubre |
|---|---|---|
| `web/src/features/map/data/places.ts` | Tipos, categorías y los 40 lugares | RF-10.1, RF-10.2 |
| `web/src/features/map/utils/places.ts` | `filterPlaces`, `placesToGeoJSON` | RF-10.3, RF-10.4, RF-10.6 |
| `web/src/features/map/store/useMapStore.ts` | `activeCategory`, `toggleCategory` | RF-10.6 a RF-10.9 |
| `web/src/features/map/components/PlacesLayer.tsx` | `Source` + capas `circle` y `symbol` (`slot="top"`) | RF-10.3, RF-10.4 |
| `web/src/features/map/components/CategoryChips.tsx` + `.module.css` | Barra de chips accesible | RF-10.5 a RF-10.8, RF-10.10 |
| `web/src/features/map/components/CampusMap.tsx` | Monta `PlacesLayer` y `CategoryChips` | RF-10.3, RF-10.5 |

## 4. Estado (stores) y comunicación
`useMapStore` (zustand, en memoria): `activeCategory: PlaceCategoryId | null` y `toggleCategory(id)`. No usa `localStorage` (RF-10.9). Lo leen `PlacesLayer` y `CategoryChips`.

## 5. Decisiones
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Filtrar en JS y reenviar el GeoJSON | `filter` de las capas de Mapbox | Más simple de testear sin WebGL |
| Círculos de color por categoría | Íconos por categoría dentro del mapa | Más rápido y legible; los íconos quedan en los chips |
| Capas con `slot="top"` | Sin `slot` | El estilo Standard de Mapbox solo dibuja capas propias encima si usan un slot |
| Íconos de chips con `lucide-react` (`Building2`, `Coffee`, `Mic`, `Dumbbell`, `DoorOpen`) | Íconos de Ionicons de la app anterior | `lucide-react` ya es dependencia |
| Orden de chips del diseño anterior | Orden alfabético | Mantiene el diseño de la app existente |

## 6. Estrategia de pruebas
| Requisito | Test |
|---|---|
| RF-10.1, RF-10.2 | `data/places.test.ts` |
| RF-10.3, RF-10.4 | `utils/places.test.ts` (GeoJSON con color) |
| RF-10.5, RF-10.10 | `components/CategoryChips.test.tsx` |
| RF-10.6, RF-10.7, RF-10.8 | `store/useMapStore.test.ts` y `CategoryChips.test.tsx` |
| RF-10.9 | `store/useMapStore.test.ts` |

Manual (requiere token de Mapbox): escenarios 1–5 de `spec.md` sobre el mapa real.

## 7. Riesgos y dependencias
- Depende de HU-09 (`CampusMap`).
- Se añadió `@types/geojson` como dependencia de desarrollo para tipar el GeoJSON.
- jsdom no tiene WebGL: en los tests se simula `react-map-gl/mapbox`.

## 8. Historial
- 2026-10-23 · Plan creado a partir de la sección «Diseño» de la spec original.
