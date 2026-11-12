-- V2 · Administradores de la app.
--
-- `password_hash` guarda el hash bcrypt, nunca la contraseña en claro.
-- El administrador inicial lo crea el backend al arrancar (ADMIN_USERNAME / ADMIN_PASSWORD).

create table if not exists admin_users (
    id            bigint generated always as identity primary key,
    username      text        not null unique,
    password_hash text        not null,
    created_at    timestamptz not null default now()
);
