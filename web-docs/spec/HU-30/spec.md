# HU-30 · Administrar lugares (API)

- **Estado:** Implementada
- **Historia:** ver `../../histories.md#hu-30`
- **Depende de:** HU-25 (autenticación del administrador), HU-27 (API pública de lugares) y HU-29 (el asistente lee la tabla y `reindex_place`).
- **Archivos hermanos:** [plan.md](plan.md) · [task.md](task.md)

> `spec.md` dice **qué** debe hacer la historia y **cómo se comprueba**. El cómo técnico va en `plan.md` y el trabajo pendiente en `task.md`.

## 1. Contexto y objetivo
Hoy los lugares solo se pueden cambiar con SQL o recargando la semilla. Esta historia agrega a la API los endpoints de **escritura** para que el administrador cree, edite, verifique y despublique lugares, y cree, edite y borre categorías, protegidos con el token de HU-25. Cada cambio debe verse enseguida en la API pública y en las respuestas del asistente, que usan los mismos datos (HU-27 y HU-29). La pantalla que los usa es HU-31.

## 2. Alcance
**Dentro:**
- Endpoints de administración para lugares (listar, ver, crear, editar, verificar y despublicar) y para categorías (listar, crear, editar y borrar).
- Listado de administración que incluye los lugares no publicados y los datos internos (`created_at`, `updated_by`).
- Validación de los datos y errores que nombran el campo.
- Registro de quién y cuándo modificó cada lugar.
- Sincronización con el asistente (`reindex_place` de HU-29) y reintento manual.
- Pruebas y documentación del backend.

**Fuera (y dónde se hace):**
- Pantallas de administración → HU-31.
- Subir imágenes: solo se guarda la dirección (`image_url`).
- Historial de cambios o deshacer.
- Edición simultánea por dos administradores: gana el último en guardar; no hay bloqueo.
- Borrar lugares: no se ofrece; para sacar un lugar de circulación se despublica (`is_published`).
- Crear, listar o cambiar administradores → historia futura.
- Eventos y su relación con los lugares → HU-32.
- Reordenar categorías con arrastre: solo se cambia `sort_order` a mano.

## 3. Requisitos
Formato: «Cuando <situación>, el sistema debe <comportamiento>». Todas las rutas cuelgan de `/api/admin`.

### Acceso
| ID | Requisito |
|---|---|
| RF-30.1 | Cuando una petición a cualquier endpoint de `/api/admin/places` o `/api/admin/place-categories` no trae un token válido, el sistema debe responder 401 con `WWW-Authenticate: Bearer`, sin modificar nada. Los endpoints públicos de HU-27 no cambian. |
| RF-30.2 | Las respuestas de administración no deben incluir cabeceras de caché públicas: deben llevar `Cache-Control: no-store`. |

### Lugares: lectura
| ID | Requisito |
|---|---|
| RF-30.3 | Cuando se pide `GET /api/admin/places`, el sistema debe responder 200 con **todos** los lugares, publicados o no, ordenados por nombre, con los campos de la API pública más `created_at` y `updated_by`. |
| RF-30.4 | El listado debe aceptar los filtros opcionales `category`, `published` (`true` o `false`), `verified` (`true` o `false`) y `q` (texto que se busca, sin tildes ni mayúsculas, en nombre, nombre corto, palabras clave y `id`). Los filtros se combinan con «y». |
| RF-30.5 | Cuando se pide `GET /api/admin/places/{id}` de un lugar existente, publicado o no, el sistema debe responder 200 con el lugar completo. Si no existe, 404. |

### Lugares: crear y editar
| ID | Requisito |
|---|---|
| RF-30.6 | Cuando se envía `POST /api/admin/places` con datos válidos, el sistema debe crear el lugar y responder 201 con el lugar completo y la cabecera `Location`. El lugar debe aparecer en `GET /api/places` y `GET /api/places/{id}`, salvo que se haya creado con `is_published` falso. |
| RF-30.7 | Los campos obligatorios al crear son `name`, `category_id`, `lat` y `lng`. Son opcionales `short_name`, `keywords`, `description`, `schedule`, `detailed_schedule`, `phone`, `annex`, `email`, `website`, `access_hint`, `careers`, `services`, `usage`, `image_url`, `parent_place_id`, `is_published` (por defecto verdadero) y `verified` (por defecto falso). |
| RF-30.8 | El `id` de un lugar nuevo lo asigna el sistema como un número incremental (`"1"`, `"2"`, …), que nunca se repite ni se reutiliza, aunque dos administradores creen lugares a la vez. No se genera a partir del nombre. El cuerpo no acepta `id`: si lo trae, debe responder 422. Los lugares cargados por HU-22 conservan sus ids actuales. |
| RF-30.9 | Cuando se envía `PUT /api/admin/places/{id}` con datos válidos, el sistema debe reemplazar todos los campos editables del lugar con los enviados (lo que no se envía queda vacío o con su valor por defecto) y responder 200 con el lugar actualizado. El `id` no se puede cambiar ni enviar en el cuerpo (RF-30.8). Si el lugar no existe, 404. |
| RF-30.10 | Cuando se crea o edita un lugar, el sistema debe fijar `updated_by` con el usuario del token y `updated_at` con la hora actual; al crear, también `created_at`. Estos campos no se aceptan en el cuerpo. |
| RF-30.11 | El campo `verified` debe controlar `verified_at`: con `true`, si el lugar no estaba verificado se fija la hora actual y si ya lo estaba se conserva la fecha anterior; con `false`, se borra. |
| RF-30.12 | Cuando un lugar se edita sin cambiar nada, el sistema debe responder 200 igualmente y actualizar `updated_at` y `updated_by`. |

### Lugares: validación
| ID | Requisito |
|---|---|
| RF-30.13 | Cuando los datos no son válidos, el sistema debe responder 422 con la lista de errores, cada uno con el nombre del campo, y no debe guardar nada. Se validan al menos: `name` no vacío y de hasta 200 caracteres; `lat` y `lng` numéricos y dentro del área del mapa del campus (ver preguntas abiertas); `category_id` existente; `parent_place_id` existente, distinto del propio lugar y sin formar un ciclo; `email` con formato de correo; `website` e `image_url` con dirección `http` o `https`; textos largos con un máximo razonable (`description` hasta 5000 caracteres, el resto hasta 300). |
| RF-30.14 | Los textos deben guardarse sin espacios sobrantes en los extremos, y un texto vacío o solo de espacios debe guardarse como sin dato. Las listas (`keywords`, `detailed_schedule`, `careers`, `services`) deben quitar elementos vacíos y repetidos (sin distinguir mayúsculas en `keywords`), con un máximo de 50 elementos de hasta 200 caracteres. |
| RF-30.15 | Los campos desconocidos en el cuerpo deben rechazarse con 422, de modo que un error de escritura no se ignore en silencio. |

### Lugares: despublicar (no se borran)
| ID | Requisito |
|---|---|
| RF-30.16 | Despublicar es la forma de sacar un lugar de circulación. Cuando se edita un lugar con `is_published` falso, el sistema debe retirarlo de `GET /api/places`, de los filtros y de `GET /api/places/{id}` (404), y conservarlo en el listado de administración. Con `is_published` verdadero debe volver a aparecer. |
| RF-30.17 | La API no debe ofrecer borrar lugares: `DELETE /api/admin/places/{id}` debe responder 405, sin modificar nada. Un lugar despublicado conserva su `id`, que no se reutiliza. |

### Categorías
| ID | Requisito |
|---|---|
| RF-30.18 | `GET /api/admin/place-categories` debe devolver todas las categorías, ordenadas por `sort_order`, cada una con `id`, `label`, `color`, `sort_order` y la cantidad de lugares (`places_count`), publicados o no. |
| RF-30.19 | Cuando se envía `POST /api/admin/place-categories` con `id` (slug), `label` (hasta 100 caracteres), `color` (`#RRGGBB`) y, opcionalmente, `sort_order`, el sistema debe crearla y responder 201. Un `id` repetido da 409; datos inválidos, 422 con el campo. Si no se envía `sort_order`, queda al final. |
| RF-30.20 | Cuando se envía `PUT /api/admin/place-categories/{id}` con datos válidos, el sistema debe reemplazar `label`, `color` y `sort_order`, y responder 200. El `id` no se puede cambiar. Si no existe, 404. |
| RF-30.21 | Cuando se envía `DELETE /api/admin/place-categories/{id}` de una categoría sin ningún lugar (ni siquiera despublicados), el sistema debe borrarla y responder 204. Si tiene lugares, 409 indicando cuántos; si no existe, 404. |
| RF-30.22 | Los cambios de categorías deben verse en `GET /api/place-categories` (HU-27). |

### Asistente y caché
| ID | Requisito |
|---|---|
| RF-30.23 | Cuando se crea un lugar publicado, se edita o se despublica, el sistema debe guardar primero el cambio y después sincronizar el asistente: invalidar la caché de lugares del asistente y llamar a `reindex_place` (HU-29), que actualiza el lugar o lo quita del índice si ya no está publicado. |
| RF-30.24 | Si el cambio se guardó pero la sincronización con el asistente falla (por ejemplo, el servicio de embeddings no responde), el sistema debe mantener el cambio guardado, responder igualmente con éxito e indicar `rag_sync: "failed"` en la respuesta, y registrar el fallo. Si el asistente está en modo de prueba (sin servicio de embeddings real), debe indicar `rag_sync: "skipped"`; si todo salió bien, `"ok"`. |
| RF-30.25 | Cuando se envía `POST /api/admin/places/{id}/reindex`, el sistema debe repetir la sincronización de ese lugar con el asistente y responder 200 con `rag_sync`. Si el lugar no existe, 404. |
| RF-30.26 | Los cambios de categorías (RF-30.19 a RF-30.21) y los de lugares deben quedar visibles en la API pública sin esperar a que venza la caché del servidor: el servidor no cachea las respuestas, y las cabeceras de caché de HU-27 solo hacen que un navegador pueda tardar hasta 60 s en verlos. |

### Calidad
| ID | Requisito |
|---|---|
| RF-30.27 | Cada operación de escritura debe ser atómica: si falla la validación o la base, no queda nada a medias. |
| RF-30.28 | Si la base no responde, los endpoints deben responder 503 con un mensaje claro, no 500. |
| RF-30.29 | Los endpoints deben aparecer en `/docs` bajo «admin-places» y «admin-place-categories», con descripción de cada campo y de los códigos de respuesta, y deben permitir probarse con el botón «Authorize». `backend/README.md` debe documentarlos. |
| RF-30.30 | Las altas, cambios, despublicaciones y borrados de categorías deben registrarse en el log con el administrador y el identificador del lugar o categoría, sin volcar el contenido de los campos de texto. |

## 4. Escenarios de aceptación
**Escenario 1: sin sesión** (RF-30.1)
- **Cuando** llamo a `POST /api/admin/places`, `PUT /api/admin/places/{id}` y `GET /api/admin/places` sin token, con un token alterado y con uno vencido
- **Entonces** todas responden 401 con `WWW-Authenticate: Bearer` y la base no cambia.

**Escenario 2: crear un lugar** (RF-30.6 a RF-30.10, RF-30.23)
- **Dado** un administrador con sesión
- **Cuando** envío `POST /api/admin/places` con nombre «Laboratorio de Redes», categoría `facultades`, `lat` y `lng` dentro del campus
- **Entonces** recibo 201 con un `id` numérico asignado por el sistema, `updated_by` con mi usuario y `verified_at` vacío; el lugar aparece en `GET /api/places`, y el asistente lo conoce.

**Escenario 3: editar y verificar** (RF-30.9, RF-30.11, RF-30.12)
- **Cuando** edito su horario con `PUT` y `verified: true`, y luego vuelvo a enviar la misma edición
- **Entonces** `GET /api/places/{id}` muestra el horario nuevo y `verified_at` con la hora de la primera edición, que no cambia en la segunda; con `verified: false` se vacía.

**Escenario 4: despublicar y volver a publicar** (RF-30.16, RF-30.23)
- **Cuando** edito el lugar con `is_published: false`
- **Entonces** desaparece de `GET /api/places`, de los filtros, del detalle (404) y de las respuestas del asistente, pero sigue en `GET /api/admin/places?published=false`; al volver a publicarlo todo reaparece.

**Escenario 5: datos inválidos** (RF-30.13 a RF-30.15)
- **Cuando** envío un nombre vacío, `lat: 40`, una categoría inexistente, `email: "x"`, `website: "javascript:alert(1)"`, un `parent_place_id` que apunta al propio lugar y un campo `colour` desconocido
- **Entonces** recibo 422 con un error por campo y no se guarda nada.

**Escenario 6: ids incrementales** (RF-30.8)
- **Cuando** creo dos lugares con el mismo nombre y luego envío un tercero con `id: "fisi"` en el cuerpo
- **Entonces** los dos primeros salen con ids numéricos consecutivos, distintos entre sí, y el tercero responde 422; el nombre repetido no es un problema.

**Escenario 7: no se borran lugares** (RF-30.17)
- **Cuando** envío `DELETE /api/admin/places/{id}` de un lugar existente
- **Entonces** recibo 405 y el lugar sigue en el listado de administración; para sacarlo de circulación lo despublico (escenario 4).

**Escenario 8: categorías** (RF-30.18 a RF-30.22)
- **Cuando** creo la categoría `laboratorios`, la edito, intento borrarla teniendo un lugar (aunque esté despublicado) y luego la borro vacía
- **Entonces** aparece en `GET /api/place-categories`, el borrado con lugares da 409 y el borrado vacío da 204.

**Escenario 9: falla del asistente** (RF-30.24, RF-30.25)
- **Dado** que el servicio de embeddings falla
- **Cuando** guardo un lugar
- **Entonces** el lugar queda guardado, recibo 200 con `rag_sync: "failed"`, y al repetir con `POST /api/admin/places/{id}/reindex` con el servicio ya disponible recibo `"ok"`.

**Escenario 10: filtros del listado** (RF-30.3, RF-30.4)
- **Cuando** pido `GET /api/admin/places?verified=false&category=puertas&q=puerta 3`
- **Entonces** recibo solo las puertas sin verificar cuyo nombre o palabras clave coinciden, incluidas las no publicadas.

**Escenario 11: base apagada** (RF-30.28)
- **Cuando** la base no responde y llamo a cualquier endpoint con token válido
- **Entonces** recibo 503 con un mensaje claro.

## 5. Preguntas abiertas
Resueltas el 2026-11-12:
- **Área permitida para las coordenadas:** solo dentro del área que muestra el mapa (campus más margen). Las sedes San Fernando y San Borja se ampliarían más adelante.
- **Edición:** `PUT` de reemplazo completo.
- **`id` al crear:** lo asigna el sistema como número incremental; no se genera del nombre ni se acepta en el cuerpo (RF-30.8).
- **`is_published` por defecto:** verdadero.
- **Borrado de lugares:** no se ofrece; se despublica con `is_published`. Las categorías sí se pueden borrar, solo si están vacías, porque no tienen ese estado.

Pendiente, se decide al empezar a implementar:
- **Orden de trabajo:** esta historia usa `reindex_place` y la caché del asistente de HU-29, que aún no está hecha. Mientras no se haga HU-29 o se decida usar un enganche vacío, RF-30.23 a RF-30.25 y los escenarios 2, 4 y 9 no se pueden comprobar completos.

## 6. Historial
- 2026-11-12 · Borrador creado.
- 2026-11-12 · Aprobada. Cambios: el `id` es incremental y lo asigna el sistema (RF-30.8, escenario 6); no se borran lugares, solo se despublican (RF-30.17, escenario 7). El orden respecto a HU-29 queda pendiente de decidir.
- 2026-11-12 · Implementada. El asistente se conecta en `app/places/sync.py` (HU-29): hasta entonces `rag_sync` vale `skipped`. Migración `V4__place_id_sequence.sql`.
