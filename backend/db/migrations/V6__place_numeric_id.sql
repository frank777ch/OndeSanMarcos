-- V6 · Id numérico para los lugares y `slug` aparte (HU-38).
--
-- Hasta ahora `places.id` era un texto (slug de los 54 lugares de la semilla o un número
-- guardado como texto en los nuevos). Pasa a ser un entero autoincremental y el slug
-- antiguo queda en `slug` (único, estable; lo usa el corpus del asistente como `place_id`).
-- Los lugares existentes se renumeran 1..N en orden de nombre; los que ya tenían un id
-- numérico (creados desde el panel) conservan ese número.

alter table places add column slug text;
update places set slug = id;

alter table places add column new_id bigint;
alter table places add column new_parent bigint;

update places set new_id = id::bigint where id ~ '^[0-9]+$';
with numbered as (
    select id, row_number() over (order by name, id) as n
    from places
    where id !~ '^[0-9]+$'
)
update places p set new_id = numbered.n
from numbered
where p.id = numbered.id
  and not exists (select 1 from places q where q.new_id = numbered.n);

-- Si alguna renumeración chocara con un id numérico previo, se continúa tras el máximo.
with pending as (
    select id, row_number() over (order by name, id) as n
    from places
    where new_id is null
)
update places p
set new_id = (select coalesce(max(new_id), 0) from places) + pending.n
from pending
where p.id = pending.id;

update places c set new_parent = p.new_id
from places p
where p.id = c.parent_place_id;

-- Quitar las columnas viejas elimina sus restricciones (clave primaria, formato del slug,
-- clave foránea y la comprobación padre <> id).
alter table places drop column parent_place_id;
alter table places drop column id;

alter table places rename column new_id to id;
alter table places rename column new_parent to parent_place_id;

alter table places alter column id set not null;
alter table places alter column slug set not null;
alter table places add primary key (id);
alter table places add constraint places_slug_key unique (slug);
alter table places add constraint places_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
alter table places add constraint places_parent_fkey foreign key (parent_place_id) references places (id);
alter table places add constraint places_parent_not_self check (parent_place_id is null or parent_place_id <> id);

-- La secuencia de V4 pasa a ser el valor por defecto del id y continúa tras el mayor existente.
alter sequence places_id_seq minvalue 1 start with 1 restart with 1;
select setval('places_id_seq', coalesce((select max(id) from places), 0) + 1, false);
alter sequence places_id_seq owned by places.id;
alter table places alter column id set default nextval('places_id_seq');
