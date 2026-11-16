-- V10 · Siglas de los lugares en `short_name`.
--
-- La sigla (FISI, FCA...) es un dato opcional del lugar, no su slug. Hasta ahora estaba solo dentro
-- del texto o de las palabras clave, o entre paréntesis en el nombre. Esta migración:
--   1. pone la sigla donde `short_name` esté vacío (no pisa una sigla editada desde el panel);
--   2. quita la sigla del nombre de 3 lugares, solo si el nombre sigue siendo el de la semilla,
--      para que la ficha no la muestre repetida («... Informática (FISI) · FISI»).
-- En una base nueva `places` está vacía al migrar: no hace nada y los datos llegan por la semilla.

update places
set short_name = v.sigla
from (values
    ('fisi', 'FISI'),
    ('facultad-de-ingenieria-civil', 'FIC'),
    ('facultad-de-ingenieria-electronica-y-electrica', 'FIEE'),
    ('facultad-de-ingenieria-geologica-minera-y-metalurgica', 'FIGMMG'),
    ('facultad-de-ingenieria-industrial', 'FII'),
    ('facultad-de-quimica-e-ingenieria-quimica', 'FQIQ'),
    ('facultad-de-ciencias-fisicas', 'FCF'),
    ('facultad-de-ciencias-matematicas', 'FCM'),
    ('facultad-de-ciencias-administrativas', 'FCA'),
    ('facultad-de-ciencias-sociales', 'FCCSS'),
    ('facultad-de-ciencias-contables', 'FCC'),
    ('facultad-de-ciencias-economicas-nuevo', 'FCE'),
    ('facultad-de-letras-y-ciencias-humanas', 'FLCH'),
    ('derecho', 'FDCP'),
    ('posgrado', 'DGEP'),
    ('oca', 'OCA'),
    ('cepreunmsm', 'CEPREUNMSM')
) as v(slug, sigla)
where places.slug = v.slug
  and (places.short_name is null or places.short_name = '');

update places set name = 'Facultad de Ingeniería de Sistemas e Informática'
where slug = 'fisi' and name = 'Facultad de Ingeniería de Sistemas e Informática (FISI)';

update places set name = 'Oficina Central de Admisión'
where slug = 'oca' and name = 'Oficina Central de Admisión (OCA)';

update places set name = 'Centro Preuniversitario UNMSM'
where slug = 'cepreunmsm' and name = 'Centro Preuniversitario UNMSM (CEPREUNMSM)';
