# HU-27 · API pública de lugares

- **Estado:** Implementada
- **Historia:** ver `../../histories.md#hu-27`
- **Depende de:** HU-22 (tablas `places` y `place_categories` con datos).
- **Archivos hermanos:** [plan.md](plan.md) · [task.md](task.md)

> `spec.md` dice **qué** debe hacer la historia y **cómo se comprueba**. El cómo técnico va en `plan.md` y el trabajo pendiente en `task.md`.

## 1. Contexto y objetivo
Con HU-22 los lugares ya están en Postgres, pero nada fuera del backend puede leerlos. Esta historia agrega endpoints de **solo lectura y sin autenticación** para consultar lugares y categorías. Son el contrato que usarán la web (HU-28), el asistente (HU-29) y, más adelante, el panel de administración. Como los lugares cambian poco y se piden en cada visita, las respuestas incluyen cabeceras de caché para no cargar la base.

## 2. Alcance
**Dentro:**
- `GET /api/places` (con filtro opcional por categoría), `GET /api/places/{id}` y `GET /api/place-categories`.
- Esquemas de respuesta con todos los campos de la ficha.
- Solo lugares publicados.
- Cabeceras de caché (`Cache-Control` y `ETag` con respuesta 304).
- Errores claros y documentación en `/docs`.
- Pruebas y documentación del backend.

**Fuera (y dónde se hace):**
- Crear, editar, despublicar o borrar lugares y categorías → HU-30.
- Que la web consuma estos endpoints → HU-28.
- Que el asistente use la tabla → HU-29.
- Listar lugares no publicados, también para el administrador → HU-30.
- Búsqueda de texto en el servidor: la búsqueda de la web sigue en memoria (HU-11).
- Paginación: son unas decenas de lugares.
- Eventos → HU-32.

## 3. Requisitos
Formato: «Cuando <situación>, el sistema debe <comportamiento>».

| ID | Requisito |
|---|---|
| RF-27.1 | Cuando se pide `GET /api/place-categories`, el sistema debe responder 200 con la lista de categorías, cada una con `id`, `label` y `color`, ordenada por `sort_order`. |
| RF-27.2 | Cuando se pide `GET /api/places`, el sistema debe responder 200 con la lista de lugares publicados. Cada lugar trae: `id`, `name`, `short_name`, `category_id`, `lat`, `lng`, `keywords`, `description`, `schedule`, `detailed_schedule`, `phone`, `annex`, `email`, `website`, `access_hint`, `careers`, `services`, `usage`, `image_url`, `parent_place_id`, `is_published`, `verified_at` y `updated_at`. |
| RF-27.3 | La respuesta de un lugar no debe incluir `created_at` ni `updated_by` (no son datos públicos). |
| RF-27.4 | Los lugares deben venir ordenados por nombre, de forma estable entre llamadas. Los campos de lista sin datos se devuelven como `[]` y los de texto sin dato como `null`. |
| RF-27.5 | Cuando se pide `GET /api/places?category=<id>`, el sistema debe devolver solo los lugares publicados de esa categoría. Si la categoría no existe, debe responder 200 con la lista vacía. |
| RF-27.6 | Cuando se pide `GET /api/places/{id}` de un lugar publicado, el sistema debe responder 200 con ese lugar, con los mismos campos que en la lista. |
| RF-27.7 | Cuando el lugar no existe, no está publicado o el `id` no es un slug válido, el sistema debe responder 404 con el mismo mensaje en los tres casos, de modo que no se pueda saber si existe un lugar oculto. |
| RF-27.8 | Los lugares con `is_published` falso no deben aparecer en `GET /api/places`, ni en ningún filtro, ni en el detalle. |
| RF-27.9 | Los tres endpoints deben ser públicos: no requieren `Authorization` y no cambian su respuesta si se envía uno. |
| RF-27.10 | Cada respuesta 200 de los tres endpoints debe incluir `Cache-Control: public, max-age=60` y un `ETag` calculado a partir del contenido. |
| RF-27.11 | Cuando la petición trae `If-None-Match` con el `ETag` vigente, el sistema debe responder 304 sin cuerpo y con el mismo `ETag`. Cuando el contenido cambió, debe responder 200 con el `ETag` nuevo. |
| RF-27.12 | Cuando las tablas están vacías, `GET /api/places` y `GET /api/place-categories` deben responder 200 con la lista vacía, no un error. |
| RF-27.13 | Cuando la base no responde, los tres endpoints deben responder 503 con un mensaje claro, no 500. |
| RF-27.14 | Cada endpoint debe pedir los datos con una cantidad fija de consultas a la base, sin importar cuántos lugares haya. |
| RF-27.15 | Los endpoints deben aparecer en la documentación interactiva (`/docs`) agrupados bajo «places», con descripción de cada campo y de los códigos de respuesta. |
| RF-27.16 | `backend/README.md` debe documentar los endpoints, sus campos y la política de caché. |

## 4. Escenarios de aceptación
**Escenario 1: listar lugares** (RF-27.2, RF-27.4, RF-27.9)
- **Dado** la base cargada con HU-22 y sin enviar credenciales
- **Cuando** pido `GET /api/places`
- **Entonces** recibo 200 con los 54 lugares, ordenados por nombre, cada uno con todos los campos de la ficha y sin `created_at` ni `updated_by`.

**Escenario 2: categorías** (RF-27.1)
- **Cuando** pido `GET /api/place-categories`
- **Entonces** recibo las 9 categorías con `id`, `label` y `color`, en el orden de `sort_order`.

**Escenario 3: filtrar por categoría** (RF-27.5)
- **Cuando** pido `GET /api/places?category=puertas` y luego `?category=no-existe`
- **Entonces** el primero trae solo las puertas y el segundo una lista vacía con 200.

**Escenario 4: detalle** (RF-27.6, RF-27.7)
- **Cuando** pido `GET /api/places/fisi`, `GET /api/places/no-existe` y `GET /api/places/Mi%20Lugar`
- **Entonces** el primero devuelve la ficha completa de la FISI y los otros dos, 404 con el mismo mensaje.

**Escenario 5: lugar no publicado** (RF-27.7, RF-27.8)
- **Dado** que `fisi` pasa a `is_published = false`
- **Cuando** pido la lista, la lista filtrada por `facultades` y su detalle
- **Entonces** `fisi` no aparece en las dos primeras y el detalle responde 404.

**Escenario 6: caché** (RF-27.10, RF-27.11)
- **Cuando** pido `GET /api/places` dos veces, la segunda con el `ETag` recibido en `If-None-Match`
- **Entonces** la primera trae `Cache-Control` y `ETag`, y la segunda responde 304 sin cuerpo; tras cambiar un horario en la base, la misma petición responde 200 con otro `ETag`.

**Escenario 7: base apagada** (RF-27.13)
- **Cuando** la base no responde y pido cualquiera de los tres endpoints
- **Entonces** recibo 503 con un mensaje claro.

**Escenario 8: documentación** (RF-27.15)
- **Cuando** abro `/docs`
- **Entonces** veo los tres endpoints bajo «places», con los campos descritos.

## 5. Preguntas abiertas
Resueltas el 2026-11-12 (se aprobaron las propuestas):
- **Forma de los campos:** `snake_case` y `lat`/`lng`, como las columnas; la web los adapta a su tipo `Place` en HU-28.
- **Duración de la caché:** 60 segundos, con `ETag` para revalidar.
- **Forma de los listados:** arreglo simple.
- **Categoría inexistente en el filtro:** 200 con lista vacía.

## 6. Historial
- 2026-11-12 · Borrador creado.
- 2026-11-12 · Aprobada: preguntas abiertas resueltas.
- 2026-11-12 · Implementada.
