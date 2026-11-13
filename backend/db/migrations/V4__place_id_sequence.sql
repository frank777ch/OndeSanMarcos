-- V4 · Ids numéricos para los lugares nuevos (HU-30).
--
-- Los lugares cargados por la semilla conservan su slug (`fisi`). Los que crea el
-- administrador reciben un número incremental que nunca se reutiliza. Empieza en
-- 1000 para no confundirse con los ids numéricos antiguos de la web ("1"–"40").

create sequence if not exists places_id_seq start 1000;
