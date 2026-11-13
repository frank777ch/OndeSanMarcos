-- V3 · Lugares del campus y sus categorías.
--
-- Fuente única de los lugares (antes repartidos entre la web, el backend y la
-- app móvil). `id` es un slug estable: lo usan el mapa, el asistente y los
-- `place_id` del corpus. Los datos de ficha sin confirmar tienen `verified_at`
-- vacío. Las restricciones viven aquí para que valgan también para la API.

create table if not exists place_categories (
    id         text primary key,
    label      text not null check (label <> ''),
    color      text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
    sort_order integer not null default 0
);

create table if not exists places (
    id                text primary key
                          check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    name              text not null check (name <> ''),
    short_name        text,
    category_id       text not null references place_categories (id),
    lat               double precision not null check (lat between -90 and 90),
    lng               double precision not null check (lng between -180 and 180),
    keywords          text[] not null default '{}',
    description       text,
    schedule          text,
    detailed_schedule text[] not null default '{}',
    phone             text,
    annex             text,
    email             text,
    website           text,
    access_hint       text,
    careers           text[] not null default '{}',
    services          text[] not null default '{}',
    usage             text,
    image_url         text,
    parent_place_id   text references places (id),
    is_published      boolean not null default true,
    verified_at       timestamptz,
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now(),
    updated_by        text,
    check (parent_place_id is null or parent_place_id <> id)
);

create index if not exists places_category_idx  on places (category_id);
create index if not exists places_published_idx on places (is_published);
