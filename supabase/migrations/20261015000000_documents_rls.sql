-- Cierra la tabla `documents` a los roles públicos de Supabase.
--
-- Supabase otorga por defecto privilegios sobre las tablas nuevas de `public` a
-- `anon` y `authenticated`, y la anon key va embebida en la app (es pública).
-- Sin esto, cualquiera podría leer o BORRAR el corpus vía la API REST.
-- El backend usa `service_role`, que ignora RLS, así que no le afecta.
-- Idempotente.

alter table documents enable row level security;

revoke all on table documents from anon, authenticated;
revoke execute on function match_documents(vector, int) from public, anon, authenticated;
