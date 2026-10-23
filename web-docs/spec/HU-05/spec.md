# HU-05 · Preguntar al asistente

- **Estado:** Implementada (escenarios 6, 7, 12, 13, 14, 15 y 16 pendientes de verificar a mano en el navegador)
- **Historia:** ver `../../histories.md#hu-05`
- **Depende de:** HU-03 (layout y componentes base), HU-04 (cliente del backend y modo mock), HU-09 a HU-12 (mapa, lugares, búsqueda y ficha)
- **Archivos hermanos:** [plan.md](plan.md) · [task.md](task.md)

> `spec.md` dice **qué** debe hacer la historia y **cómo se comprueba**. El cómo técnico va en `plan.md` y el trabajo pendiente en `task.md`.

## 1. Contexto y objetivo
El visitante tiene dudas sobre el campus («¿dónde queda la Cepre?», «¿dónde puedo leer libros gratis?») y quiere preguntarlas con sus palabras. El asistente responde en texto y, cuando la respuesta nombra lugares del campus, deja una tarjeta por lugar con un botón que lleva al mapa: la cámara **vuela** hasta la zona, igual que al elegir un resultado del buscador (HU-11), y se abre la ficha del lugar (HU-12).

El diseño parte de la pantalla móvil de la app anterior y se **adapta a escritorio** (≥ 1024 px): una columna de conversación centrada junto a la barra lateral, con la caja de texto fija abajo.

## 2. Alcance
**Dentro:**
- Pantalla del asistente en `/asistente`: lista de mensajes y caja de texto.
- Enviar una pregunta (Enter envía, Shift+Enter salta de línea) y mostrar la respuesta.
- Mensajes del usuario (burbuja) y del asistente (texto sobre el fondo, sin burbuja).
- Estados: «escribiendo…» y error con «Reintentar».
- Tarjetas de lugar bajo la respuesta, con botón para ir al mapa con vuelo y ficha abierta.
- La conversación se conserva mientras la pestaña esté abierta, aunque el usuario cambie entre Mapa y Asistente.

**Fuera (y dónde se hace):**
- Cliente HTTP, configuración y modo mock → HU-04 (esta historia los usa).
- Preguntas sugeridas en el chat vacío → HU-06. Aquí el chat vacío solo muestra un texto de bienvenida.
- Guardar conversaciones al recargar, lista de historial y «Nueva conversación» → HU-07.
- Trazar la ruta hacia el lugar cuando la respuesta la pide (`draw_route` / `destination`) → HU-13 y HU-14. Por ahora la tarjeta solo lleva al lugar; el texto de la respuesta puede decir «trazo la ruta» pero la web no la dibuja todavía.
- Respuestas en streaming (palabra por palabra): el backend responde completo.
- Aviso de «servidor despertando»: el backend no corre en Render (no hay arranque en frío), así que no hace falta.
- Diseño móvil → HU-21.

> **Cambio de alcance:** HU-08 «Lugares en las respuestas» (tarjeta con botón «Ver en el mapa») queda **absorbida** por esta historia: HU-08 pasa a ✅ junto con HU-05.

## 3. Requisitos

### Enviar y recibir
| ID | Requisito |
|---|---|
| RF-05.1 | Cuando el usuario escribe una pregunta y pulsa Enter o el botón de enviar, el sistema debe mostrarla como mensaje suyo, vaciar la caja de texto y pedir la respuesta al asistente. |
| RF-05.2 | Cuando el usuario pulsa Shift+Enter, la caja de texto debe insertar un salto de línea sin enviar. |
| RF-05.3 | Cuando el texto está vacío o solo tiene espacios, el botón de enviar debe estar deshabilitado y Enter no debe enviar nada. |
| RF-05.4 | Mientras hay una consulta en curso, el sistema no debe permitir enviar otra: el botón de enviar debe estar deshabilitado y Enter no debe enviar. El usuario sí puede seguir escribiendo en la caja. |
| RF-05.5 | Cuando llega la respuesta, el sistema debe mostrarla como mensaje del asistente debajo de la pregunta. |
| RF-05.6 | La pregunta enviada debe recortarse de espacios al inicio y al final, y no debe pasar de 1000 caracteres (límite del backend). La caja de texto no debe aceptar más de 1000. |
| RF-05.7 | Cuando el texto de la respuesta tiene saltos de línea, el sistema debe respetarlos al mostrarlo. |

### Estados
*(RF-05.9 se retiró: no hay aviso de servidor despertando. La numeración no se reordena para no romper referencias.)*

| ID | Requisito |
|---|---|
| RF-05.8 | Mientras espera la respuesta, el sistema debe mostrar un indicador «escribiendo…» en el lugar donde aparecerá la respuesta. |
| RF-05.10 | Cuando la consulta falla (red, tiempo agotado o error del servidor), el sistema debe mostrar un mensaje de error legible en el lugar de la respuesta, con un botón «Reintentar», y volver a permitir el envío. |
| RF-05.11 | Cuando el usuario pulsa «Reintentar», el sistema debe repetir la misma pregunta sin volver a escribirla y sin duplicar el mensaje del usuario. |
| RF-05.12 | Cuando el chat no tiene mensajes, el sistema debe mostrar un texto de bienvenida que diga que se puede preguntar cualquier cosa sobre el campus. |

### Desplazamiento y teclado
| ID | Requisito |
|---|---|
| RF-05.13 | Cuando se añade un mensaje, aparece el indicador o llega la respuesta, la lista debe desplazarse hasta el final. |
| RF-05.14 | Cuando el usuario ha subido para releer mensajes anteriores y llega una respuesta, la lista no debe saltar al final; debe aparecer un botón «Ir al último mensaje». *(Solo si el usuario estaba a más de 120 px del final.)* |
| RF-05.15 | Al entrar a `/asistente` y después de cada respuesta o error, el foco debe estar en la caja de texto. |

### Tarjetas de lugar
| ID | Requisito |
|---|---|
| RF-05.16 | Cuando la respuesta trae lugares, el sistema debe mostrar bajo el texto una tarjeta por lugar, en el orden recibido, con su nombre y, si lo tiene, su horario en una sola línea (cortada con «…» si no cabe). |
| RF-05.17 | Cuando la respuesta no trae lugares, el sistema no debe mostrar tarjetas. |
| RF-05.18 | Cuando un lugar de la respuesta no existe en el mapa (id desconocido), el sistema debe omitir esa tarjeta y mostrar las demás; el texto de la respuesta no cambia. |
| RF-05.19 | Cada tarjeta debe tener un botón «Ver en el mapa». Cuando el usuario lo pulsa, el sistema debe ir a `/mapa`, dejar ese lugar elegido (con la ficha abierta, como en HU-12) y mover la cámara hasta él con el mismo vuelo que usa la búsqueda del mapa (HU-11). |
| RF-05.20 | Cuando el usuario llega al mapa desde una tarjeta, el vuelo debe verse completo: el mapa debe mostrarse primero en la vista del campus y luego volar al lugar, aunque el mapa no se hubiera abierto antes en la sesión. |
| RF-05.21 | Cuando el usuario pulsa «Ver en el mapa» sobre un lugar que ya estaba elegido (por ejemplo, volvió al chat sin cerrar su ficha), el mapa debe volar a él de todos modos. |
| RF-05.22 | Cuando un filtro de categoría ocultaría el lugar elegido desde la tarjeta, el sistema debe quitar el filtro, como en RF-11.15. |
| RF-05.23 | Cuando el usuario vuelve al asistente desde el mapa, la conversación debe seguir como estaba, con sus tarjetas. |

### Presentación y accesibilidad (escritorio)
| ID | Requisito |
|---|---|
| RF-05.24 | La conversación debe ocupar una columna centrada de hasta 48 rem de ancho dentro del área de contenido, sin scroll de página: solo la lista de mensajes se desplaza, y su barra de desplazamiento debe quedar en el borde derecho del área de contenido, no junto a la columna. |
| RF-05.25 | La caja de texto debe quedar fija en la parte inferior de la columna, con el texto de ayuda «Puedes preguntarle cualquier información sobre el campus.» y el botón de enviar a su derecha. Debe crecer con el texto hasta 6 líneas y luego desplazarse por dentro. |
| RF-05.26 | Los mensajes del usuario deben mostrarse a la derecha en una burbuja de color de marca, de hasta el 75 % de la columna. Los del asistente, a la izquierda y sin burbuja, a todo el ancho de la columna. |
| RF-05.27 | La lista de mensajes debe ser una región con `aria-live="polite"` para que los lectores de pantalla anuncien las respuestas; el botón de enviar debe tener nombre accesible «Enviar» y cada botón de tarjeta debe incluir el nombre del lugar («Ver en el mapa: Biblioteca Central Pedro Zulen»). |
| RF-05.28 | Los colores deben respetar el tema claro y oscuro de las variables de HU-03, con contraste suficiente para texto normal. |

## 4. Escenarios de aceptación
**Escenario 1: preguntar y recibir respuesta** (RF-05.1, RF-05.5, RF-05.8)
- **Dado** que estoy en `/asistente` con el chat vacío
- **Cuando** escribo «Quiero ir a la cepre» y pulso Enter
- **Entonces** mi mensaje aparece a la derecha, la caja se vacía, veo «escribiendo…» y después la respuesta del asistente.

**Escenario 2: salto de línea** (RF-05.2)
- **Cuando** escribo «hola», pulso Shift+Enter y escribo «mundo»
- **Entonces** la caja tiene dos líneas y no se envió nada.

**Escenario 3: no enviar vacío** (RF-05.3)
- **Cuando** la caja está vacía o solo tiene espacios
- **Entonces** el botón de enviar está deshabilitado y Enter no hace nada.

**Escenario 4: una consulta a la vez** (RF-05.4)
- **Dado** que envié una pregunta y aún no hay respuesta
- **Cuando** escribo otra y pulso Enter
- **Entonces** no se envía; sigo pudiendo escribir y al llegar la respuesta puedo enviarla.

**Escenario 6: error y reintentar** (RF-05.10, RF-05.11)
- **Dado** que el backend está apagado
- **Cuando** envío una pregunta
- **Entonces** veo un mensaje de error con «Reintentar»; al levantar el backend y pulsar «Reintentar» llega la respuesta y mi pregunta aparece una sola vez.

**Escenario 7: tarjeta y vuelo al mapa** (RF-05.16, RF-05.19, RF-05.20)
- **Cuando** pregunto «En dónde puedo leer libros de manera gratuita» y la respuesta trae la Biblioteca Central Pedro Zulen
- **Entonces** veo una tarjeta con su nombre y horario; al pulsar «Ver en el mapa» paso a `/mapa`, veo el campus completo, la cámara vuela hasta la biblioteca y se abre su ficha.

**Escenario 8: varias tarjetas** (RF-05.16)
- **Cuando** la respuesta trae dos lugares
- **Entonces** veo dos tarjetas en el mismo orden que el backend, cada una con su botón.

**Escenario 9: respuesta sin lugares** (RF-05.17)
- **Cuando** pregunto algo general y la respuesta no trae lugares
- **Entonces** solo veo el texto.

**Escenario 10: lugar desconocido** (RF-05.18)
- **Dado** que el backend devuelve un lugar cuyo id no está en el mapa y otro que sí
- **Entonces** solo se muestra la tarjeta del lugar conocido.

**Escenario 11: volver al asistente** (RF-05.23)
- **Cuando** vuelvo a `/asistente` desde el mapa con la barra lateral
- **Entonces** la conversación y las tarjetas siguen ahí.

**Escenario 12: repetir el vuelo** (RF-05.21)
- **Dado** que ya fui a la biblioteca desde el chat y moví el mapa con el ratón
- **Cuando** vuelvo al chat y pulso otra vez «Ver en el mapa» de la misma tarjeta
- **Entonces** el mapa vuela de nuevo a la biblioteca.

**Escenario 13: filtro activo** (RF-05.22)
- **Dado** que en el mapa tenía activo el filtro «Puertas»
- **Cuando** abro desde el chat la biblioteca
- **Entonces** el filtro se quita y la biblioteca se ve.

**Escenario 14: leer arriba** (RF-05.13, RF-05.14)
- **Dado** que la conversación es larga y subí a leer mensajes viejos
- **Cuando** llega una respuesta
- **Entonces** la lista no se mueve y aparece «Ir al último mensaje»; al pulsarlo bajo al final.

**Escenario 15: pantalla de 1440×800** (RF-05.24, RF-05.25, RF-05.26)
- **Cuando** abro el asistente con una conversación larga
- **Entonces** la página no tiene scroll, solo la lista; la caja de texto sigue visible abajo y los mensajes del usuario quedan a la derecha.

**Escenario 16: lector de pantalla y teclado** (RF-05.15, RF-05.27)
- **Cuando** entro a `/asistente`
- **Entonces** el foco está en la caja de texto; las respuestas se anuncian y cada botón «Ver en el mapa» dice a qué lugar lleva.

## 5. Preguntas abiertas
- Ninguna. Decisiones: botón **«Ver en el mapa»** (P1), **HU-08 absorbida** (P2), **sin botón de ruta** hasta HU-13/14 (P3), **sin límite de mensajes** (P4) y **sin aviso de servidor despertando** porque el backend no está en Render (P5).

## 6. Historial
- 2026-10-23 · Borrador creado con preguntas abiertas.
- 2026-10-23 · Preguntas resueltas. Se retiró RF-05.9 y el escenario 5 (aviso de servidor despertando). Spec aprobada.
- 2026-10-23 · Implementada.
- 2026-10-23 · RF-05.24: la barra de scroll va en el borde derecho, no pegada a la columna.
