# Generador del dataset del campus (Google Places → `unmsm.ts`)

Dos scripts para **prototipar** la lista de lugares del campus UNMSM a partir de
Google Places, produciendo un TS con el shape `CampusPlace[]` del frontend.

> Estos scripts asisten la curación; **no** reemplazan al `unmsm.ts` curado a
> mano, que sigue siendo la fuente de verdad. La salida es para revisión/diff.

## Requisitos

- Clave de Google Maps con **Places API (New)** habilitada.
- Se lee de la variable de entorno `GOOGLE_MAPS_API_KEY` (nunca se hardcodea).
  Sin ella, `fetch_places` aborta con un mensaje claro.
- `httpx` (ya está en el venv del backend).

```bash
export GOOGLE_MAPS_API_KEY="AIza..."
```

## Uso

Ejecutar desde `backend/` (para que `app.tools.maps.*` sea importable):

```bash
# 1) Descargar POIs del recinto -> JSON crudo
python -m app.tools.maps.fetch_places \
    --query "facultades UNMSM" \
    --query "biblioteca UNMSM" \
    --out app/tools/maps/data/places_raw.json

# 2) Generar el TS (destino SEPARADO del curado)
python -m app.tools.maps.build_unmsm_ts \
    --raw app/tools/maps/data/places_raw.json \
    --out ../frontend/src/features/map/constants/unmsm.generated.ts
```

`fetch_places` usa **Text Search** (`places:searchText`) con
`locationRestriction.rectangle` = los `bounds` del campus, pagina por
`nextPageToken`, combina varias consultas y deduplica por `id` de Places.
`build_unmsm_ts` mapea, descarta lugares fuera del rectángulo del campus
(`--no-bounds-filter` para desactivar) y **se niega a sobrescribir `unmsm.ts`**.

## Mapeo de campos (Places New → `CampusPlace`)

| CampusPlace        | Origen en Places                                        |
| ------------------ | ------------------------------------------------------- |
| `id`               | slug de `displayName.text` (único, sufijo `-2` en colisión) |
| `name`             | `displayName.text`                                      |
| `coordinate`       | `location.{latitude,longitude}` — **centroide**        |
| `description`      | `editorialSummary.text`                                 |
| `phone`            | `nationalPhoneNumber` ∥ `internationalPhoneNumber`      |
| `detailedSchedule` | `regularOpeningHours.weekdayDescriptions`               |
| `schedule`         | versión compacta (1 línea) de lo anterior; `""` si falta |
| `keywords`         | heurística: `displayName` + `types` (sin tildes, tokenizado) |

**No** rellenables desde Places (quedan vacíos / se omiten):
`annex`, `careers`, `usage`, `services`, `entranceCoordinate`.

## Advertencias (léelas)

- **ToS de Google:** salvo `place_id` (id), el contenido de Places **no** debe
  persistirse más de ~30 días. Trata `places_raw.json` y `unmsm.generated.ts`
  como **caché temporal**: regenéralos, no los archives como dataset permanente.
- **Centroide ≠ entrada peatonal:** `coordinate` es el centroide del POI, no la
  entrada que necesita el ruteo. Hay que ajustarlas a mano
  (`entranceCoordinate`).
- **Cobertura/calidad:** sólo aparece lo que Google indexa dentro del
  rectángulo; nombres/tipos/horarios pueden faltar o venir en inglés, y las
  `keywords` son heurísticas. Salida = punto de partida a revisar, no final.

## Tests (herméticos, sin red)

```bash
cd backend
venv/Scripts/python -m pytest -q tests/test_maps_mapping.py tests/test_maps_serialize.py
```

La lógica pura (slugs, mapeo, keywords, serialización) vive en `mapping.py` y se
prueba con fixtures sintéticas. La única llamada de red (`fetch_places`) no se
ejercita en tests.
