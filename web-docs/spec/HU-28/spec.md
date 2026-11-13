# HU-28 · La web lee los lugares de la API

- **Estado:** Aprobada
- **Historia:** ver `../../histories.md#hu-28`
- **Depende de:** HU-27 (API pública de lugares), HU-10 a HU-13 (mapa, filtros, búsqueda, ficha y rutas).
- **Archivos hermanos:** [plan.md](plan.md) · [task.md](task.md)

> `spec.md` dice **qué** debe hacer la historia y **cómo se comprueba**. El cómo técnico va en `plan.md` y el trabajo pendiente en `task.md`.

## 1. Contexto y objetivo
Hoy la web trae los lugares escritos en el código (`web/src/features/map/data/places.ts`) y los reparte, de forma síncrona, a casi todo el mapa: puntos, botones de categoría, buscador, ficha, vuelo de la cámara, cálculo de rutas y las tarjetas del chat. Esta historia hace que todo eso lea de la tabla de Postgres a través de `GET /api/places` y `GET /api/place-categories` (HU-27). Así, un cambio en la base se ve al recargar sin redesplegar la web, y la web deja de tener su propia copia de los datos. El asistente (RAG) queda aparte: lo cubre HU-29.

## 2. Alcance
**Dentro:**
- Cargar lugares y categorías desde la API al abrir la web, con estados de carga y de error y botón para reintentar.
- Que usen esos datos: los puntos del mapa y sus colores, los botones de categoría, el buscador, la ficha, la cámara, el cálculo de rutas y la validación de lugares en las tarjetas del chat.
- Mostrar en la ficha los campos nuevos de HU-22 cuando tengan valor (correo, web, cómo llegar).
- Ids de lugar tipo slug (`fisi`) en lugar de los numéricos antiguos (`"8"`).
- Retirar `places.ts` y lo que dependa de él, y reescribir sus pruebas con datos de ejemplo.
- Pruebas y documentación de la web.

**Fuera (y dónde se hace):**
- Que el asistente (RAG) lea los lugares de la base y devuelva ids que coincidan con los de la API → HU-29. Mientras tanto, una tarjeta del chat cuyo id no exista entre los lugares cargados se omite, como ya hace RF-05.18.
- Editar lugares desde la web → HU-30 y HU-31.
- Mostrar al visitante qué datos están sin verificar (`verified_at`) → decisión pendiente (ver preguntas).
- Eventos → HU-33.
- La app móvil (`frontend/`), que sigue con sus datos locales.
- Diseño móvil → HU-21.

## 3. Requisitos
Formato: «Cuando <situación>, el sistema debe <comportamiento>».

### Carga de datos
| ID | Requisito |
|---|---|
| RF-28.1 | Cuando la web se abre, en cualquier ruta, el sistema debe pedir una sola vez `GET /api/places` y `GET /api/place-categories`, sin esperar a que el usuario entre al mapa. Navegar entre páginas no vuelve a pedirlos. |
| RF-28.2 | El sistema debe convertir cada lugar de la API al formato que usa la web: `lat` y `lng` pasan a `coordinates` como `[lng, lat]`, `detailed_schedule` a `detailedSchedule`, `category_id` a `category`, y los valores `null` o listas vacías a «sin dato», de modo que no aparezcan secciones vacías. |
| RF-28.3 | Mientras se cargan los datos, el sistema debe mostrar un aviso de carga en el mapa y no debe mostrar puntos, botones de categoría ni resultados de búsqueda. El mapa base y la ubicación del usuario siguen funcionando. |
| RF-28.4 | Cuando la carga falla (sin conexión, tiempo agotado, error del servidor o respuesta que no es una lista), el sistema debe mostrar un mensaje claro sobre los lugares del campus, sin detalles técnicos, con un botón «Reintentar». Cuando el usuario reintenta, el sistema debe volver a pedir ambos recursos y, si funcionan, mostrar el mapa completo. |
| RF-28.5 | Cuando la API responde 503 porque la base no está disponible, el sistema debe mostrar el mismo mensaje de error con opción de reintentar, no un error genérico del asistente. |
| RF-28.6 | El sistema no debe mantener una lista de lugares escrita en el código de la web: la única fuente es la API. |

### Qué se ve con los datos
| ID | Requisito |
|---|---|
| RF-28.7 | Los puntos del mapa deben corresponder exactamente a los lugares publicados que devuelve la API, con el color de su categoría. Un lugar nuevo en la base aparece tras recargar la web; uno despublicado desaparece. |
| RF-28.8 | Los botones de categoría deben salir de `GET /api/place-categories`, en el orden de la API y con su etiqueta. No se muestran categorías sin ningún lugar publicado. Filtrar, desactivar el filtro y las reglas de selección de HU-10 siguen igual. |
| RF-28.9 | El buscador debe seguir resolviéndose en memoria sobre los lugares cargados, sin llamar al backend en cada tecla, con el mismo orden de resultados y límites de HU-11. Además de nombre y palabras clave, debe encontrar un lugar por su nombre corto. |
| RF-28.10 | La ficha de un lugar debe mostrar los mismos datos que en HU-12 y, cuando tengan valor, también correo, página web y «cómo llegar». Un campo sin valor no genera sección. Un lugar sin ninguno de estos datos conserva la ficha mínima (nombre y categoría). |
| RF-28.11 | Las acciones que usan un lugar por su id (elegirlo, volar hasta él, «Cómo llegar», origen y destino de una ruta) deben resolverlo en los lugares cargados. Un id que no existe se ignora, como hoy. |
| RF-28.12 | El cálculo de rutas (HU-13) debe obtener nombre y coordenadas de origen y destino de los lugares cargados y dar los mismos resultados que antes para los mismos puntos. |
| RF-28.13 | Los lugares deben usar como id su slug de la API (`fisi`, `puerta-8`). Ningún flujo de la web debe depender de los ids numéricos antiguos (`"8"`). |
| RF-28.14 | Cuando una respuesta del asistente trae lugares y los lugares aún no estaban cargados, las tarjetas «Ver en el mapa» deben aparecer cuando terminen de cargar. Una tarjeta cuyo id no existe entre los lugares cargados se omite (RF-05.18). |

### Limpieza y calidad
| ID | Requisito |
|---|---|
| RF-28.15 | `places.ts` y el script `web/scripts/dump-places.mjs` (que lo importa y ya cumplió su función en HU-22) deben retirarse, y `backend/README.md` debe dejar de indicar cómo regenerar la semilla desde la web. |
| RF-28.16 | Las pruebas que hoy dependen de `PLACES` deben pasar a usar datos de ejemplo (fixtures) y las de la capa de acceso a datos deben simular la API. Ninguna prueba debe necesitar el backend en ejecución. |
| RF-28.17 | `web/README.md` y `documents/02-frontend.md` no se tocan aquí (los actualiza HU-20), pero `web-docs/histories.md` debe reflejar la historia cerrada. |

## 4. Escenarios de aceptación
**Escenario 1: carga inicial** (RF-28.1, RF-28.7, RF-28.8)
- **Dado** el backend con los lugares de HU-22
- **Cuando** abro `/mapa`
- **Entonces** veo los 54 puntos con el color de su categoría y 9 botones de categoría en el orden de la API; en la red hay una sola petición a cada endpoint.

**Escenario 2: carga fuera del mapa** (RF-28.1)
- **Cuando** abro `/asistente`, y luego voy a `/mapa`
- **Entonces** los datos se pidieron al abrir la web y entrar al mapa no genera nuevas peticiones.

**Escenario 3: estado de carga** (RF-28.3)
- **Dado** una respuesta lenta de la API
- **Cuando** abro `/mapa`
- **Entonces** veo el mapa base con un aviso de carga, sin puntos ni botones; al llegar los datos, desaparece el aviso y aparecen.

**Escenario 4: fallo y reintento** (RF-28.4, RF-28.5)
- **Dado** el backend apagado
- **Cuando** abro `/mapa`
- **Entonces** veo un mensaje sobre los lugares del campus con «Reintentar»; al encender el backend y pulsarlo, aparece todo sin recargar la página. Con la base de datos apagada (503) veo el mismo mensaje.

**Escenario 5: cambio en la base** (RF-28.7, RF-28.10)
- **Dado** que cambio el horario de la FISI y despublico un lugar en la base
- **Cuando** recargo la web (pasado el minuto de caché)
- **Entonces** la ficha de la FISI muestra el horario nuevo y el lugar despublicado ya no está en el mapa ni en la búsqueda.

**Escenario 6: buscador y filtros** (RF-28.8, RF-28.9)
- **Cuando** escribo «fisi», «puerta 3» y «facultad» en el buscador y filtro por «Cafeterías»
- **Entonces** los resultados y el orden son los de HU-11, no hay llamadas al backend al teclear y el filtro deja solo los puntos de esa categoría.

**Escenario 7: ficha con campos nuevos** (RF-28.10)
- **Dado** un lugar con correo, página web y «cómo llegar» en la base
- **Cuando** abro su ficha
- **Entonces** veo esos tres datos; en un lugar sin ellos, no aparecen secciones vacías.

**Escenario 8: ruta con lugares de la API** (RF-28.11, RF-28.12, RF-28.13)
- **Cuando** elijo un lugar, pulso «Cómo llegar» y calculo la ruta hacia otro
- **Entonces** se dibuja la ruta como antes y el nombre del origen y del destino sale de los datos cargados.

**Escenario 9: tarjetas del chat** (RF-28.14)
- **Cuando** el asistente responde con un lugar cuyo id existe en la API, y con otro que no existe
- **Entonces** solo el primero muestra la tarjeta «Ver en el mapa» y esta lleva al lugar correcto.

**Escenario 10: sin copia local** (RF-28.6, RF-28.15, RF-28.16)
- **Cuando** busco en el código de `web/` la lista de lugares y corro las pruebas sin backend
- **Entonces** no existe `places.ts` ni el script de volcado, y todas las pruebas pasan.

## 5. Preguntas abiertas
Resueltas el 2026-11-12 (se aprobaron las propuestas):
- **Copia de respaldo:** no se incluye. Hay error con «Reintentar» y la caché HTTP del navegador cubre la repetición.
- **Datos sin verificar:** no se muestra ninguna marca al visitante por ahora.
- **Categorías vacías:** se oculta el botón de una categoría sin lugares publicados.
- **Tarjetas del chat hasta HU-29:** se acepta el periodo intermedio; las tarjetas con ids que no existan entre los lugares cargados se omiten hasta que HU-29 alinee los ids del asistente.

## 6. Historial
- 2026-11-12 · Borrador creado.
- 2026-11-12 · Aprobada: preguntas abiertas resueltas.
