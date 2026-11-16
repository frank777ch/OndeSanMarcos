-- V11 · Se quita el atributo de verificación de los lugares.
--
-- `verified_at` marcaba los datos confirmados con la universidad; ya no se usa ni en la API ni en el panel.

alter table places drop column if exists verified_at;
