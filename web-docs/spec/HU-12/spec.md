# HU-12 · Ficha de lugar

- **Estado:** Implementada (escenarios 1, 6, 7, 10 y 14 con el mapa real pendientes de verificar a mano: requieren token de Mapbox)
- **Historia:** ver `../../histories.md#hu-12`
- **Depende de:** HU-09 (mapa), HU-10 (lugares), HU-11 (selección de lugar y búsqueda)
- **Archivos hermanos:** [plan.md](plan.md) · [task.md](task.md)

## 1. Contexto y objetivo
El visitante ve puntos en el mapa pero no sabe qué hay en cada uno. Al tocar un lugar quiere ver su información (qué es, horario, teléfono, carreras…) antes de decidir si va.

La información existe para los lugares que el asistente ya conocía (en la app anterior). El resto (puertas, canchas y puntos sueltos) solo tiene nombre, categoría y ubicación.

## 2. Alcance
**Dentro:**
- Traer a la lista de lugares los datos de ficha que ya existen (horario, descripción, teléfono, anexo, carreras, servicios, uso y horario detallado).
- Tarjeta con la ficha del lugar elegido, flotando sobre el mapa.
- Abrir la ficha al tocar un punto del mapa y al elegir un resultado de la búsqueda.
- Cerrar la ficha con botón o con Esc.

**Fuera (y dónde se hace):**
- Botón «Cómo llegar», cálculo y dibujo de la ruta → HU-13 y HU-14.
- Abrir la ficha desde el chat (botón «Ver en el mapa») → HU-08.
- Mover los datos a una base de datos → HU-22.
- Verificar con la universidad que horarios y teléfonos estén al día → tarea del equipo, fuera del código.
- Diseño móvil de la ficha (panel inferior) → HU-21.

## 3. Requisitos

### Datos
| ID | Requisito |
|---|---|
| RF-12.1 | La lista de lugares debe incluir, cuando existan, estos datos de cada lugar: horario, descripción, teléfono, anexo, carreras, servicios, uso y horario detallado. |
| RF-12.2 | Los lugares sin esos datos tienen una ficha mínima: solo nombre y categoría, sin secciones vacías. |

### Abrir y cerrar
| ID | Requisito |
|---|---|
| RF-12.3 | Cuando el usuario toca un punto del mapa, el sistema debe elegir ese lugar y abrir su ficha, sin mover la cámara. |
| RF-12.4 | Cuando el usuario elige un resultado de la búsqueda, el sistema debe abrir la ficha de ese lugar (además de volar hasta él, como en HU-11). |
| RF-12.5 | Cuando el usuario toca otro punto con una ficha abierta, la ficha debe cambiar al nuevo lugar. |
| RF-12.6 | Cuando el usuario pulsa el botón «Cerrar» de la ficha o la tecla Esc, la ficha debe cerrarse y el lugar dejar de estar elegido. Si la lista de resultados de la búsqueda está abierta, Esc cierra solo esa lista. |
| RF-12.7 | Cuando el usuario toca una zona del mapa sin lugares con la ficha abierta, la ficha debe permanecer abierta. |
| RF-12.8 | Cuando el usuario activa un filtro de categoría que oculta el lugar elegido, la ficha debe cerrarse. *(Al elegir un lugar por búsqueda el filtro ya se quita, RF-11.15; esto cubre activar un filtro después.)* |
| RF-12.18 | Cuando la ficha se abre al tocar un punto, el campo de búsqueda debe mostrar el nombre del lugar; cuando la ficha se cierra, el campo debe vaciarse. |

### Contenido
| ID | Requisito |
|---|---|
| RF-12.9 | La ficha debe mostrar siempre el nombre y la categoría del lugar. |
| RF-12.10 | La ficha debe mostrar las demás secciones solo si el lugar tiene el dato: horario, descripción, teléfono, anexo, carreras, servicios y uso. |
| RF-12.11 | El horario detallado (por ejemplo el de la Biblioteca) debe mostrarse como lista de líneas. |
| RF-12.12 | Las listas de carreras y servicios deben mostrarse una por línea. |
| RF-12.13 | La ficha no debe tener, por ahora, un botón «Cómo llegar»; lo agrega HU-13. |

### Presentación y accesibilidad
| ID | Requisito |
|---|---|
| RF-12.14 | En escritorio la ficha debe mostrarse como una tarjeta flotante en la esquina inferior izquierda del mapa, de unos 24 rem de ancho, debajo del buscador y los filtros. |
| RF-12.15 | Si el contenido es más alto que el espacio disponible, la tarjeta debe poder desplazarse por dentro, sin tapar el buscador ni los filtros. |
| RF-12.16 | La tarjeta debe ser un diálogo no modal con el nombre del lugar como etiqueta; al abrirse, el foco pasa al botón «Cerrar»; al cerrarse, el foco vuelve al elemento que lo tenía antes. |
| RF-12.17 | La tarjeta no debe tapar los controles de zoom, el botón «Volver al campus» ni el logo y la atribución de Mapbox (se deja un margen inferior). |

## 4. Escenarios de aceptación
**Escenario 1: abrir tocando un punto** (RF-12.3, RF-12.9)
- **Dado** que estoy en `/mapa`
- **Cuando** toco el punto de «Facultad de Psicología»
- **Entonces** se abre su ficha con el nombre y la categoría «Facultades», y el mapa no se mueve.

**Escenario 2: contenido completo** (RF-12.10, RF-12.12)
- **Cuando** abro la ficha de la Facultad de Ingeniería de Sistemas e Informática
- **Entonces** veo horario, descripción, teléfono y la lista de carreras.

**Escenario 3: sin secciones vacías** (RF-12.2, RF-12.10)
- **Cuando** abro la ficha de un lugar sin teléfono ni anexo
- **Entonces** no aparece ninguna sección de teléfono vacía.

**Escenario 4: ficha mínima** (RF-12.2)
- **Cuando** toco «Puerta 3»
- **Entonces** la ficha muestra solo «Puerta 3» y la categoría «Puertas».

**Escenario 5: horario detallado** (RF-12.11)
- **Cuando** abro la ficha de la Biblioteca Central
- **Entonces** veo su horario detallado en varias líneas.

**Escenario 6: abrir desde la búsqueda** (RF-12.4)
- **Cuando** busco «biblioteca» y elijo el resultado
- **Entonces** el mapa vuela al lugar y se abre su ficha.

**Escenario 7: cambiar de lugar** (RF-12.5)
- **Dado** que la ficha de una facultad está abierta
- **Cuando** toco una cafetería
- **Entonces** la ficha pasa a mostrar la cafetería.

**Escenario 8: cerrar** (RF-12.6, RF-12.18)
- **Cuando** pulso «Cerrar» o la tecla Esc
- **Entonces** la ficha desaparece y el campo de búsqueda queda vacío.

**Escenario 9: Esc con la lista abierta** (RF-12.6)
- **Dado** que hay una ficha abierta y escribí algo en el buscador con resultados visibles
- **Cuando** pulso Esc
- **Entonces** se cierra la lista de resultados y la ficha sigue abierta.

**Escenario 10: tocar el vacío** (RF-12.7)
- **Dado** que hay una ficha abierta
- **Cuando** toco una zona del mapa sin puntos
- **Entonces** la ficha sigue abierta.

**Escenario 11: filtro que oculta el lugar** (RF-12.8)
- **Dado** que la ficha de una facultad está abierta
- **Cuando** activo el filtro «Puertas»
- **Entonces** la ficha se cierra.

**Escenario 12: campo de búsqueda sincronizado** (RF-12.18)
- **Cuando** toco el punto «Puerta 3»
- **Entonces** el buscador muestra «Puerta 3».

**Escenario 13: teclado** (RF-12.16)
- **Cuando** se abre la ficha
- **Entonces** el foco está en «Cerrar», y al cerrar vuelve al elemento anterior.

**Escenario 14: no tapa nada** (RF-12.15, RF-12.17)
- **Cuando** abro la ficha más larga (por ejemplo la de una facultad con muchas carreras) en una ventana de 1440×800
- **Entonces** la tarjeta hace scroll por dentro y se ven el buscador, los filtros, el botón de zoom y el logo de Mapbox.

## 5. Preguntas abiertas
- Ninguna. Decisiones: mostrar **todos los datos disponibles** (P1), **ficha mínima** para lugares sin datos (P2), **sin botón «Cómo llegar»** hasta HU-13 (P3) y **tarjeta flotante abajo a la izquierda** (P4).

## 6. Historial
- 2026-10-23 · Borrador creado con preguntas abiertas.
- 2026-10-23 · Preguntas resueltas. Se añadieron RF-12.3 «sin mover la cámara», RF-12.17 (logo y atribución de Mapbox, requisito de su licencia) y RF-12.18 (campo de búsqueda sincronizado). Spec aprobada.
- 2026-10-23 · Implementada.
