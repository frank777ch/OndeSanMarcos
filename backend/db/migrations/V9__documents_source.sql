-- V9 · Origen de cada fragmento del asistente (HU-29).
--
-- `source_type` dice de dónde sale el fragmento y `source_id` identifica el documento:
--   corpus  conocimiento general (sedes, preguntas frecuentes...); `source_id` = id del documento.
--   place   ficha de un lugar generada desde la tabla `places`; `source_id` = slug del lugar.
--   entry   entradas revisadas que se suben con `upload_entries`.
-- El slug se usa porque es estable entre bases (el id numérico lo asigna cada base).
-- Con esto, sincronizar un lugar reemplaza solo su ficha: `delete where source_type = 'place'
-- and source_id = <slug>` en vez de buscar dentro de `metadata`.

alter table documents
    add column if not exists source_type text,
    add column if not exists source_id   text;

-- Lo que ya había es el corpus general (los documentos de lugar se rehacen con la ingesta).
update documents
set source_type = 'corpus',
    source_id   = metadata->>'document_id'
where source_type is null;

-- Un fragmento por origen y posición. Parcial: las filas sin origen (copias antiguas) no cuentan.
create unique index if not exists documents_source_uidx
    on documents (source_type, source_id, ((metadata->>'position')::int))
    where source_type is not null;
