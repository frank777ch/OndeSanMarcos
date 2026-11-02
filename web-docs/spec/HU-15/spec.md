# HU-15 · Mi ubicación

- **Estado:** Implementada (escenarios 1, 2, 4, 5, 10, 11, 12 y 13 con el mapa real pendientes de verificar a mano: requieren token de Mapbox y ubicación)
- **Historia:** ver `../../histories.md#hu-15`
- **Depende de:** HU-09 (mapa y botón de recentrado)
- **Archivos hermanos:** [plan.md](plan.md) · [task.md](task.md)

## 1. Contexto y objetivo
El botón de la esquina inferior derecha del mapa hoy solo devuelve la cámara al centro de la universidad. El visitante que está en el campus quiere que ese mismo botón lo lleve a donde está él para orientarse.

Para eso hace falta el permiso de ubicación del dispositivo. Se le pide con un aviso propio al entrar al mapa, explicando para qué se usa. El mapa nunca se mueve solo: la ubicación se usa únicamente cuando el visitante pulsa el botón.

## 2. Alcance
**Dentro:**
- Aviso de permiso de ubicación al entrar a la vista del mapa.
- Comportamiento del botón según el permiso: con permiso va a la ubicación del dispositivo; sin permiso va al centro de la universidad, como hoy.
- Punto azul con borde blanco y halo en la posición del usuario, también si está fuera del campus.
- Mensaje breve cuando no se puede obtener la ubicación.

**Fuera (y dónde se hace):**
- Seguir al usuario mientras camina (`watchPosition`), brújula y aviso de llegada → HU-16.
- Usar «mi ubicación» como origen de una ruta → HU-13.
- Mover la cámara al entrar a la web: la vista inicial no cambia.

## 3. Requisitos

### Aviso de permiso
| ID | Requisito |
|---|---|
| RF-15.1 | Cuando el usuario entra a la vista del mapa y el navegador aún no tiene una decisión sobre la ubicación, el sistema debe mostrar un aviso que explique que la ubicación se usa solo para mostrarle dónde está en el mapa, con las opciones «Permitir» y «Ahora no». |
| RF-15.2 | Cuando el usuario pulsa «Permitir», el sistema debe cerrar el aviso y pedir el permiso al navegador. |
| RF-15.3 | Cuando el usuario pulsa «Ahora no», el sistema debe cerrar el aviso sin pedir el permiso al navegador y no volver a mostrarlo mientras la pestaña siga abierta. Al abrir o recargar la web en una pestaña nueva, el aviso vuelve a aparecer. |
| RF-15.4 | Si el permiso ya está concedido o ya fue denegado en el navegador, el sistema no debe mostrar el aviso. |
| RF-15.5 | Si el navegador no ofrece geolocalización, el sistema no debe mostrar el aviso. |
| RF-15.6 | El aviso no debe bloquear el uso del mapa, la búsqueda ni el chat. |

### Botón de ubicación
| ID | Requisito |
|---|---|
| RF-15.7 | Cuando el usuario pulsa el botón y el permiso está concedido, el sistema debe obtener la ubicación del dispositivo y mover la cámara hasta ella, esté dentro o fuera del campus y sin mostrar avisos por estar fuera. |
| RF-15.8 | Cuando el usuario pulsa el botón y el permiso no está concedido (no respondido, rechazado en el aviso, denegado o no disponible), el sistema debe llevar la cámara al centro de la universidad, igual que hoy, sin volver a pedir el permiso. |
| RF-15.9 | Cuando el permiso está concedido pero no se puede obtener la ubicación (señal, tiempo agotado), el sistema debe llevar la cámara al centro de la universidad y mostrar un mensaje breve que lo explique. |
| RF-15.10 | El sistema no debe mover la cámara ni dibujar el punto por su cuenta: ni al entrar a la web, ni al aceptar el permiso. La vista inicial es siempre la actual. (El navegador solo muestra su petición al leer la ubicación; esa primera lectura se descarta.) |
| RF-15.11 | Mientras se obtiene la ubicación, el botón debe indicar que está trabajando y no aceptar pulsaciones repetidas. |

### Punto del usuario
| ID | Requisito |
|---|---|
| RF-15.14 | Cuando se obtiene la ubicación, el sistema debe dibujar en el mapa un punto azul con borde blanco y, alrededor, un halo azul translúcido. |
| RF-15.15 | El halo debe representar la precisión de la lectura (su radio en metros) y tener un tamaño mínimo visible. |
| RF-15.16 | El punto debe dibujarse en la posición real del dispositivo aunque esté fuera del campus, y la cámara debe poder llegar hasta él. |
| RF-15.17 | El punto debe quedarse en la última posición obtenida (no se actualiza solo; eso es HU-16) y actualizarse cada vez que el usuario pulsa el botón. |
| RF-15.18 | El punto debe verse por encima del mapa y no impedir tocar los lugares que tenga debajo. |
| RF-15.19 | Si la ubicación no se obtiene, no debe dibujarse ningún punto nuevo. |

### Accesibilidad
| ID | Requisito |
|---|---|
| RF-15.12 | El botón debe tener un nombre accesible que refleje lo que hace: «Mi ubicación» si el permiso está concedido y «Volver al campus» en los demás casos. |
| RF-15.13 | El aviso y los mensajes deben anunciarse a lectores de pantalla y el aviso debe poder cerrarse con Esc (equivale a «Ahora no»). |

## 4. Escenarios de aceptación
**Escenario 1: aviso al entrar** (RF-15.1, RF-15.10)
- **Dado** un navegador sin decisión sobre la ubicación
- **Cuando** entro a `/mapa`
- **Entonces** veo el aviso con «Permitir» y «Ahora no», y el mapa sigue en la vista inicial del campus.

**Escenario 2: aceptar** (RF-15.2, RF-15.7, RF-15.10, RF-15.14)
- **Dado** que el aviso está abierto
- **Cuando** pulso «Permitir» y acepto en el navegador
- **Entonces** el aviso se cierra y el mapa no se mueve ni muestra punto; al pulsar el botón, la cámara va a mi ubicación y aparece el punto azul con su halo.

**Escenario 3: «Ahora no»** (RF-15.3, RF-15.8)
- **Cuando** pulso «Ahora no» y luego el botón
- **Entonces** el navegador no mostró ninguna petición y la cámara va al centro de la universidad.
- **Y cuando** cambio a otra pantalla y vuelvo al mapa en la misma pestaña, el aviso no reaparece; en una pestaña nueva sí.

**Escenario 4: rechazar en el navegador** (RF-15.2, RF-15.8)
- **Cuando** pulso «Permitir» y rechazo la petición del navegador, y luego pulso el botón
- **Entonces** la cámara va al centro de la universidad y no se vuelve a pedir el permiso.

**Escenario 5: decisión previa** (RF-15.4)
- **Dado** un navegador donde ya concedí o denegué la ubicación
- **Cuando** entro a `/mapa`
- **Entonces** no aparece el aviso.

**Escenario 6: sin geolocalización** (RF-15.5, RF-15.8)
- **Dado** un navegador sin geolocalización
- **Cuando** entro a `/mapa` y pulso el botón
- **Entonces** no hay aviso y la cámara va al centro de la universidad.

**Escenario 7: falla al localizar** (RF-15.9)
- **Dado** el permiso concedido y una ubicación que no se puede obtener
- **Cuando** pulso el botón
- **Entonces** la cámara va al centro de la universidad, veo un mensaje breve y no aparece ningún punto nuevo.

**Escenario 8: seguir usando el mapa** (RF-15.6)
- **Dado** que el aviso está abierto
- **Cuando** busco un lugar o toco un punto del mapa
- **Entonces** funciona con normalidad.

**Escenario 9: botón ocupado** (RF-15.11)
- **Cuando** pulso el botón y la ubicación aún no llega
- **Entonces** el botón muestra que está trabajando y pulsarlo de nuevo no lanza otra lectura.

**Escenario 10: fuera del campus** (RF-15.7, RF-15.16)
- **Dado** el permiso concedido y una ubicación fuera del campus
- **Cuando** pulso el botón
- **Entonces** la cámara va a mi posición, aparece el punto con su halo y no sale ningún aviso.

**Escenario 11: precisión** (RF-15.15)
- **Cuando** la lectura tiene 50 m de precisión y luego otra de 10 m
- **Entonces** el halo se ve más grande en la primera y más chico en la segunda, sin desaparecer nunca por ser muy pequeño.

**Escenario 12: actualizar** (RF-15.17)
- **Dado** que ya hay un punto en el mapa
- **Cuando** me muevo y pulso otra vez el botón
- **Entonces** el punto pasa a la nueva posición y no queda el anterior.

**Escenario 13: tocar a través del punto** (RF-15.18)
- **Dado** que mi punto está sobre un lugar
- **Cuando** toco ahí
- **Entonces** se abre la ficha del lugar.

**Escenario 14: teclado** (RF-15.12, RF-15.13)
- **Cuando** abro el aviso y pulso Esc
- **Entonces** se cierra como «Ahora no».

## 5. Preguntas abiertas
- Ninguna. Decisiones: ubicación **fuera del campus se muestra igual, sin aviso** (P1), **punto azul con borde blanco y halo** (P2) y «Ahora no» **se recuerda mientras la pestaña siga abierta** (P3).
- Consecuencia para el plan: hoy el mapa está limitado al campus (`maxBounds`), así que hay que permitir que la cámara llegue a una posición fuera de él (RF-15.16).

## 6. Historial
- 2026-11-01 · Borrador creado con preguntas abiertas.
- 2026-11-01 · Preguntas resueltas: fuera del campus se muestra igual, se añade el punto azul con halo (RF-15.14 a RF-15.19) y «Ahora no» se recuerda por pestaña. Pendiente de aprobación.
- 2026-11-01 · Spec aprobada.
- 2026-11-01 · RF-15.10 aclarado: la lectura que dispara la petición del navegador se descarta (al redactar el plan).
- 2026-11-01 · Implementada.
