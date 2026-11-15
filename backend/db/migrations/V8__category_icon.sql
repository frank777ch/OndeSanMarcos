-- V8 · Ícono de cada categoría.
--
-- `icon` guarda el nombre (kebab-case) de un ícono de la lista permitida (`app/places/icons.py`).
-- Las categorías existentes reciben el que antes estaba fijo en la web; las nuevas usan `map-pin`.

alter table place_categories add column icon text not null default 'map-pin';
alter table place_categories
    add constraint place_categories_icon_format check (icon ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

update place_categories set icon = case slug
    when 'facultades' then 'graduation-cap'
    when 'cafeterias' then 'utensils-crossed'
    when 'auditorios' then 'theater'
    when 'campos-deportivos' then 'trophy'
    when 'puertas' then 'door-open'
    when 'administracion' then 'briefcase'
    when 'salud' then 'stethoscope'
    when 'servicios' then 'wrench'
    when 'otros' then 'shapes'
    else icon
end;
