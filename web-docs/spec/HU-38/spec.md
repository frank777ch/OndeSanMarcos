# HU-38 · Id numérico de los lugares y `slug` aparte

- **Estado:** Implementada
- **Depende de:** HU-22 (tablas), HU-27 (API pública), HU-30 (API de administración), HU-31 (panel).
- **Archivos hermanos:** [plan.md](plan.md) · [task.md](task.md)

## 1. Contexto y objetivo
`places.id` era un texto: el slug de los 54 lugares de la semilla (`biblioteca-central`) o un número guardado como texto en los creados desde el panel. En el panel se veían ids con guiones (`id cafeteria-de-la-facultad-de-ingenieria-civil`). Se decidió usar un id numérico normal y mover el slug a una columna propia.

## 2. Alcance
**Dentro:** migración V6; `slug` en la semilla, la API y el panel; ids enteros en backend y web; el chat resuelve el slug del asistente.
**Fuera:** que el corpus del asistente use ids numéricos (HU-29); quitar el slug de la API pública.

## 3. Requisitos
| ID | Requisito |
|---|---|
| RF-38.1 | `places.id` debe ser un entero (`bigint`) asignado por la base, único y nunca reutilizado. |
| RF-38.2 | Debe existir `places.slug` (texto único, solo minúsculas, dígitos y guiones). |
| RF-38.3 | La migración debe conservar los datos: los lugares existentes se renumeran, su slug anterior pasa a `slug`, y los lugares contenedores (`parent_place_id`) siguen apuntando al mismo lugar. |
| RF-38.4 | La semilla identifica los lugares por `slug` (y el padre por `parent_slug`); una segunda corrida no duplica, no pisa ediciones, no cambia ids ni consume la secuencia. |
| RF-38.5 | Al crear un lugar, el `slug` se genera del nombre (sin tildes, en minúsculas, con guiones); si ya existe se agrega `-2`, `-3`…, también con creaciones simultáneas. El `slug` no cambia al renombrar el lugar. |
| RF-38.6 | `id` y `slug` no se aceptan en el cuerpo de crear ni de editar (422). |
| RF-38.7 | La API pública y la de administración devuelven `id` (entero) y `slug`; `parent_place_id` es un entero. |
| RF-38.8 | Las rutas `/api/places/{id}` y `/api/admin/places/{id}` aceptan un entero positivo; cualquier otro valor da el mismo 404 que un lugar inexistente. |
| RF-38.9 | La búsqueda del administrador (`q`) también encuentra por id y por slug. |
| RF-38.10 | La web usa el id numérico para elegir lugares, rutas y selección en el mapa. |
| RF-38.11 | La lista de administración muestra `#id` (no el slug); el formulario muestra el id y el slug en solo lectura. |
| RF-38.12 | El asistente sigue nombrando los lugares por slug: «Ver en el mapa» y el filtro de lugares conocidos del chat los resuelven por slug. |

## 4. Escenarios de aceptación
1. **Detalle** (RF-38.7, 38.8): `GET /api/places/3` devuelve `id: 3` y su `slug`; `/api/places/biblioteca-central` es 404.
2. **Slug repetido** (RF-38.5): dos lugares «Cafetería Central» quedan como `cafeteria-central` y `cafeteria-central-2`.
3. **Migración** (RF-38.3): tras aplicarla, los 54 lugares siguen y conservan su slug; un lugar creado antes desde el panel conserva su número.
4. **Panel** (RF-38.11): en la lista no aparecen ids con guiones.
5. **Chat** (RF-38.12): una tarjeta del asistente con el slug `biblioteca-central` abre el mapa en ese lugar.

## 5. Preguntas abiertas
Resueltas el 2026-11-12: el `id` es un número entero en la API y la web (no un texto); el slug se genera del nombre al crear.

## 6. Historial
- 2026-11-12 · Spec aprobada.
- 2026-11-12 · Implementada y probada. Verificada manualmente en el navegador por el usuario. Un lugar de prueba creado antes desde el panel («Kiosko FISI», id 1001) conservó su número y su slug se corrigió a mano a `kiosko-fisi` en la base de desarrollo.
