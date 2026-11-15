# HU-40 · Mapa propio de la universidad en 3D (Three.js)

- **Estado:** Borrador
- **Historia:** ver `../../histories.md#hu-40`
- **Depende de:** HU-12 (mapa), HU-13 (rutas), HU-15 (ubicación), HU-18 (tema).
- **Archivos hermanos:** [plan.md](plan.md) · [task.md](task.md)

> `spec.md` dice **qué** debe hacer la historia y **cómo se comprueba**. El cómo técnico va en `plan.md` y el trabajo pendiente en `task.md`.

## 1. Contexto y objetivo
El mapa público usa Mapbox Standard: muestra todo Lima con mucho detalle y depende de un token. Se quiere un mapa **propio, simple y solo de la Ciudad Universitaria**, dibujado en un canvas 3D con Three.js, con el estilo sobrio de un mapa esquemático (edificios en bloques, caminos y áreas verdes), que siga el tema claro u oscuro y conserve el cambio entre vista 3D y 2D. Todo lo que hoy se hace sobre el mapa (lugares, ruta, ubicación) debe seguir funcionando igual.

## 2. Alcance
**Dentro:**
- Datos del campus (edificios, áreas verdes, contorno) obtenidos de OpenStreetMap una sola vez y guardados en el repositorio.
- Escena 3D con cámara propia: desplazar, hacer zoom, girar e inclinar, con límites en el campus.
- Vista 3D / 2D, borde punteado del campus, lugares, ruta, «X» para quitarla y ubicación del usuario.
- Colores según el tema claro/oscuro.

**Fuera (y dónde se hace):**
- El selector de ubicación del panel de administración (`LocationPicker`) sigue con Mapbox (se migra después, si se decide).
- Elegir sobre pisos o techos: los toques son siempre a nivel del suelo.
- Modelado manual de edificios con detalle, texturas, fotogrametría o interiores.
- Cambiar la búsqueda, las fichas, los filtros o el cálculo de rutas (solo cambia dónde se dibujan).

## 3. Requisitos
| ID | Requisito |
|---|---|
| RF-40.1 | El mapa de la web pública debe dibujarse en un canvas 3D propio (Three.js) y no depender de Mapbox ni de su token. |
| RF-40.2 | El mapa debe mostrar solo la Ciudad Universitaria: suelo del campus, caminos, áreas verdes y canchas, y edificios como bloques con su altura. Fuera del contorno solo se ve un fondo liso. |
| RF-40.3 | Los datos del campus deben estar guardados en el repositorio (generados una vez desde OpenStreetMap con un script); la web no consulta servicios externos para dibujar el mapa. Debe verse la atribución a OpenStreetMap (un enlace a https://www.openstreetmap.org/copyright; en móvil, en su forma corta «© OpenStreetMap») y el origen de los datos debe quedar documentado en `web/README.md`. |
| RF-40.4 | Los caminos dibujados deben ser los mismos del grafo con el que se calculan las rutas, para que la ruta siempre quede sobre un camino visible. |
| RF-40.5 | El usuario debe poder desplazar el mapa (arrastrar), hacer zoom (rueda o pellizco) y girar e inclinar la vista (botón derecho o dos dedos). |
| RF-40.6 | La cámara no debe poder alejarse del campus más que un margen fijo ni acercarse o alejarse más allá de un zoom mínimo y máximo. Si la ubicación del usuario cae fuera, el margen se amplía para incluirla (como hoy, RF-15.16). |
| RF-40.7 | El botón de vista debe alternar entre 3D (inclinada) y 2D (cenital) con una transición suave; su nombre («Vista 2D» / «Vista 3D») debe seguir a la inclinación real, también si el usuario la cambia a mano. |
| RF-40.8 | El contorno del campus debe verse como una línea punteada. |
| RF-40.9 | Los lugares deben verse como puntos del color de su categoría con su nombre, filtrados por la categoría activa y solo cuando los datos están cargados (como RF-28.3). Tocar un punto (siempre a nivel del suelo) debe elegir el lugar con origen «map» y abrir su ficha; tocar una zona sin lugares no cierra la ficha. |
| RF-40.10 | Al elegir un lugar desde la búsqueda o el chat, la cámara debe volar hasta él; si se eligió tocando el mapa, la cámara no se mueve. |
| RF-40.11 | La ruta iniciada debe dibujarse como una línea gruesa sobre el mapa, sin marcadores. Al iniciarla, la cámara debe encuadrarla entera en el área visible (descontando la barra lateral, el buscador y los filtros) manteniendo la inclinación y orientación actuales. |
| RF-40.12 | Al pasar el cursor sobre la ruta (o tocarla en pantallas táctiles), la línea debe engrosarse y mostrar una «X» junto al punto, que la quita. La ruta tiene prioridad sobre los lugares que tenga debajo. (Mismo comportamiento que RF-13.39 vigente.) |
| RF-40.13 | La ubicación del usuario debe verse como un punto azul con borde blanco y un halo que indica la precisión, sin capturar toques sobre los lugares. |
| RF-40.14 | El botón de ubicación debe llevar la cámara a la posición del usuario; «Volver al campus» debe devolverla a la vista inicial. Siguen vigentes RF-15.8 y RF-15.12. |
| RF-40.15 | Los colores del mapa (suelo, fondo, edificios, áreas verdes, caminos, contorno, textos) deben cambiar al instante con el tema claro/oscuro de la app (HU-18). |
| RF-40.16 | El mapa debe ocupar su contenedor y adaptarse a cambios de tamaño sin franjas vacías ni deformar la perspectiva; el buscador, los filtros, la ficha y el menú de acciones siguen encima sin cambios. |
| RF-40.17 | El mapa debe mantenerse fluido (≈ 60 cuadros por segundo en un computador y uso normal en un celular de gama media) y solo redibujar cuando algo cambia. |
| RF-40.18 | El código del mapa (Three.js y los datos) debe cargarse de forma diferida: no debe pesar en el resto de las páginas. |
| RF-40.19 | El menú de acciones del mapa debe incluir «Tema oscuro» / «Tema claro» como una opción más: cambia el tema de toda la app al instante, se recuerda en el navegador y, la primera vez, sigue el tema del sistema. |
| RF-40.21 | Cuando el campus no está en foco (el centro de la vista queda fuera del contorno y no se ve ningún punto de este), el mapa debe mostrar en el borde del área visible una flecha que apunta hacia el campus, en cualquier dirección (360°). Al pulsarla, la cámara vuelve a la vista del campus. |
| RF-40.20 | Además del campus, el mapa debe dibujar las avenidas y calles que lo rodean, solo hasta unos 160 m más allá del contorno (no completas), para que el campus no se vea recortado en un cuadrado. Se obtienen de OpenStreetMap junto con el resto de los datos. |

## 4. Escenarios de aceptación
**Escenario 1: ver el campus** (RF-40.1, RF-40.2, RF-40.3)
- **Dado** que abro «Mapa» sin token de Mapbox configurado
- **Cuando** carga la página
- **Entonces** veo el campus con sus edificios, caminos y áreas verdes sobre un fondo liso, y la atribución a OpenStreetMap.

**Escenario 2: mover la cámara** (RF-40.5, RF-40.6)
- **Dado** el mapa abierto
- **Cuando** arrastro, hago zoom y giro la vista, e intento alejarme mucho del campus
- **Entonces** la cámara responde con fluidez y se detiene en el límite.

**Escenario 3: 3D y 2D** (RF-40.7)
- **Dado** el mapa en 3D
- **Cuando** pulso «Vista 2D»
- **Entonces** la cámara pasa a vista cenital con una transición y el botón dice «Vista 3D». Si inclino la vista a mano, el nombre se actualiza.

**Escenario 4: elegir un lugar** (RF-40.9, RF-40.10)
- **Dado** el mapa con lugares
- **Cuando** busco «Biblioteca Central» y la elijo
- **Entonces** la cámara vuela hasta ella y se abre su ficha; al tocar otro punto del mapa se elige ese lugar sin mover la cámara.

**Escenario 5: filtrar** (RF-40.9)
- **Dado** el mapa con lugares
- **Cuando** activo la categoría «Puertas»
- **Entonces** solo se ven los puntos de esa categoría.

**Escenario 6: ruta y «X»** (RF-40.11, RF-40.12)
- **Dado** una ruta entre dos lugares
- **Cuando** pulso «Iniciar ruta»
- **Entonces** la cámara encuadra la línea; al pasar el cursor sobre ella se engrosa y aparece una «X» que, al pulsarla, quita la ruta. Si hay un lugar bajo la línea, el toque sobre la línea no lo elige.

**Escenario 7: mi ubicación** (RF-40.13, RF-40.14)
- **Dado** el permiso de ubicación concedido
- **Cuando** pulso «Mi ubicación»
- **Entonces** la cámara va a mi posición y veo el punto azul con su halo; con el permiso denegado, el botón dice «Volver al campus» y devuelve la cámara a la vista inicial.

**Escenario 8: tema** (RF-40.15)
- **Dado** el mapa abierto
- **Cuando** cambio entre tema claro y oscuro
- **Entonces** los colores del mapa cambian al instante, sin recargar.

**Escenario 9: cambio de página** (RF-40.16, RF-40.18)
- **Dado** que estoy en «Asistente»
- **Cuando** voy a «Mapa»
- **Entonces** el mapa ocupa todo el ancho sin franjas blancas ni tirones, y el código del mapa solo se descargó en ese momento.

## 5. Preguntas abiertas
- **Altura de los edificios (aprobado):** se toma de OpenStreetMap (`height` o `building:levels`), no de Mapbox: sus términos no permiten extraer los datos de sus teselas para usarlos fuera de Mapbox, y esos datos vienen en gran parte de OpenStreetMap de todos modos. Los que no tengan altura usan una por defecto (9 m). Pendiente: al generar los datos, contar cuántos edificios no la tienen y, si son muchos, completarlos a mano mirando el mapa actual solo como referencia visual.

**Resueltas el 2026-11-13:**
- Detalle visual de los edificios (aprobado): se empieza con un nivel bajo (bloques y sombreado suave) y se refina después.
- `LocationPicker` (el mapa del panel donde el administrador marca la ubicación de un lugar) no se migra por ahora y sigue con Mapbox; se decide cuando el mapa nuevo esté terminado. Los toques en el mapa se resuelven siempre a nivel del suelo, sin distinguir pisos ni elegir sobre el techo de un edificio: el punto es el que está en el suelo bajo el cursor.
- No hay respaldo con Mapbox: la rama `test/own-map` solo se fusiona cuando el mapa nuevo esté terminado; mientras tanto `feat/web` conserva el mapa actual funcionando.

## 6. Historial
- 2026-11-13 · Borrador creado en la rama `test/own-map`, a partir de `mapa-threejs-plan.md`.
- 2026-11-13 · Resueltas las preguntas sobre alturas (se toman de OpenStreetMap), `LocationPicker` (se decide al terminar) y respaldo con Mapbox (no hay).
