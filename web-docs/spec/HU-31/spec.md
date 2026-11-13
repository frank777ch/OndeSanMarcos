# HU-31 · Administrar lugares (web)

- **Estado:** Aprobada
- **Historia:** ver `../../histories.md#hu-31`
- **Depende de:** HU-26 (área `/admin` y llamadas autenticadas), HU-28 (la web lee los lugares de la API) y HU-30 (API de administración de lugares y categorías).
- **Archivos hermanos:** [plan.md](plan.md) · [task.md](task.md)

> `spec.md` dice **qué** debe hacer la historia y **cómo se comprueba**. El cómo técnico va en `plan.md` y el trabajo pendiente en `task.md`.

## 1. Contexto y objetivo
El área `/admin` solo tiene una pestaña «Perfil» vacía. Con la API de HU-30 ya se pueden crear, editar y despublicar lugares y categorías, pero hay que hacerlo con `curl`. Esta historia agrega las pantallas para que el administrador gestione los lugares y las categorías desde la web: ver la lista, buscar y filtrar, crear y editar en un diálogo con un mapa en 2D para elegir la ubicación, despublicar, verificar y administrar categorías. Los cambios se ven en el mapa público y en el asistente (por HU-30).

## 2. Alcance
**Dentro:**
- Pestañas «Lugares» y «Categorías» en la barra lateral de `/admin`, con sus rutas.
- Lista de lugares con búsqueda, filtros y paginación, y acciones por fila: editar, despublicar o publicar, marcar o quitar la verificación.
- Diálogo para crear y editar un lugar, con todos los campos de la ficha y un mapa 2D para elegir las coordenadas.
- Gestión de categorías (listar, crear, editar y borrar las vacías) con el mismo tipo de diálogo.
- Mensajes de error de validación junto al campo, de carga y de guardado.
- Que el mapa público de la misma sesión refleje los cambios sin recargar la página.
- Aviso cuando el cambio se guardó pero el asistente no se pudo actualizar, con reintento.
- Pruebas y documentación de la web.

**Fuera (y dónde se hace):**
- Borrar lugares: no existe; se despublican (HU-30).
- Subir imágenes: solo se escribe la dirección (`image_url`).
- Historial de cambios o deshacer.
- Edición simultánea por dos administradores (gana el último en guardar).
- Gestionar administradores → historia futura.
- Eventos → HU-35.
- Diseño móvil → HU-21 (solo escritorio ≥ 1024px).
- Orden de las categorías por arrastre: solo se edita el número de orden.

## 3. Requisitos
Formato: «Cuando <situación>, el sistema debe <comportamiento>».

### Navegación y lista de lugares
| ID | Requisito |
|---|---|
| RF-31.1 | La barra lateral de `/admin` debe tener las pestañas «Perfil», «Lugares» y «Categorías», con las rutas `/admin`, `/admin/lugares` y `/admin/categorias`, protegidas como el resto del área (sin sesión llevan al login). |
| RF-31.2 | Cuando se abre «Lugares», el sistema debe pedir `GET /api/admin/places` y mostrar una tabla con todos los lugares, publicados o no, ordenados por nombre, con las columnas: nombre (y nombre corto si lo hay), categoría (con el color de la categoría), estado («Publicado» u «Oculto»), verificación («Verificado» o «Sin verificar»), última modificación (fecha y administrador) y acciones. Debe mostrar el total de lugares. |
| RF-31.3 | Mientras la lista carga, el sistema debe mostrar un indicador de carga; si falla, un mensaje claro con el botón «Reintentar». Si la sesión vence (401), se cierra la sesión como en HU-26. |
| RF-31.4 | El sistema debe ofrecer una caja de búsqueda y filtros por categoría, por estado (todos, publicados, ocultos) y por verificación (todos, sin verificar, verificados). La búsqueda no distingue mayúsculas ni tildes y mira nombre, nombre corto, palabras clave e id. Los filtros se combinan, se aplican al instante y el contador muestra «X de Y lugares». |
| RF-31.5 | Cuando ningún lugar cumple los filtros, el sistema debe mostrar «No hay lugares con esos filtros» y un botón para limpiarlos. Cuando no hay ningún lugar, un mensaje y el botón «Nuevo lugar». |
| RF-31.6 | Los filtros, la búsqueda y la página actual deben conservarse mientras se crea, edita o cambia un lugar, y no deben perderse por una acción de la tabla. |
| RF-31.6a | La tabla de lugares debe estar paginada: 20 lugares por página, con controles «Anterior» y «Siguiente», el número de página («Página 2 de 3») y el rango mostrado («21–40 de 54»). Cuando cambian la búsqueda o los filtros, vuelve a la página 1; si una acción deja la página actual vacía (por ejemplo, un filtro que ya no incluye el lugar cambiado), pasa a la última que exista. Con una sola página los controles se ocultan. La paginación se hace en pantalla sobre la lista ya cargada. |

### Acciones de fila
| ID | Requisito |
|---|---|
| RF-31.7 | Cuando el administrador pulsa «Despublicar» en un lugar publicado, el sistema debe pedir confirmación («Dejará de verse en el mapa y en el asistente») y, si confirma, guardar el lugar con `is_published` falso. «Publicar» en uno oculto no pide confirmación. |
| RF-31.8 | Cuando pulsa «Marcar como verificado» o «Quitar verificación», el sistema debe guardar el lugar con `verified` verdadero o falso, sin abrir el diálogo. |
| RF-31.9 | Las acciones de fila que guardan deben enviar el lugar completo con solo ese campo cambiado, de modo que no se pierda ningún otro dato (la API reemplaza todos los campos). |
| RF-31.10 | Mientras una acción de fila se guarda, esa fila debe quedar deshabilitada; al terminar, la tabla se actualiza con lo que devolvió el servidor y se muestra un aviso breve de confirmación. Si falla, la fila vuelve a su estado y se muestra un mensaje. |

### Diálogo de crear y editar
| ID | Requisito |
|---|---|
| RF-31.11 | Cuando el administrador pulsa «Nuevo lugar», el sistema debe abrir un diálogo **por encima de todo el contenido**, con el fondo difuminado, con el título «Nuevo lugar», una **X** para cerrar y cierre también con **Esc**. Para editar un lugar, el mismo diálogo con el título «Editar lugar» y los datos cargados. |
| RF-31.12 | Mientras el diálogo está abierto, el foco debe quedar dentro de él; al abrir, en el primer campo; al cerrar, vuelve al botón que lo abrió. El contenido de la página no debe responder a clics ni a teclado. Si el formulario es más alto que la pantalla, el cuerpo del diálogo hace scroll y el título, la X y los botones de guardar siguen visibles. |
| RF-31.13 | El formulario debe tener todos los campos de la ficha, agrupados con títulos de sección: **datos** (nombre, nombre corto, categoría, publicado, verificado), **ubicación** (mapa y coordenadas), **horario** (resumen y detalle), **contacto** (teléfono, anexo, correo, página web), **descripción** (descripción, cómo encontrarlo, uso), **listas** (palabras clave, carreras, servicios), **imagen** (dirección) y **lugar que lo contiene** (selector con búsqueda de los demás lugares). El `id` no se pide: al crear lo asigna el servidor y al editar se muestra solo de lectura. |
| RF-31.14 | Los campos que eligen entre valores ya existentes (**categoría** y **lugar que lo contiene**) deben ser un selector desplegable con búsqueda: al abrirlo muestra la lista completa; al escribir, la filtra (sin distinguir mayúsculas ni tildes); se elige con clic o con teclado (flechas y Enter). Solo se puede elegir un elemento de la lista: lo que se escribe sin elegir no es un valor, y si al salir del campo no hay un elemento elegido, el campo queda vacío y marcado como no seleccionado. No se puede crear una categoría ni un lugar desde estos campos: para una categoría nueva hay que crearla antes en «Categorías». El selector de «lugar que lo contiene» no ofrece el propio lugar ni sus descendientes, y puede quedar vacío; el de categoría es obligatorio. |
| RF-31.14a | Los campos de texto libre en lista (palabras clave, detalle del horario, carreras y servicios) no tienen una lista previa de valores, así que se editan escribiendo un elemento por línea; las líneas vacías y repetidas no cuentan. |
| RF-31.15 | Los campos obligatorios (nombre, categoría, latitud y longitud) deben marcarse como tales. El botón «Guardar» debe estar deshabilitado hasta que estén completos y deshabilitado también mientras se guarda. |
| RF-31.16 | Cuando el administrador pulsa «Guardar» con datos válidos, el sistema debe enviarlos (`POST` al crear, `PUT` al editar), cerrar el diálogo, actualizar la tabla con el lugar devuelto y mostrar un aviso «Lugar guardado». |
| RF-31.17 | Cuando el servidor responde 422 (incluida una categoría o un lugar contenedor que ya no existen), el sistema debe mostrar el mensaje de cada error junto al campo que corresponde, llevar el foco al primero, y **no** cerrar el diálogo ni perder lo escrito. Un error que no se pueda asociar a un campo se muestra arriba del formulario. |
| RF-31.18 | Cuando no se puede contactar al servidor o este responde con error, el sistema debe mostrar un mensaje claro dentro del diálogo, sin cerrarlo ni perder lo escrito, y permitir reintentar. |
| RF-31.19 | Cuando el formulario tiene cambios sin guardar y el administrador pulsa la X, Esc o «Cancelar», el sistema debe pedir confirmación dentro del propio diálogo («¿Descartar los cambios?», con «Seguir editando» y «Descartar»). Sin cambios, se cierra directamente. |
| RF-31.20 | Cuando el servidor devuelve `rag_sync: "failed"` al guardar, el sistema debe mostrar un aviso persistente «El lugar se guardó, pero el asistente aún no lo conoce» con un botón «Reintentar» que llama a `POST /api/admin/places/{id}/reindex`. Con `"ok"` o `"skipped"` no se muestra nada especial. |

### Mapa para elegir la ubicación
| ID | Requisito |
|---|---|
| RF-31.21 | La sección de ubicación debe mostrar un mapa de Mapbox **en vista 2D** (sin inclinación y con la rotación desactivada), con el mismo estilo que el mapa público, centrado en el campus y con la navegación limitada al área permitida por el servidor. |
| RF-31.22 | Cuando el administrador hace clic en el mapa, el sistema debe colocar un marcador en ese punto y llenar latitud y longitud. El marcador debe poder arrastrarse para ajustarlo. |
| RF-31.23 | Latitud y longitud deben poder escribirse; al escribir valores válidos, el marcador se mueve y el mapa lo centra. Un valor no numérico o fuera del área permitida debe marcar el campo con un mensaje. |
| RF-31.24 | Cuando el administrador hace clic o arrastra el marcador fuera del área permitida, el sistema no debe aceptar el punto y debe avisar «Ese punto está fuera del área del campus». |
| RF-31.25 | Al editar un lugar, el marcador debe partir de su posición actual y el mapa debe centrarse en ella. Al crear, el mapa muestra el campus completo y sin marcador hasta el primer clic. |
| RF-31.26 | Los demás lugares deben verse en el mapa como puntos pequeños y grises, sin interacción, para dar contexto. El lugar que se edita no se repite como punto gris. |
| RF-31.27 | Cuando no hay token de Mapbox o el mapa no puede cargar, el sistema debe mostrar un aviso en lugar del mapa y dejar el formulario utilizable escribiendo las coordenadas. |

### Categorías
| ID | Requisito |
|---|---|
| RF-31.28 | Cuando se abre «Categorías», el sistema debe pedir `GET /api/admin/place-categories` y mostrar una tabla con el color, el nombre, el id, el número de orden y la cantidad de lugares de cada una, ordenadas por orden, con los mismos estados de carga y de error que la lista de lugares. |
| RF-31.29 | «Nueva categoría» y «Editar» deben abrir el mismo tipo de diálogo que los lugares (por encima de todo, fondo difuminado, título, X y Esc, confirmación si hay cambios) con los campos: id (solo al crear, como slug), nombre, color y orden (opcional al crear). El color debe poder elegirse con un selector de color y escribirse en formato `#RRGGBB`. |
| RF-31.30 | Los errores 422 y 409 de las categorías deben mostrarse junto al campo (por ejemplo, un id repetido) sin cerrar el diálogo. |
| RF-31.31 | El botón «Borrar» de una categoría con lugares debe estar deshabilitado e indicar cuántos tiene; en una vacía debe pedir confirmación y borrarla. Si el servidor responde 409 igualmente, debe mostrar el motivo y refrescar la lista. |
| RF-31.32 | Los cambios en las categorías deben reflejarse en el selector de categoría de los lugares y en el filtro de la tabla, sin recargar la página. Los selectores y filtros por categoría usan el mismo componente de selección con búsqueda de RF-31.14. |

### Efecto en el resto de la web
| ID | Requisito |
|---|---|
| RF-31.33 | Después de guardar un lugar o una categoría con éxito, el mapa público de la misma sesión (lugares, botones de categoría, buscador y fichas) debe mostrar el cambio al visitar `/mapa`, sin recargar la página y sin esperar la caché del navegador. |
| RF-31.34 | Las llamadas de administración deben pasar por el punto único de llamadas autenticadas de HU-26, que debe admitir `PUT` y `DELETE`, y respuestas sin cuerpo (204). |

### Calidad
| ID | Requisito |
|---|---|
| RF-31.35 | Las tablas deben ser tablas accesibles (encabezados de columna, etiquetas en los botones de cada fila con el nombre del lugar), los diálogos deben anunciarse con su título, los campos deben tener etiqueta y los errores deben anunciarse a los lectores de pantalla. Todo debe poder usarse con el teclado. |
| RF-31.36 | Las pruebas de la web no deben necesitar el backend ni un token de Mapbox: simulan las llamadas y el mapa. |

## 4. Escenarios de aceptación
**Escenario 1: navegación** (RF-31.1)
- **Dado** un administrador con sesión
- **Cuando** abre `/admin`
- **Entonces** ve las pestañas «Perfil», «Lugares» y «Categorías»; sin sesión, `/admin/lugares` lo lleva al login.

**Escenario 2: lista, filtros y paginación** (RF-31.2 a RF-31.6a)
- **Cuando** abre «Lugares», escribe «psicolog», filtra por «Sin verificar» y por la categoría «Facultades»
- **Entonces** ve «Facultad de Psicología», con el contador «1 de 54 lugares»; al limpiar los filtros ve los primeros 20 con «Página 1 de 3» y «1–20 de 54», «Siguiente» lleva a «21–40», y al escribir «xyz» ve «No hay lugares con esos filtros».

**Escenario 3: crear un lugar** (RF-31.11 a RF-31.16, RF-31.21, RF-31.22)
- **Cuando** pulsa «Nuevo lugar»
- **Entonces** se abre un diálogo sobre toda la pantalla, con el fondo difuminado y el título «Nuevo lugar»; escribe nombre, elige categoría, hace clic en el mapa 2D (latitud y longitud se llenan), pulsa «Guardar», y el diálogo se cierra, aparece «Lugar guardado» y el lugar sale en la tabla; en `/mapa` aparece el punto sin recargar la página.

**Escenario 3b: selector de categoría** (RF-31.14)
- **Cuando** abre el selector de categoría, escribe «fac» y pulsa Enter sobre «Facultades»; luego escribe «Inventada» y sale del campo sin elegir nada
- **Entonces** la primera vez la categoría queda elegida; la segunda, el campo queda vacío y marcado como no seleccionado, «Guardar» sigue deshabilitado, y no hay ninguna opción para crear la categoría desde ahí.

**Escenario 4: cerrar el diálogo** (RF-31.11, RF-31.19)
- **Cuando** abre «Nuevo lugar» y pulsa la X o Esc sin escribir nada
- **Entonces** se cierra; si había escrito algo, pide «¿Descartar los cambios?», y «Seguir editando» lo deja abierto con lo escrito.

**Escenario 5: editar con el mapa** (RF-31.22, RF-31.23, RF-31.25)
- **Cuando** edita la FISI
- **Entonces** el marcador está en su posición actual; al arrastrarlo o al escribir otra latitud, latitud, longitud y marcador se mantienen de acuerdo.

**Escenario 6: punto fuera del campus** (RF-31.24)
- **Cuando** intenta colocar el marcador fuera del área permitida
- **Entonces** el punto no se acepta y se avisa «Ese punto está fuera del área del campus».

**Escenario 7: errores de validación** (RF-31.17, RF-31.18)
- **Cuando** guarda un correo «x» y la API responde 422; y luego se corta la conexión y vuelve a guardar
- **Entonces** el mensaje sale junto al campo «Correo», el foco va a él y el diálogo sigue abierto con lo escrito; en el corte ve un mensaje de conexión dentro del diálogo y puede reintentar.

**Escenario 8: despublicar y verificar** (RF-31.7 a RF-31.10)
- **Cuando** despublica un lugar y confirma, y luego lo marca como verificado
- **Entonces** la fila pasa a «Oculto» y luego a «Verificado» sin perder ningún otro dato, y el lugar desaparece del mapa público y reaparece al volver a publicarlo.

**Escenario 9: el asistente no se actualizó** (RF-31.20)
- **Dado** que el servidor responde `rag_sync: "failed"`
- **Cuando** guarda un lugar
- **Entonces** el lugar queda guardado y aparece el aviso con «Reintentar»; al pulsarlo se llama a `…/reindex` y el aviso desaparece si responde `"ok"`.

**Escenario 10: categorías** (RF-31.28 a RF-31.32)
- **Cuando** crea la categoría «Laboratorios» con un color, la usa en un lugar, y luego intenta borrarla
- **Entonces** aparece en la tabla y en el selector de lugares, el botón «Borrar» está deshabilitado e indica «1 lugar»; al mover el lugar a otra categoría, puede borrarla con confirmación.

**Escenario 11: sin mapa** (RF-31.27)
- **Dado** que no hay token de Mapbox
- **Cuando** abre «Nuevo lugar»
- **Entonces** ve un aviso en lugar del mapa y puede guardar escribiendo latitud y longitud.

**Escenario 12: sesión vencida** (RF-31.3)
- **Cuando** guarda y el servidor responde 401
- **Entonces** se cierra la sesión y lo lleva al login con el aviso de HU-26.

## 5. Preguntas abiertas
Resueltas el 2026-11-12:
- **Categorías:** pestaña propia (`/admin/categorias`).
- **Paginación:** sí, 20 por página, en pantalla (RF-31.6a).
- **Categoría y lugar contenedor:** selector desplegable con búsqueda y solo valores existentes (RF-31.14).

Propuestas aplicadas por no haberse objetado (se revierten si no convienen):
- **Campos de texto libre en lista** (palabras clave, carreras, servicios, detalle del horario): un elemento por línea (RF-31.14a), porque no tienen una lista cerrada de valores. Si se quiere que también sean cerrados, habría que definir antes esas listas (p. ej. una lista de carreras) en el backend.
- **Descartar cambios:** la confirmación va dentro del mismo diálogo (RF-31.19).
- **Difuminado del fondo:** opción nueva del `Modal` (`blurBackdrop`) que usan solo estos diálogos.
- **Puntos grises de contexto** en el mapa del formulario (RF-31.26).
- **Despublicar** pide confirmación (RF-31.7).
- **Búsqueda y filtros en pantalla** sobre la lista cargada (RF-31.4).

## 6. Historial
- 2026-11-12 · Borrador creado.
- 2026-11-12 · Aprobada. Cambios: paginación (RF-31.6a); categoría y lugar contenedor como selector con búsqueda y valores cerrados (RF-31.14, escenario 3b).
- 2026-11-12 · Código implementado y probado (533 pruebas de la web). Pendiente la verificación manual en el navegador (escenarios con mapa, difuminado y arrastre). Cambia RF-26.15 de HU-26: la barra de administración ya no tiene una sola pestaña.
