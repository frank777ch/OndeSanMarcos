# HU-13 · Calcular una ruta

- **Estado:** Implementada
- **Historia:** ver `../../histories.md#hu-13`
- **Depende de:** HU-10 (lugares), HU-11 (buscador), HU-12 (ficha de lugar), HU-15 (mi ubicación)
- **Archivos hermanos:** [plan.md](plan.md) · [task.md](task.md)

## 1. Contexto y objetivo
El visitante ya puede encontrar un lugar y ver su ficha, pero no sabe por dónde caminar para llegar. Quiere indicar dónde empieza y adónde va, y que la web le diga si existe un camino por el campus y cuánto mide.

Se agrega un botón debajo de «Mi ubicación» que abre un diálogo de planificación con dos campos, **Punto de partida** y **Destino**. Cada campo usa el mismo buscador de lugares que ya existe. El diálogo calcula la ruta y muestra su distancia; con «Iniciar ruta» se cierra y el mapa dibuja la línea del recorrido y la cámara vuela hasta dejarla centrada. Marcadores y tiempo estimado son HU-14.

## 2. Alcance
**Dentro:**
- Botón «Planificar ruta» debajo del botón de ubicación, en la esquina inferior derecha del mapa.
- Diálogo con los campos **Punto de partida** y **Destino**, cada uno con el buscador de lugares existente.
- Opción «Mi ubicación» como punto de partida (con la ubicación de HU-15).
- Botón «Cómo llegar» en la ficha de lugar, que abre el diálogo con ese lugar como destino.
- Botón para intercambiar origen y destino.
- Cálculo del camino más corto por los caminos del campus entre el origen y el destino.
- Resultado en el diálogo: distancia de la ruta, o aviso claro cuando no se puede calcular.
- Botón «Iniciar ruta» que cierra el diálogo y dibuja en el mapa solo la línea de la ruta y la cámara vuela para encuadrarla.
- Botón «Quitar ruta» para borrar la línea.
- Dejar la ruta en el estado de la aplicación para que HU-14 la complete.

**Fuera (y dónde se hace):**
- Marcadores de origen y destino, tiempo estimado a pie y tarjeta de la ruta con botón de cancelar → HU-14.
- Elegir un punto cualquiera tocando el mapa como origen o destino → no se hace por ahora; el origen y el destino se eligen con el buscador o con «Mi ubicación».
- Seguir al usuario y guía paso a paso → HU-16.
- Rutas accesibles, rutas alternativas o varias paradas → fuera de la versión actual.
- Resto del diseño móvil → HU-21 (el panel desde arriba se adelanta en esta historia, RF-13.46 a RF-13.49).

## 3. Requisitos

### Botón y diálogo
| ID | Requisito |
|---|---|
| RF-13.1 | El sistema debe mostrar en el mapa un botón «Planificar ruta» justo debajo del botón de ubicación, con el mismo tamaño y estilo. |
| RF-13.2 | Cuando el usuario pulsa el botón, el sistema debe abrir un diálogo con los campos «Punto de partida» y «Destino», ambos vacíos y en ese orden de arriba abajo. |
| RF-13.3 | Cuando el usuario pulsa «Cerrar» o la tecla Esc, el sistema debe cerrar el diálogo. Si la lista de resultados de un campo está abierta, Esc cierra solo esa lista. |
| RF-13.4 | Al abrirse el diálogo, el foco debe pasar al primer campo vacío; al cerrarse, el foco debe volver al botón que lo abrió. |
| RF-13.5 | El diálogo no debe ocultar el botón de ubicación ni el de planificar ruta al cerrarse, y mientras está abierto no debe permitir interactuar con el mapa de fondo. |
| RF-13.6 | Si el diálogo se cierra y se vuelve a abrir, debe conservar el origen y el destino elegidos. |

### Elegir origen y destino
| ID | Requisito |
|---|---|
| RF-13.7 | Cada campo debe buscar lugares con el mismo comportamiento que el buscador del mapa: mínimo de caracteres, búsqueda sin distinguir mayúsculas ni tildes, lista de resultados con nombre y categoría, navegación con flechas y Enter, y el mensaje «No encontramos ese lugar» cuando no hay resultados. |
| RF-13.8 | Cuando el usuario elige un resultado en un campo, el sistema debe guardarlo como origen o destino según el campo y mostrar su nombre en él. |
| RF-13.9 | Elegir un lugar en los campos del diálogo no debe elegir ese lugar en el mapa, abrir su ficha ni mover la cámara. |
| RF-13.10 | Cada campo con un lugar elegido debe tener un botón «Limpiar» que lo vacíe y borre el resultado anterior. |
| RF-13.11 | Si el usuario edita el texto de un campo que tenía un lugar elegido, el sistema debe descartar ese lugar hasta que elija otro resultado. |
| RF-13.12 | El diálogo debe tener un botón «Intercambiar» que cambie el origen por el destino y viceversa, incluidos los campos vacíos. |
| RF-13.13 | El origen y el destino pueden ser el mismo lugar solo si se eligen por error: en ese caso el sistema no debe calcular y debe avisar «El punto de partida y el destino son el mismo lugar». |

### Mi ubicación como punto de partida
| ID | Requisito |
|---|---|
| RF-13.14 | El campo «Punto de partida» debe ofrecer una opción «Mi ubicación» al enfocarlo con el campo vacío, además de los resultados de búsqueda. El campo «Destino» no la ofrece. |
| RF-13.15 | Cuando el usuario elige «Mi ubicación» y el permiso de ubicación está concedido, el sistema debe obtener la ubicación actual del dispositivo y usarla como origen, y el campo debe mostrar «Mi ubicación». |
| RF-13.16 | Mientras se obtiene la ubicación, el campo debe indicar que está trabajando y el cálculo no debe empezar. |
| RF-13.17 | Cuando el permiso no está concedido o no se puede obtener la ubicación, el sistema debe dejar el origen vacío y mostrar un mensaje que lo explique, sin volver a pedir el permiso si ya fue denegado. |
| RF-13.18 | Cuando el permiso aún no fue decidido, elegir «Mi ubicación» debe pedirlo al navegador igual que lo hace el botón de ubicación. |

### Cálculo de la ruta
| ID | Requisito |
|---|---|
| RF-13.19 | Cuando el origen y el destino están elegidos y son distintos, el sistema debe calcular la ruta automáticamente, sin otro botón. |
| RF-13.20 | La ruta debe seguir solo los caminos del campus: parte del punto de los caminos más cercano al origen, termina en el más cercano al destino y recorre el camino más corto entre ambos. |
| RF-13.21 | La distancia de la ruta debe ser la suma de las distancias entre sus puntos, calculada sobre la superficie terrestre, y mostrarse en metros redondeados (por ejemplo «320 m»), o en kilómetros con un decimal desde 1000 m (por ejemplo «1,2 km»). |
| RF-13.22 | El resultado debe incluir también el tramo desde el origen hasta el camino y desde el camino hasta el destino cuando estén separados, y la distancia mostrada debe sumarlos. |
| RF-13.23 | Cuando el origen o el destino están a más de 150 m del camino más cercano (por ejemplo, el usuario está fuera del campus), el sistema debe no calcular y avisar «Estás muy lejos de los caminos del campus». El aviso nombra cuál de los dos puntos está lejos. |
| RF-13.24 | Cuando no existe un camino entre los dos puntos por los caminos del campus, el sistema debe avisar «No encontramos un camino entre estos lugares». |
| RF-13.25 | Cuando el usuario cambia el origen o el destino, el sistema debe descartar la ruta anterior y calcular de nuevo si ambos están elegidos. |
| RF-13.26 | Mientras la ruta se calcula, el diálogo debe mostrar un indicador y, si tarda, no bloquear el cierre. |
| RF-13.27 | Cuando se calcula una ruta, el sistema debe guardarla (origen, destino, puntos, distancia) en el estado de la aplicación. Calcularla no dibuja nada en el mapa; eso ocurre al iniciar la ruta (RF-13.38). |

### Resultado en el diálogo
| ID | Requisito |
|---|---|
| RF-13.28 | Cuando hay una ruta calculada, el diálogo debe mostrar su distancia y los nombres del origen y del destino. |
| RF-13.29 | Los avisos y el resultado deben anunciarse a lectores de pantalla (región `status`/`alert`). |
| RF-13.30 | Mientras no haya origen y destino, el diálogo no debe mostrar resultado ni aviso. |

### Iniciar la ruta y dibujarla
| ID | Requisito |
|---|---|
| RF-13.37 | El diálogo debe tener un botón «Iniciar ruta», deshabilitado mientras no haya una ruta calculada correctamente (sin origen o destino, calculando, o con aviso de error). |
| RF-13.38 | Cuando el usuario pulsa «Iniciar ruta», el sistema debe cerrar el diálogo y dibujar en el mapa una línea que siga los puntos de la ruta, del origen al destino. No debe dibujar marcadores. |
| RF-13.39 | La línea debe verse por encima del mapa y tener prioridad sobre los lugares que tenga debajo: al pasar el cursor o tocarla se engrosa y aparece una «X» para quitarla. |
| RF-13.40 | Mientras hay una línea dibujada, cambiar o limpiar el origen o el destino en el diálogo no debe alterarla; solo cambia cuando el usuario vuelve a pulsar «Iniciar ruta» (reemplaza a la anterior). |
| RF-13.41 | Mientras hay una línea dibujada, el diálogo debe mostrar un botón «Quitar ruta» que borre la línea sin vaciar el origen ni el destino. |
| RF-13.42 | Cuando el usuario pulsa «Iniciar ruta», la cámara debe volar con animación hasta encuadrar la ruta completa, centrada en el área visible del mapa (sin quedar tapada por la barra lateral, el buscador ni el logo de Mapbox), conservando exactamente la inclinación y la orientación que tenga el mapa en ese momento (3D o plano). Quitar la ruta o volver a la vista del mapa con una ruta ya dibujada no mueve la cámara. |

### Vista 2D / 3D
| ID | Requisito |
|---|---|
| RF-13.43 | El mapa debe mostrar, justo debajo de «Planificar ruta», un botón de vista con el nombre «Vista 2D» cuando el mapa está inclinado y «Vista 3D» cuando está plano. |
| RF-13.44 | Cuando el usuario pulsa el botón con el mapa inclinado, el sistema debe enderezar la cámara a inclinación 0 con una transición; con el mapa plano, debe devolverla a la inclinación del campus. Centro, zoom y orientación no cambian. |
| RF-13.45 | El nombre del botón debe reflejar la inclinación real del mapa aunque el usuario la cambie con el mouse o el teclado (plano = menos de 1°). |

### Panel en móvil
«Móvil» es un ancho de pantalla menor a 768 px.

| ID | Requisito |
|---|---|
| RF-13.46 | En móvil, el diálogo «Planificar ruta» debe pegarse al borde superior de la pantalla, a todo el ancho y con las esquinas inferiores redondeadas, y entrar deslizándose desde arriba. Si el usuario pidió reducir el movimiento, debe aparecer sin animación. |
| RF-13.47 | En móvil, la altura máxima del panel debe ser el 85 % de la pantalla visible, con scroll interno, y debe respetar la zona segura superior (notch). |
| RF-13.48 | En móvil, el panel debe tener un asa en su borde inferior. Mientras se arrastra hacia arriba, el panel debe seguir al dedo sin bajar de su posición; si se suelta tras subir más de 80 px, el panel se cierra; si se suelta antes, vuelve a su sitio. |
| RF-13.49 | «Cerrar», Esc y tocar el fondo oscuro deben seguir cerrando el panel. Desde 768 px el diálogo se muestra centrado, como hasta ahora, y sin asa. |

### «Cómo llegar» desde la ficha
| ID | Requisito |
|---|---|
| RF-13.31 | La ficha de lugar debe tener un botón «Cómo llegar» (retira RF-12.13). |
| RF-13.32 | Cuando el usuario pulsa «Cómo llegar», el sistema debe abrir el diálogo con ese lugar como destino y el origen vacío (o conservado si ya había uno elegido, RF-13.6), y el foco en el punto de partida. |
| RF-13.33 | Abrir el diálogo desde la ficha no debe cerrar la ficha. |

### Presentación y accesibilidad
| ID | Requisito |
|---|---|
| RF-13.34 | El diálogo debe ser modal, con el título «Planificar ruta», atrapar el foco mientras está abierto y adaptarse a una altura baja con desplazamiento interno. |
| RF-13.35 | El botón «Planificar ruta» debe tener un nombre accesible «Planificar ruta», y los campos las etiquetas «Punto de partida» y «Destino». |
| RF-13.36 | La lista de resultados de cada campo debe poder recorrerse con teclado y anunciarse como lista de opciones, igual que el buscador del mapa. |

## 4. Escenarios de aceptación
**Escenario 1: abrir el diálogo** (RF-13.1, RF-13.2, RF-13.4)
- **Dado** el mapa abierto
- **Cuando** miro la esquina inferior derecha y pulso el botón bajo «Mi ubicación»
- **Entonces** se abre el diálogo «Planificar ruta» con «Punto de partida» y «Destino» vacíos, y el foco en el primero.

**Escenario 2: ruta entre dos lugares** (RF-13.7, RF-13.8, RF-13.19, RF-13.20, RF-13.21, RF-13.28)
- **Dado** el diálogo abierto
- **Cuando** busco «Biblioteca» en el punto de partida y la elijo, y busco «Comedor» en destino y lo elijo
- **Entonces** sin pulsar nada más veo la distancia de la ruta y los dos nombres.

**Escenario 3: elegir no toca el mapa** (RF-13.9)
- **Cuando** elijo un lugar en cualquiera de los campos del diálogo
- **Entonces** la cámara no se mueve, no se abre ninguna ficha y el buscador del mapa no cambia.

**Escenario 4: mi ubicación como partida** (RF-13.14, RF-13.15, RF-13.16)
- **Dado** el permiso de ubicación concedido y yo dentro del campus
- **Cuando** enfoco «Punto de partida» vacío y elijo «Mi ubicación», y luego elijo un destino
- **Entonces** el campo muestra «Mi ubicación» y obtengo la distancia desde mi posición.

**Escenario 5: sin ubicación** (RF-13.17)
- **Dado** que denegué la ubicación en el navegador
- **Cuando** elijo «Mi ubicación» como partida
- **Entonces** el campo queda vacío, veo un mensaje que explica que no se puede usar y el navegador no vuelve a preguntar.

**Escenario 6: permiso pendiente** (RF-13.18)
- **Dado** un navegador sin decisión sobre la ubicación
- **Cuando** elijo «Mi ubicación»
- **Entonces** el navegador muestra su petición y, si acepto, se usa mi posición.

**Escenario 7: lejos del campus** (RF-13.23)
- **Dado** el permiso concedido y yo a más de 150 m de los caminos del campus
- **Cuando** uso «Mi ubicación» como partida y elijo un destino
- **Entonces** veo «Estás muy lejos de los caminos del campus» indicando que es el punto de partida, y no hay distancia.

**Escenario 8: sin camino** (RF-13.24)
- **Dado** dos lugares que no están conectados por los caminos del campus
- **Cuando** los elijo como partida y destino
- **Entonces** veo «No encontramos un camino entre estos lugares» y no se guarda ninguna ruta.

**Escenario 9: mismo lugar** (RF-13.13)
- **Cuando** elijo el mismo lugar como partida y destino
- **Entonces** veo «El punto de partida y el destino son el mismo lugar» y no se calcula nada.

**Escenario 10: intercambiar** (RF-13.12, RF-13.25)
- **Dado** una ruta calculada de A a B
- **Cuando** pulso «Intercambiar»
- **Entonces** A pasa a destino y B a partida, la ruta se recalcula y la distancia es la misma (o muy parecida si los tramos hasta el camino difieren).

**Escenario 11: cambiar un campo** (RF-13.10, RF-13.11, RF-13.25, RF-13.30)
- **Dado** una ruta calculada
- **Cuando** pulso «Limpiar» en el destino
- **Entonces** desaparece la distancia y no se muestra ningún resultado hasta elegir otro destino.

**Escenario 12: cerrar y volver** (RF-13.3, RF-13.4, RF-13.6)
- **Dado** una ruta calculada
- **Cuando** pulso Esc y luego vuelvo a abrir el diálogo
- **Entonces** el foco había vuelto al botón y los campos conservan el origen y el destino.

**Escenario 13: Esc con la lista abierta** (RF-13.3)
- **Dado** el diálogo abierto con la lista de resultados de un campo visible
- **Cuando** pulso Esc
- **Entonces** solo se cierra la lista; con otro Esc se cierra el diálogo.

**Escenario 14: cómo llegar desde la ficha** (RF-13.31, RF-13.32, RF-13.33)
- **Dado** la ficha de un lugar abierta
- **Cuando** pulso «Cómo llegar»
- **Entonces** se abre el diálogo con ese lugar como destino, el foco en «Punto de partida» y la ficha sigue abierta debajo.

**Escenario 15: no hay resultados** (RF-13.7)
- **Cuando** escribo «zzzzz» en un campo
- **Entonces** veo «No encontramos ese lugar».

**Escenario 16: calcular no dibuja** (RF-13.27)
- **Dado** una ruta calculada en el diálogo
- **Cuando** aún no pulso «Iniciar ruta»
- **Entonces** el mapa no muestra ninguna línea.

**Escenario 18: iniciar la ruta** (RF-13.37, RF-13.38, RF-13.39)
- **Dado** una ruta calculada
- **Cuando** pulso «Iniciar ruta»
- **Entonces** el diálogo se cierra y aparece la línea de la ruta sobre el mapa, sin marcadores, la cámara vuela hasta mostrar la ruta completa centrada, y puedo tocar un lugar que esté debajo de ella.

**Escenario 19: botón deshabilitado** (RF-13.37)
- **Cuando** falta el origen o el destino, o hay un aviso de error
- **Entonces** «Iniciar ruta» está deshabilitado.

**Escenario 20: cambiar y quitar** (RF-13.40, RF-13.41)
- **Dado** una línea dibujada
- **Cuando** abro el diálogo y cambio el destino
- **Entonces** la línea no cambia hasta pulsar «Iniciar ruta»; y con «Quitar ruta» la línea desaparece y los campos se conservan.

**Escenario 21: ruta en vista plana** (RF-13.42, RF-13.44)
- **Dado** el mapa en vista 2D
- **Cuando** inicio una ruta
- **Entonces** la cámara vuela a la ruta y el mapa sigue plano; con la vista 3D, sigue con la misma inclinación.

**Escenario 22: cambiar de vista** (RF-13.43 a RF-13.45)
- **Cuando** pulso «Vista 2D»
- **Entonces** el mapa se endereza sin moverse de sitio y el botón pasa a «Vista 3D»; al pulsarlo vuelve a la inclinación del campus.
- **Y cuando** inclino el mapa con el mouse, el botón vuelve a decir «Vista 2D».

**Escenario 23: panel desde arriba en móvil** (RF-13.46, RF-13.47)
- **Dado** un ancho de pantalla de 390 px
- **Cuando** pulso «Planificar ruta»
- **Entonces** el panel baja desde el borde superior, a todo el ancho y con las esquinas de abajo redondeadas, sin pasar del 85 % de la pantalla; la lista de resultados se ve por encima y el teclado no tapa los campos.

**Escenario 24: arrastrar para cerrar** (RF-13.48, RF-13.49)
- **Dado** el panel abierto en móvil
- **Cuando** arrastro el asa 100 px hacia arriba y suelto
- **Entonces** el panel se cierra.
- **Y cuando** lo arrastro solo 40 px y suelto, vuelve a su sitio; con «Cerrar», Esc o tocando el fondo también se cierra.

**Escenario 25: escritorio igual** (RF-13.49)
- **Dado** un ancho de pantalla de 1024 px
- **Cuando** abro «Planificar ruta»
- **Entonces** el diálogo se ve centrado como antes y no hay asa.

**Escenario 17: teclado y lector** (RF-13.34, RF-13.35, RF-13.36)
- **Cuando** abro el diálogo solo con teclado
- **Entonces** el foco queda dentro, puedo recorrer los campos, las listas y los botones con Tab y flechas, y el resultado se anuncia.

## 5. Preguntas abiertas
- Ninguna. Decisiones: umbral de «muy lejos» **150 m** (P1), **sin elegir punto tocando el mapa** por ahora (P2), **solo distancia** en el diálogo, el tiempo va en HU-14 (P3) y **«Cómo llegar» se hace en esta historia** (P4).
- Consecuencia para el plan: el cálculo es síncrono sobre un grafo pequeño, sin trabajador aparte.

## 6. Historial
- 2026-11-02 · Borrador creado.
- 2026-11-02 · Preguntas resueltas con las propuestas del borrador. Spec aprobada.
- 2026-11-02 · Implementada.
- 2026-11-02 · Ampliada a petición: botón «Iniciar ruta» y línea de la ruta en el mapa (RF-13.37 a RF-13.41); RF-13.27 y escenario 16 ajustados. Marcadores, cámara y tiempo siguen en HU-14.
- 2026-11-02 · Ampliada: al iniciar la ruta la cámara vuela y la encuadra (RF-13.42); RF-13.38 ya no exige quedarse quieta. El encuadre sale de HU-14.
- 2026-11-02 · Ampliada: el vuelo conserva la inclinación y orientación exactas (RF-13.42; `fitBounds` las reiniciaba) y se agrega el botón de vista 2D/3D (RF-13.43 a RF-13.45).
- 2026-11-02 · Ampliada a petición: panel desde arriba en móvil, tipo bottom sheet invertido (RF-13.46 a RF-13.49). Se adelanta de HU-21 solo esta parte; el resto del diseño móvil sigue allí.
- 2026-11-02 · Escenarios manuales comprobados con el mapa real, incluido el panel desde arriba en móvil.
