# HU-29 · El asistente usa los lugares de la base

- **Estado:** Aprobada
- **Historia:** ver `../../histories.md#hu-29--el-asistente-usa-los-lugares-de-la-base-`
- **Depende de:** HU-22 (lugares en la base). Cierra los puntos del asistente de HU-30 (RF-30.23 a RF-30.25).
- **Archivos hermanos:** [plan.md](plan.md) · [task.md](task.md)

> `spec.md` dice **qué** debe hacer la historia y **cómo se comprueba**. El cómo técnico va en `plan.md` y el trabajo pendiente en `task.md`.

## 1. Contexto y objetivo
La información de los lugares está repartida en cinco sitios que no coinciden: la semilla `places.json` (la base y la web), la lista fija `CAMPUS_PLACES` del motor, los documentos de lugar de `corpus.py`, las entradas subidas con `upload_entries` y el texto original `unmsm_info.md`. Veintiuno de los 37 lugares del motor usan slugs que no existen en la base, así que el chat no muestra «Ver en mapa» para ellos. Además, crear o editar un lugar desde el panel no actualiza al asistente: la sincronización devuelve siempre `skipped`.

Esta historia hace que la tabla `places` sea la única fuente de los lugares. Los datos iniciales se unifican en `places.json`; el asistente arma la ficha de cada lugar desde la base y el panel la mantiene al día al crear, editar o despublicar. Desde ahí la base de producción es la fuente de verdad y los respaldos se hacen con `db-dump`.

## 2. Alcance
**Dentro:**
- Unificar en `places.json` la información de lugares que hoy está en `corpus.py`, `CAMPUS_PLACES` y las entradas de `gaps_review.json`, con los slugs de la base.
- Ficha del asistente por lugar, generada desde la tabla `places`.
- Sincronización real de un lugar con el asistente (crear, editar, despublicar y reindexar).
- Detección de lugares y tarjetas «Ver en mapa» leyendo la tabla, con coincidencia por límite de palabra.
- Ingesta completa con los lugares de la base y snapshot seguro para producción.

**Fuera (y dónde se hace):**
- Endpoints de edición de lugares y su pantalla (HU-30, HU-31, ya hechos o en curso).
- Eventos en el asistente (HU-34); seguirán el mismo patrón.
- La app móvil `frontend/`, que se mantiene con sus datos locales por ahora.

## 3. Requisitos
Formato: «Cuando <situación>, el sistema debe <comportamiento>».

### Datos de los lugares
| ID | Requisito |
|---|---|
| RF-29.1 | Cuando se carga la semilla, el sistema debe crear cada lugar con toda su información (nombre, descripción, horario, palabras clave, datos de contacto) tomada de `places.json`; `corpus.py` no debe contener documentos ligados a un lugar. |
| RF-29.2 | Cuando una descripción, un horario o una palabra clave existía solo en `corpus.py`, `CAMPUS_PLACES` o `gaps_review.json`, el sistema debe conservarla en `places.json` bajo el slug que el lugar tiene en la base. Si el lugar ya tenía descripción, se conserva y se le añade al final el texto del corpus que no esté ya incluido; horarios y palabras clave solo se copian si el campo está vacío. |
| RF-29.3 | Cuando un documento o una entrada del corpus nombra un lugar, el slug debe existir en `places.json`. |

### Ficha del asistente
| ID | Requisito |
|---|---|
| RF-29.4 | Cuando se arma la ficha de un lugar, el sistema debe incluir nombre, sigla, categoría, lugar contenedor, descripción, horarios, cómo llegar, carreras, servicios, uso y contacto, y omitir los campos vacíos. |
| RF-29.5 | Cuando se crea o edita un lugar publicado, el sistema debe reemplazar su ficha en el asistente con los embeddings de esa ficha, sin reingerir el resto, y responder `rag_sync: "ok"`. |
| RF-29.6 | Cuando un lugar se despublica, el sistema debe borrar su ficha del asistente y responder `rag_sync: "ok"`. |
| RF-29.7 | Cuando el servicio de embeddings falla al sincronizar un lugar, el sistema debe mantener intacta la ficha anterior y responder `rag_sync: "failed"`. |
| RF-29.8 | Cuando el asistente está en modo de prueba o no hay base configurada, el sistema debe responder `rag_sync: "skipped"` y no llamar al servicio de embeddings. |
| RF-29.9 | Cuando se pide `POST /api/admin/places/{id}/reindex`, el sistema debe repetir la sincronización de ese lugar y devolver su resultado (RF-30.25). |
| RF-29.10 | Cuando se ejecuta la ingesta completa, el sistema debe construir las fichas con los lugares publicados de la base y no con los documentos de lugar del corpus. |

### Detección de lugares
| ID | Requisito |
|---|---|
| RF-29.11 | Cuando la consulta nombra un lugar publicado por su nombre, sigla o palabra clave, el sistema debe devolverlo en `locations` con su slug, para que la web muestre «Ver en mapa». |
| RF-29.12 | Cuando una palabra clave aparece dentro de otra palabra (por ejemplo «pre» en «presupuesto»), el sistema no debe contarla como coincidencia: se exige límite de palabra. |
| RF-29.13 | Cuando un lugar se despublica, el sistema no debe nombrarlo en `locations` ni devolver fragmentos suyos en la respuesta. |
| RF-29.14 | Cuando una consulta nombra un lugar publicado que no usa vocabulario del campus, el sistema no debe rechazarla por estar fuera de alcance. |
| RF-29.15 | Cuando se crea, edita o despublica un lugar, el asistente debe verlo sin reiniciar el servidor: la caché de lugares se invalida al sincronizar y, como respaldo, caduca a los 60 s. |

### Datos y operación
| ID | Requisito |
|---|---|
| RF-29.16 | Cada fragmento de `documents` debe identificar su origen con `source_type` y `source_id`; no puede haber dos fragmentos con el mismo origen y posición. |
| RF-29.17 | Cuando se aplica el snapshot de `documents` en una base que ya tiene datos, el sistema no debe borrar ni reemplazar ninguna fila; solo lo llena si la tabla está vacía. |
| RF-29.18 | Cuando se ejecuta `./scripts/dev.sh reindex-places`, el sistema debe sincronizar todos los lugares con el asistente e informar cuántos salieron `ok` y cuántos `failed`. |

## 4. Escenarios de aceptación
**Escenario 1: lugar nuevo** (cubre RF-29.4, RF-29.5, RF-29.11, RF-29.15)
- **Dado** que hay un administrador autenticado y el asistente usa el servicio real.
- **Cuando** crea un lugar «Laboratorio de Cómputo» con descripción y horario.
- **Entonces** recibe `rag_sync: "ok"`, el chat lo nombra al preguntar por él y devuelve su tarjeta «Ver en mapa».

**Escenario 2: editar** (cubre RF-29.5)
- **Dado** el lugar anterior.
- **Cuando** cambia su horario.
- **Entonces** la respuesta del chat usa el horario nuevo sin haber reingerido el resto del corpus.

**Escenario 3: despublicar y volver a publicar** (cubre RF-29.6, RF-29.13)
- **Cuando** se despublica un lugar.
- **Entonces** el chat deja de nombrarlo y de devolver su información, aunque exista un documento general que lo mencione; al volver a publicarlo, reaparece.

**Escenario 4: falla del servicio de embeddings** (cubre RF-29.7, RF-29.9)
- **Dado** una clave inválida.
- **Cuando** se edita un lugar.
- **Entonces** el cambio se guarda, `rag_sync` es `"failed"` y la ficha anterior sigue respondiendo; al repetir con `POST …/reindex` y la clave buena, el resultado es `"ok"`.

**Escenario 5: «Ver en mapa» en los lugares que estaban rotos** (cubre RF-29.1 a RF-29.3, RF-29.11)
- **Cuando** se pregunta por la Facultad de Ingeniería Civil, la de Psicología o una cafetería de facultad.
- **Entonces** la respuesta incluye su tarjeta «Ver en mapa».

**Escenario 6: falso positivo de palabra clave** (cubre RF-29.12)
- **Cuando** la consulta contiene «presupuesto» y un lugar tiene la palabra clave «pre».
- **Entonces** ese lugar no aparece en `locations`.

**Escenario 7: base nueva** (cubre RF-29.16, RF-29.17)
- **Cuando** se levanta una base vacía con las migraciones, `documents` queda llena sin llamar al servicio de embeddings.
- **Y cuando** se vuelve a ejecutar la migración con datos, ninguna fila cambia.

**Escenario 8: modo de prueba** (cubre RF-29.8)
- **Dado** `RAG_USE_MOCK=true`.
- **Cuando** se crea un lugar.
- **Entonces** `rag_sync` es `"skipped"` y no hay llamadas de embeddings.

## 5. Decisiones
- **Ciencias Económicas.** «(Antiguo)» y «(Nuevo)» son dos facultades independientes y ninguna se fusiona con la otra. El documento del corpus dice «está en un pabellón nuevo», así que su texto se combina con la descripción del «Nuevo»; el «Antiguo» conserva sus datos.
- **Descripciones que ya tienen texto.** Se combinan siempre: se conserva la de la semilla y se añade al final el texto del corpus (o de la entrada) que no esté ya incluido.

## 6. Historial
- 2026-11-15 · Borrador creado.
- 2026-11-15 · Aprobada. Se resuelven las dos preguntas abiertas (Ciencias Económicas; combinar descripciones).
- 2026-11-15 · Implementación completa y probada con pruebas; quedan las comprobaciones manuales con clave real (ver `task.md`).
