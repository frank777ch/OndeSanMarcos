# HU-39 · Id numérico de las categorías y `slug` aparte

- **Estado:** Implementada
- **Depende de:** HU-38 (mismo patrón en los lugares), HU-30 (API de administración), HU-31 (panel).
- **Archivos hermanos:** [plan.md](plan.md) · [task.md](task.md)

## 1. Contexto y objetivo
`place_categories.id` era un texto con guiones (`campos-deportivos`) y el administrador lo escribía a mano al crear una categoría. Se decidió aplicar a las categorías lo mismo que a los lugares (HU-38): id numérico y `slug` aparte, generado del nombre.

## 2. Alcance
**Dentro:** migración V7; `slug` en semilla, API y panel; ids enteros en backend y web; formulario sin campo de id.
**Fuera:** permitir editar el slug; la app móvil.

## 3. Requisitos
| ID | Requisito |
|---|---|
| RF-39.1 | `place_categories.id` debe ser un entero (`bigint`) asignado por la base, único y nunca reutilizado. |
| RF-39.2 | Debe existir `place_categories.slug` (único; solo minúsculas, dígitos y guiones). |
| RF-39.3 | La migración conserva los datos: renumera las categorías 1..N por su orden, guarda el texto anterior en `slug` y actualiza `places.category_id` para que cada lugar siga en su categoría. |
| RF-39.4 | La semilla identifica categorías por `slug` y cada lugar referencia su categoría por `category_slug` (`places-seed/v3`); una segunda corrida no duplica ni pisa ediciones. |
| RF-39.5 | Al crear una categoría el `slug` sale de la etiqueta (sin tildes, con guiones; `-2`, `-3`… si ya existe, también con altas simultáneas) y no cambia al renombrarla. |
| RF-39.6 | `id` y `slug` no se aceptan al crear ni al editar (422). |
| RF-39.7 | `GET /api/place-categories` y la API de administración devuelven `id` (entero) y `slug`; `places.category_id` es un entero. |
| RF-39.8 | `?category=` (pública y de administración) y las rutas `/place-categories/{id}` usan el id entero; un valor que no es un entero da 422. |
| RF-39.9 | En la web, la categoría de un lugar, el filtro activo del mapa y el filtro del panel usan el id numérico. |
| RF-39.10 | El formulario de categorías no tiene campo de id; al editar muestra el id y el slug de solo lectura. |

## 4. Escenarios de aceptación
1. **Crear** (RF-39.5): «Laboratorios y Talleres» → `slug: laboratorios-y-talleres`; otra igual → `…-2`.
2. **Filtro** (RF-39.8): `/api/places?category=5` devuelve las puertas; `?category=puertas` da 422.
3. **Migración** (RF-39.3): tras aplicarla, cada lugar sigue en su categoría y las 9 categorías conservan su slug.
4. **Panel** (RF-39.10): el diálogo «Nueva categoría» no pide id.

## 5. Historial
- 2026-11-12 · Spec aprobada (decisión del usuario: «haz lo mismo con las categorías, ahí que se llame slug»).
- 2026-11-12 · Implementada y probada; verificada manualmente en el navegador por el usuario.
