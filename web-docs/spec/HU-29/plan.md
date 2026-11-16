# HU-29 · Plan técnico

- **Spec:** [spec.md](spec.md)
- **Estado:** Aprobado

> `plan.md` dice **cómo** se construye lo que pide `spec.md`: diseño, archivos y decisiones. No repite los requisitos; los referencia por ID.

## 1. Enfoque
Tres piezas, todas en el backend:
1. **Datos:** `places.json` pasa a ser la única fuente inicial de lugares. Lo que hoy vive en `corpus.py`, `CAMPUS_PLACES` y `gaps_review.json` se funde en él con los slugs de la base, y `corpus.py` queda solo con el conocimiento general (sedes, preguntas frecuentes, transporte).
2. **Ficha por lugar:** una función pura arma el texto de la ficha desde la fila de `places`; `RagPlaceSync` la embebe y la reemplaza en `documents` (o la borra si el lugar se despublica). Se conecta en `app/places/sync.py`, el punto único que HU-30 ya dejó preparado, sin tocar la API.
3. **Motor:** `PlaceDirectory` sustituye a `CAMPUS_PLACES`: lee los lugares publicados de la base, los guarda en memoria con un TTL de 60 s y se invalida al sincronizar.

El gasto de Gemini queda acotado: un `ingest --force` una vez (la caché en disco reutiliza lo que no cambió) y después una llamada por lugar creado o editado.

## 2. Datos y tipos
**Migración `V9__documents_source.sql`** (la última es `V8`):
```sql
alter table documents add column source_type text, add column source_id text;
update documents set source_type = 'corpus', source_id = metadata->>'document_id';
create unique index documents_source_uidx
    on documents (source_type, source_id, ((metadata->>'position')::int))
    where source_type is not null;
```
`source_type` vale `corpus` (conocimiento general), `place` (ficha de un lugar) o `entry` (entradas de `upload_entries`). `source_id` es el id del documento, o el **slug** del lugar: es estable entre bases, porque `update_place` no lo cambia. `metadata.document_id` se conserva para no romper `find_gaps` ni los tests.

**Ficha** (`app/places/document.py`): `place_document(place: dict) -> Document`, función pura. Título = nombre. Texto = descripción más líneas de sigla, categoría, «Dentro de …», horario, horario detallado, cómo llegar, carreras, servicios, uso y contacto, omitiendo los vacíos. Devuelve `Document(id="place-<slug>", title=name, text=…, place_id=slug)`.

**Directorio** (`app/places/directory.py`): `PlaceDirectory` con `find(query)`, `get(slug)`, `published_slugs()` e `invalidate()`. En modo real lee `Database.list_places()` y arma `CampusPlace` (`id=slug`, `coordinate`, `keywords` más nombre y sigla). En modo mock lee `db/seed/places.json`. La coincidencia es por límite de palabra, con el mismo patrón que `_SCOPE_REGEX` en `guardrails.py`.

## 3. Archivos
| Ruta | Qué hace | Cubre |
|---|---|---|
| `backend/db/seed/places.json` | Recibe las descripciones, horarios y palabras clave que estaban en otros archivos; slugs de la base | RF-29.1, RF-29.2 |
| `backend/app/knowledge/corpus.py` | Se quitan los 30 documentos con `place_id`; quedan los 11 generales | RF-29.1, RF-29.3 |
| `backend/app/knowledge/entries/gaps_review.json` | Las 7 entradas se marcan como integradas en la semilla | RF-29.2, RF-29.3 |
| `backend/app/knowledge/places.py` | Se borra `CAMPUS_PLACES`; quedan `CampusPlace`, `Coordinate` y `normalize` | RF-29.11 |
| `backend/app/tools/places/export_seed.py` | Se retira: se ejecutó una sola vez (HU-22) y depende de `CAMPUS_PLACES` | RF-29.1 |
| `backend/db/migrations/V9__documents_source.sql` | Columnas `source_type` y `source_id` con índice único | RF-29.16 |
| `backend/app/places/document.py` | `place_document` | RF-29.4 |
| `backend/app/rag/db.py` | `place_for_sync`, `places_for_sync`, `replace_source`, `delete_source` | RF-29.5, RF-29.6 |
| `backend/app/rag/ingestion.py` | Recibe `document_rows` (antes `_rows_for_document` de `upload_entries`) | RF-29.5 |
| `backend/app/rag/upload_entries.py` | Usa `document_rows` | RF-29.5 |
| `backend/app/rag/ingest_pgvector.py` | Corpus general más la ficha de cada lugar publicado | RF-29.10 |
| `backend/app/places/sync.py` | `RagPlaceSync` y `get_place_sync()` | RF-29.5 a RF-29.9 |
| `backend/app/places/directory.py` | `PlaceDirectory` | RF-29.11 a RF-29.15 |
| `backend/app/rag/engine.py` | Usa el directorio, descarta fragmentos de lugares despublicados y no rechaza lugares publicados | RF-29.11, RF-29.13, RF-29.14 |
| `backend/app/rag/guardrails.py` | Toma las palabras clave del directorio | RF-29.14 |
| `backend/app/places/reindex.py` | `python -m app.places.reindex` | RF-29.18 |
| `scripts/dev.sh` | Comando `reindex-places`; plantilla de `db-snapshot` con inserción condicional | RF-29.17, RF-29.18 |
| `backend/db/migrations/R__documents_snapshot.sql` | Se regenera tras la ingesta, con `source_type` y `source_id` | RF-29.16, RF-29.17 |
| `backend/README.md`, `web-docs/spec/HU-30/task.md` | `rag_sync` puede valer `ok`; se cierra la tarea pendiente de HU-30 | RF-29.5 |

## 4. Estado (caché) y comunicación
`PlaceDirectory` es un único objeto por proceso (`lru_cache`). `RagPlaceSync.sync` llama a `invalidate()` tras escribir; los demás procesos lo ven en el siguiente TTL de 60 s. Si el servidor corre en varios procesos, el motor tarda como máximo 60 s en ver un cambio hecho en otro.

Orden de `sync`: leer la fila → embeber → escribir. Como primero se calcula el embedding, un fallo del servicio deja la ficha anterior intacta (RF-29.7). `replace_source` borra e inserta en una sola transacción.

## 5. Decisiones
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| `places.json` como única fuente inicial; la base, fuente de verdad después | Mantener `corpus.py` y `CAMPUS_PLACES` en paralelo | Hoy están desalineados (21 slugs rotos) y editar un dato exige tocar tres sitios |
| Identificar la ficha con `source_type='place'` y `source_id=slug` | Seguir con `metadata.document_id` y borrar por JSON | Índice único y borrado por columna; ya lo pedía la historia |
| Slug como `source_id`, no el id numérico | `places.id` | El id lo asigna cada base; el slug sale igual de la semilla en cualquier máquina |
| Directorio en memoria con TTL e invalidación | Consultar la base en cada pregunta | El chat llama al directorio varias veces por consulta; 60 s de desfase máximo es aceptable |
| Snapshot que solo llena una tabla vacía | `truncate` y reinsertar | En producción pisaría las fichas creadas desde el panel |
| Coincidencia por límite de palabra | Subcadena (`in`) | Evita falsos positivos como «pre» en «presupuesto» |

## 6. Estrategia de pruebas
| Requisito | Test |
|---|---|
| RF-29.1, RF-29.3 | `test_corpus_data.py` › «RF-29.1: ningún documento del corpus lleva place_id» y «RF-29.3: todo slug existe en places.json» |
| RF-29.4 | `test_place_document.py` › «RF-29.4: incluye los campos y omite los vacíos» |
| RF-29.5, RF-29.6 | `test_place_sync.py` › «RF-29.5: crear reemplaza la ficha» y «RF-29.6: despublicar la borra» (base y embedding falsos) |
| RF-29.7 | `test_place_sync.py` › «RF-29.7: si falla el embedding no se toca la base» |
| RF-29.8 | `test_place_sync.py` › «RF-29.8: modo mock devuelve skipped» |
| RF-29.9 | `test_places_admin_api.py` › «RF-29.9: reindex devuelve el resultado del sync» |
| RF-29.10 | `test_ingest_pgvector.py` › «RF-29.10: la ingesta usa los lugares de la base» |
| RF-29.11 a RF-29.15 | `test_engine.py` y `test_place_directory.py` › «RF-29.11 … RF-29.15» |
| RF-29.16 | `tests/integration/test_schema.py` › «RF-29.16: el índice único impide duplicados» |
| RF-29.17 | `tests/integration/test_snapshot.py` › «RF-29.17: el snapshot no pisa datos» |
| RF-29.18 | `test_dev_script.py` › «RF-29.18: reindex-places» |

Se prueba a mano, con `RAG_USE_MOCK=false` y una clave real, los escenarios 1 a 4 y 6: crear, editar y despublicar un lugar desde el panel y preguntar al chat; repetir con una clave inválida.

## 7. Riesgos y dependencias
- **Cuota de Gemini:** el primer `ingest --force` embebe todo el corpus. La caché en disco reutiliza lo que no cambie y se hace una sola vez.
- **Etiqueta de categoría:** si se renombra una categoría, las fichas de sus lugares conservan la etiqueta vieja hasta `reindex-places`.
- **Datos fundidos:** la regla «combinar siempre» es automática; se revisa el resultado en el diff de `places.json` antes de ingerir.
- **Varios procesos:** el desfase de hasta 60 s entre procesos se acepta.
- **Orden:** `V9` debe aplicarse antes del snapshot regenerado; el snapshot incluye las columnas nuevas.

## 8. Historial
- 2026-11-15 · Plan creado.
- 2026-11-15 · Aprobado junto con la spec.
