-- V7 · Id numérico para las categorías y `slug` aparte (HU-39).
--
-- Igual que V6 con los lugares: `place_categories.id` pasa de texto (`facultades`) a un entero
-- autoincremental y el texto anterior queda en `slug` (único). `places.category_id` pasa a
-- apuntar al id numérico. Las categorías existentes se renumeran 1..N según su orden.

alter table place_categories add column slug text;
update place_categories set slug = id;

alter table place_categories add column new_id bigint;
with numbered as (
    select id, row_number() over (order by sort_order, id) as n
    from place_categories
)
update place_categories c set new_id = numbered.n from numbered where c.id = numbered.id;

alter table places add column new_category bigint;
update places p set new_category = c.new_id from place_categories c where c.id = p.category_id;

-- Quitar `places.category_id` elimina su clave foránea y su índice.
alter table places drop column category_id;
alter table place_categories drop column id;

alter table place_categories rename column new_id to id;
alter table place_categories alter column id set not null;
alter table place_categories alter column slug set not null;
alter table place_categories add primary key (id);
alter table place_categories add constraint place_categories_slug_key unique (slug);
alter table place_categories
    add constraint place_categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

alter table places rename column new_category to category_id;
alter table places alter column category_id set not null;
alter table places
    add constraint places_category_fkey foreign key (category_id) references place_categories (id);
create index if not exists places_category_idx on places (category_id);

create sequence if not exists place_categories_id_seq owned by place_categories.id;
select setval('place_categories_id_seq', coalesce((select max(id) from place_categories), 0) + 1, false);
alter table place_categories alter column id set default nextval('place_categories_id_seq');
