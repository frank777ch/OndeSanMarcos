# HU-11 · Buscar un lugar

- **Estado:** Implementada (escenarios 1–12 con el mapa real pendientes de verificar a mano: requieren token de Mapbox)
- **Historia:** ver `../../histories.md#hu-11`
- **Depende de:** HU-09 (mapa), HU-10 (lugares y filtros)
- **Archivos hermanos:** [plan.md](plan.md) · [task.md](task.md)

## 1. Contexto y objetivo
El visitante sabe qué lugar busca («Facultad de Psicología», «biblioteca», «FISI», «puerta 3») pero no dónde está en el mapa. Quiere escribir una parte del nombre y que el mapa lo lleve hasta ahí, sin recorrer todos los puntos ni depender del backend.

Hoy el mapa solo tiene 40 puntos y no incluye lugares que el asistente sí conoce (Biblioteca Central, Rectorado, OCA, Comedor, Estadio…). Para que la búsqueda los encuentre, esta historia **unifica** ambas listas en una sola.

## 2. Alcance
**Dentro:**
- Una sola lista de lugares: los 40 puntos actuales más los lugares del asistente que no tienen equivalente.
- Categorías nuevas para esos lugares, con sus chips de filtro.
- Barra de búsqueda sobre el mapa con lista de resultados mientras se escribe.
- Coincidencia sin distinguir tildes ni mayúsculas, por partes del nombre y por palabras clave.
- Al elegir un resultado, el mapa vuela al lugar.
- Uso con teclado.

**Fuera (y dónde se hace):**
- Ficha con la información del lugar (descripción, horario, teléfono) → HU-12.
- Calcular la ruta hacia el lugar → HU-13.
- Búsqueda en el backend o por significado (eso lo hace el chat) → no se hace.
- Diseño móvil → HU-21.

**Cambia requisitos de otra spec:** RF-10.1 (de 40 a 55 lugares), RF-10.2 (de 5 a 9 categorías) y RF-10.5 (9 chips). Se actualiza `HU-10/spec.md` en el mismo commit.

## 3. Requisitos

### Datos
| ID | Requisito |
|---|---|
| RF-11.1 | Debe existir una única lista de 55 lugares con `id` único, sin lugares repetidos entre los 40 puntos del mapa y los 37 del asistente. |
| RF-11.2 | Los 15 lugares del asistente que no tienen equivalente entre los 40 puntos deben añadirse a la lista: Rectorado, OCA, Escuela de Posgrado, CEPREUNMSM, Clínica Universitaria, Clínica de Odontología, Comedor Universitario, Biblioteca Central, Residencia Universitaria, Huaca San Marcos, Estadio, Gimnasio, Facultad de Derecho y Ciencia Política, Cafetería de la Clínica Universitaria y Cafetería de Ingeniería Industrial. |
| RF-11.3 | Los 22 lugares del asistente que sí tienen equivalente entre los 40 puntos no deben duplicarse: aportan sus palabras clave (por ejemplo «FISI», «FIC») y su nombre corregido al punto existente, que conserva su ubicación. |
| RF-11.4 | Se añaden 4 categorías: Administración, Salud, Servicios y Otros. Hay 9 en total y cada lugar pertenece a una. Las cafeterías, el estadio, el gimnasio y la Facultad de Derecho entran en las categorías que ya existen (Cafeterías, Campos deportivos y Facultades). |
| RF-11.5 | Cada categoría debe tener su chip de filtro, a continuación de los 5 actuales y en este orden: Administración, Salud, Servicios, Otros. |

### Búsqueda
| ID | Requisito |
|---|---|
| RF-11.6 | El sistema debe mostrar sobre el mapa una barra de búsqueda con un campo de texto etiquetado «Buscar un lugar». |
| RF-11.7 | Cuando el usuario escribe, el sistema debe mostrar debajo de la barra los lugares cuyo nombre o palabras clave contienen el texto, sin distinguir mayúsculas ni tildes («psicologia» encuentra «Facultad de Psicología», «oca» encuentra «Oficina Central de Admisión (OCA)»). |
| RF-11.8 | Cuando el texto tiene menos de 2 caracteres (sin contar espacios sobrantes), el sistema no debe mostrar resultados. |
| RF-11.9 | Cuando el texto no coincide con ningún lugar, el sistema debe mostrar el mensaje «No encontramos ese lugar». |
| RF-11.10 | La lista debe ordenar así: primero los lugares con una palabra clave exactamente igual al texto (una sigla como «fisi»), luego los cuyo nombre empieza con el texto, luego los que lo contienen en el nombre y al final los que solo contienen el texto en una palabra clave. Debe mostrar como máximo 8. |
| RF-11.11 | Cada resultado debe mostrar el nombre del lugar y su categoría. |
| RF-11.12 | La búsqueda debe resolverse sin llamar al backend. |

### Elegir un resultado
| ID | Requisito |
|---|---|
| RF-11.13 | Cuando el usuario elige un resultado (clic o Enter), el mapa debe volar hasta ese lugar, la lista debe cerrarse y el campo debe mostrar el nombre elegido. |
| RF-11.14 | **Retirado (2026-10-23).** Antes exigía resaltar el lugar elegido con un anillo; se quitó por decisión del equipo. El lugar elegido no lleva ningún resaltado: solo se centra la cámara. |
| RF-11.15 | Cuando el lugar elegido está oculto por un filtro de categoría activo, el sistema debe quitar el filtro para que el lugar sea visible. Si el filtro coincide con la categoría del lugar, no cambia. |
| RF-11.16 | El usuario debe poder vaciar la búsqueda con el botón «Limpiar búsqueda»: borra el texto, cierra la lista y quita la selección. |

### Accesibilidad
| ID | Requisito |
|---|---|
| RF-11.17 | El campo debe funcionar como cuadro combinado accesible: con ↓ y ↑ se recorre la lista, con Enter se elige el resaltado, con Esc se cierra la lista; el resultado resaltado se anuncia con `aria-activedescendant`. |

## 4. Escenarios de aceptación
**Escenario 1: encontrar por parte del nombre** (RF-11.7, RF-11.11)
- **Dado** que estoy en `/mapa`
- **Cuando** escribo «psicolog»
- **Entonces** veo «Facultad de Psicología» con su categoría «Facultades».

**Escenario 2: tildes y mayúsculas** (RF-11.7)
- **Cuando** escribo «ECONOMICAS»
- **Entonces** aparecen las facultades de Ciencias Económicas.

**Escenario 3: palabra clave** (RF-11.3, RF-11.7)
- **Cuando** escribo «fisi»
- **Entonces** «Facultad de Ingeniería de Sistemas e Informática» aparece primera (aunque «Ciencias Físicas» también contenga «fisi») y en el mapa no hay un segundo punto repetido.

**Escenario 4: lugar que antes no estaba** (RF-11.2, RF-11.7)
- **Cuando** escribo «biblioteca»
- **Entonces** aparece «Biblioteca Central Pedro Zulen», categoría «Servicios».

**Escenario 5: sin resultados** (RF-11.9)
- **Cuando** escribo «xyz»
- **Entonces** veo «No encontramos ese lugar».

**Escenario 6: texto muy corto** (RF-11.8)
- **Cuando** escribo una sola letra
- **Entonces** no aparece ninguna lista.

**Escenario 7: elegir un lugar** (RF-11.13)
- **Dado** que escribí «puerta 3»
- **Cuando** pulso el resultado «Puerta 3»
- **Entonces** el mapa vuela a ese punto (sin anillo ni otro resaltado), la lista se cierra y el campo dice «Puerta 3».

**Escenario 8: teclado** (RF-11.17)
- **Cuando** escribo «facultad», bajo con ↓ dos veces y pulso Enter
- **Entonces** se elige el segundo resultado de la lista.

**Escenario 9: limpiar** (RF-11.16)
- **Dado** que elegí un lugar
- **Cuando** pulso «Limpiar búsqueda»
- **Entonces** el campo queda vacío y la lista desaparece.

**Escenario 10: filtro activo que oculta el lugar** (RF-11.15)
- **Dado** que el filtro «Cafeterías» está activo
- **Cuando** busco y elijo «Puerta 3»
- **Entonces** el filtro se quita, se ven todos los lugares y el mapa vuela a «Puerta 3».

**Escenario 11: filtro que ya incluye el lugar** (RF-11.15)
- **Dado** que el filtro «Puertas» está activo
- **Cuando** elijo «Puerta 3»
- **Entonces** el filtro «Puertas» se mantiene.

**Escenario 12: categorías nuevas** (RF-11.4, RF-11.5)
- **Cuando** abro `/mapa`
- **Entonces** veo 9 filtros y «Salud» muestra solo las 2 clínicas.

## 5. Preguntas abiertas
- Ninguna. Decisiones tomadas: **unificar** las listas (P1), **volar** al elegir (P2, el resaltado se retiró después) y **quitar el filtro** si oculta el lugar (P3).

## 6. Historial
- 2026-10-23 · Borrador creado con preguntas abiertas.
- 2026-10-23 · Preguntas resueltas (unificar datos, volar y resaltar, quitar filtro). Spec aprobada.
- 2026-10-23 · RF-11.10 y escenario 3: una palabra clave exacta (sigla) va antes que las coincidencias en el nombre. Hallado al probar: «fisi» también está dentro de «Físicas».
- 2026-10-23 · Implementada.
- 2026-10-23 · Se retira el anillo de resaltado (RF-11.14): al elegir un lugar solo vuela la cámara. Se actualizan RF-11.16 y los escenarios 7, 9 y 10.
- 2026-10-23 · El campo de búsqueda ya no muestra contorno de foco del navegador (decisión de diseño; ver plan).
- 2026-10-23 · HU-12 añade la ficha: elegir un resultado también abre la ficha del lugar y el campo se sincroniza con la selección (ver `../HU-12/spec.md`, RF-12.4 y RF-12.18). Esc con la lista abierta cierra solo la lista.
