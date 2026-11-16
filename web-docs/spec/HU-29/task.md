# HU-29 · Tareas

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

> `task.md` es la lista de trabajo, en el orden en que se ejecuta. Cada tarea es pequeña (≲ 1 h) y apunta al requisito que cubre. Se marca `[x]` al terminar.

## Tareas
- [x] T1 · Tabla de slugs viejos → slugs de la base (21 de `CAMPUS_PLACES`, 3 de `gaps_review.json`) (RF-29.2, RF-29.3)
- [x] T2 · Pasar a `places.json` las descripciones, horarios y palabras clave de `corpus.py`, `CAMPUS_PLACES` y `gaps_review.json`, sin pisar valores existentes (RF-29.1, RF-29.2)
- [x] T3 · Quitar de `corpus.py` los 30 documentos con `place_id`; marcar las 7 entradas como integradas; test de datos (RF-29.1, RF-29.3)
- [x] T4 · Migración `V9__documents_source.sql` (`source_type`, `source_id`, índice único); test de integración (RF-29.16)
- [x] T5 · `app/places/document.py`: `place_document`; tests (RF-29.4)
- [x] T6 · `Database`: `place_for_sync`, `places_for_sync`, `replace_source`, `delete_source`; tests de integración (RF-29.5, RF-29.6)
- [x] T7 · Mover `_rows_for_document` a `rag/ingestion.py` como `document_rows` y rellenar `source_type` y `source_id`; actualizar `upload_entries` (RF-29.5, RF-29.16)
- [x] T8 · `app/places/sync.py`: `RagPlaceSync` y `get_place_sync()` (real o `skipped`); tests con base y embedding falsos (RF-29.5 a RF-29.9)
- [x] T9 · `app/places/directory.py`: `PlaceDirectory` con TTL, invalidación y coincidencia por límite de palabra; tests (RF-29.11, RF-29.12, RF-29.15)
- [x] T10 · `engine.py` y `guardrails.py` usan el directorio; descartar fragmentos de lugares despublicados; no rechazar lugares publicados; adaptar los tests que usan `CAMPUS_PLACES` (RF-29.11, RF-29.13, RF-29.14)
- [x] T11 · Borrar `CAMPUS_PLACES` de `knowledge/places.py` y retirar `export_seed.py` con sus tests (RF-29.1)
- [x] T12 · `ingest_pgvector.py`: corpus general más la ficha de cada lugar publicado; test (RF-29.10)
- [x] T13 · `app/places/reindex.py` y `./scripts/dev.sh reindex-places`; test del script (RF-29.18)
- [x] T14 · Plantilla de `db-snapshot` con inserción condicional; regenerar el snapshot tras una ingesta; test de integración (RF-29.17)
- [x] T15 · Documentación: `backend/README.md`, cabecera de `dev.sh`, tarea pendiente de `HU-30/task.md`

## Verificación final
- [x] `./scripts/dev.sh test`: 364 pruebas unitarias y 86 de integración en verde
- [x] Base temporal: Flyway llena `documents` (99 filas); volver a migrar con datos no borra nada; un snapshot cambiado sobre una base con datos conserva las fichas del panel
- [x] Los lugares que estaban rotos (Ingeniería Civil, Psicología, cafeterías de facultad) los encuentra el directorio con la base real
- [ ] Escenarios 1 a 4 y 6 de `spec.md` comprobados a mano con `RAG_USE_MOCK=false` y una clave real (crear, editar y despublicar desde el panel y preguntar al chat; repetir con una clave inválida). **Pendiente**: solo están cubiertos con pruebas y embeddings falsos, para no gastar cuota
- [ ] `spec.md` en «Implementada»; tabla resumen y título en `../../histories.md` con ✅ (tras la comprobación manual)
- [ ] Commit `feat(backend): HU-29 …` con spec, plan, task y código

## Pendiente / notas
- La ingesta completa (`ingest --force`) ya se ejecutó una vez: 85 llamadas a Gemini y 14 de caché; `documents` quedó con 14 fragmentos de corpus y 85 en 54 fichas de lugar.
- Cambios sobre el plan, surgidos al implementar:
  - `PlaceDirectory.find` ordena por la coincidencia más larga: sin eso, «facultad de ingeniería civil» devolvía antes su cafetería y la ruta se trazaba hacia ella (RF-29.11).
  - `Database.replace_place` y `count_place` ignoran las fichas (`source_type = 'place'`), para que `upload_entries --update-existing` no borre la ficha de un lugar.
  - Las entradas de `gaps_review.json` pasan a `status = "integrated"`: la ingesta ya no las carga.
  - `test_dev_script.py` apuntaba a `script/dev.sh` (la carpeta es `scripts/`), así que todos sus tests se omitían; se corrigió la ruta y una aserción obsoleta del compose.
- Las descripciones se fusionaron con la regla «añadir las oraciones que aporten al menos 2 palabras nuevas»: no se pierde información, pero algunas descripciones quedan con frases parecidas repetidas (p. ej. CEPRE, OCA). Conviene pulirlas desde el panel.
- Eventos (HU-34) seguirán el mismo patrón: tabla, ficha y sincronización.
- Siglas (2026-11-15): la sigla de un lugar (FISI, FCA…) es el dato opcional `short_name`, no el slug. `places.json` y la migración `V10` la rellenan para 17 lugares y la quitan del `name` de `fisi`, `oca` y `cepreunmsm`; la card del mapa la muestra (RF-12.19). **Pendiente**: `./scripts/dev.sh reindex-places` (27 llamadas a Gemini) y luego `db-snapshot`, para que las fichas del asistente digan «Sigla: …». Mientras tanto la búsqueda del asistente ya reconoce las siglas, porque lee la tabla `places`.
