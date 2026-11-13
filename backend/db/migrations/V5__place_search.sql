-- V5 · Búsqueda de lugares tolerante a tildes y errores de escritura (HU-36).
--
-- `unaccent` quita tildes y `pg_trgm` mide el parecido entre textos. Con decenas de
-- lugares no hacen falta índices; si el catálogo crece, agregar un índice GIN
-- (gin_trgm_ops) sobre `immutable_unaccent(lower(name))`.

create extension if not exists unaccent;
create extension if not exists pg_trgm;

-- `unaccent` no está marcada como inmutable; este envoltorio fija el diccionario para poder
-- usarla en índices y expresiones.
create or replace function immutable_unaccent(text)
returns text
language sql immutable parallel safe strict
as $$ select public.unaccent('public.unaccent'::regdictionary, $1) $$;
