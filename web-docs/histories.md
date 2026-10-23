# Historias de usuario: OndeSanMarcos Web

## Resumen

| ID | Nombre | Estado |
|---|---|---|
| HU-01 | Rama y documentación | ✅ Hecha |
| HU-02 | Proyecto base | ✅ Hecha |
| HU-03 | Diseño y estructura (escritorio) | ✅ Hecha |
| HU-04 | Conexión con el backend | ⬜ Pendiente |
| HU-05 | Preguntar al asistente | ⬜ Pendiente |
| HU-06 | Preguntas sugeridas | ⬜ Pendiente |
| HU-07 | Historial de conversaciones | ⬜ Pendiente |
| HU-08 | Lugares en las respuestas | ⬜ Pendiente |
| HU-09 | Mapa del campus | ✅ Hecha |
| HU-10 | Lugares y filtros | ✅ Hecha |
| HU-11 | Buscar un lugar | ✅ Hecha |
| HU-12 | Ficha de lugar | ✅ Hecha |
| HU-13 | Calcular una ruta | ⬜ Pendiente |
| HU-14 | Ver la ruta | ⬜ Pendiente |
| HU-15 | Mi ubicación | ⬜ Pendiente |
| HU-16 | Guía paso a paso | ⬜ Pendiente |
| HU-17 | Recorrer el campus con un avatar | ⬜ Pendiente |
| HU-18 | Apariencia | ⬜ Pendiente |
| HU-19 | Bienvenida | ⬜ Pendiente |
| HU-20 | Calidad y cierre | ⬜ Pendiente |
| HU-21 | Adaptación a móvil | ⬜ Pendiente |
| HU-22 | Base de datos de lugares | ⬜ Pendiente |
| HU-23 | Postgres con pgvector en Docker | ⬜ Pendiente |

**Avance: 7 de 23 historias hechas.** HU-22 y HU-23 tienen ID alto para no renumerar. Conviene hacerlas antes de HU-20, y decidir HU-23 antes de escribir la spec de HU-22. Al cerrar una historia hay que actualizar esta tabla y el ✅ de su título más abajo.

---

**Producto:** aplicación web responsive para orientarse en el campus de la UNMSM. Sin registro ni login: se abre y se usa. Tiene dos áreas: **Mapa** (lugares, rutas, ubicación) y **Asistente** (chat que responde dudas del campus).

**Alcance:** una app nueva construida desde cero en `web/` (Vite + React + TypeScript). El backend FastAPI y la base vectorial en Supabase ya existen y se consumen tal cual. Todo corre en local por ahora.

**Flujo de trabajo:** rama `feat/web`, un commit por historia (`feat(web): HU-XX …`). El detalle técnico está en `plan.md`. Desde HU-10 se trabaja con **SDD**: cada historia tiene una carpeta `spec/HU-XX/` con `spec.md`, `plan.md` y `task.md` que se escribe y aprueba antes de programar (ver `spec/README.md`).

**Regla de implementación (decidida):** cada historia se implementa **solo para escritorio** (≥ 1024px). Lo móvil se hace **después, en bloque, en HU-21**. Por eso en HU-01 a HU-20 se ignoran las menciones a "móvil" o "pantallas pequeñas"; no hay que diseñar breakpoints responsive todavía. Sí hay que evitar anchos fijos que luego compliquen la adaptación (usar `rem`, flex/grid y variables CSS).

Estados: ⬜ pendiente · ✅ hecha

| Épica | Historias |
|---|---|
| Fundación | HU-01 a HU-04 |
| Asistente | HU-05 a HU-08 |
| Mapa | HU-09 a HU-12 |
| Rutas y ubicación | HU-13 a HU-16 |
| Extras y cierre | HU-17 a HU-20 |
| Datos (antes de HU-20) | HU-22, HU-23 |
| Móvil (después) | HU-21 |

---

## Fundación

### HU-01 · Rama y documentación ✅
**Como** equipo, **quiero** una rama propia con documentación **para** trabajar la web ordenadamente.
- Rama `feat/web`; carpeta `web-docs/` con `plan.md` e `histories.md`; archivos `.env.example` sin claves reales.
- **Aceptación:** la rama y los documentos existen; ningún `.env.example` contiene claves reales.

### HU-02 · Proyecto base ✅
**Como** desarrollador, **quiero** un proyecto Vite + React + TypeScript con herramientas listas **para** empezar a construir funciones.
- Crear `web/`; instalar `react-router-dom`, `zustand`, `mapbox-gl`, `react-map-gl`, `lucide-react`, Vitest y Testing Library; alias de rutas (`@/`); `web/.env.example` con `VITE_API_URL`, `VITE_MAPBOX_TOKEN`, `VITE_USE_MOCK_CHAT`; `.gitignore` que excluya `.env`.
- **Aceptación:** `npm run dev`, `npm run build` y `npm run test` funcionan; hay un test de ejemplo en verde.

### HU-03 · Diseño y estructura (escritorio) ✅
**Como** visitante, **quiero** una interfaz coherente con navegación clara **para** moverme entre el mapa y el asistente.
- Variables CSS (colores claro/oscuro, tipografía, espaciados, radios) con la paleta de la marca; fuentes DM Sans y Funnel Display; estilos base (reset); layout de escritorio con **barra lateral** de navegación Mapa / Asistente y área de contenido a pantalla completa; rutas `/` → `/mapa`, `/mapa`, `/asistente`; página 404; componentes base `Button`, `Input`, `IconButton`, `Modal`, `Toast`.
- Solo escritorio (≥ 1024px). La adaptación a móvil queda en HU-21.
- **Aceptación:** a 1440px se ve correcto y sin scroll de página; la navegación cambia de área sin recargar; los componentes base tienen tests.

### HU-04 · Conexión con el backend ⬜
**Como** desarrollador, **quiero** un cliente HTTP y una configuración central **para** que toda la app hable con el backend de forma uniforme.
- Módulo de configuración leído de `import.meta.env`; cliente con timeout, manejo de errores y logs opcionales en desarrollo; función `sendChatQuery` para `POST /chat`; modo mock para trabajar sin backend.
- **Aceptación:** con el backend local en `http://localhost:8000` se obtiene una respuesta real; con `VITE_USE_MOCK_CHAT=true` se obtiene una simulada; los errores de red y los timeouts devuelven un mensaje legible. Hay tests del cliente.

---

## Asistente

### HU-05 · Preguntar al asistente ⬜
**Como** visitante, **quiero** escribir una pregunta y recibir una respuesta **para** resolver dudas sobre el campus.
- Pantalla de chat con lista de mensajes, caja de texto (Enter envía, Shift+Enter salta de línea), burbujas de usuario y de asistente, indicador de "escribiendo…", desplazamiento automático al último mensaje; estado de error con botón "Reintentar"; aviso mientras el backend "despierta" (la primera consulta puede tardar).
- **Aceptación:** la pregunta se envía, se ve la respuesta y no se pueden enviar mensajes vacíos ni dos consultas a la vez.

### HU-06 · Preguntas sugeridas ⬜
**Como** visitante, **quiero** ver preguntas de ejemplo **para** saber qué puedo preguntar sin pensar en cómo redactarlo.
- Chips de sugerencias en el chat vacío; al elegir uno se envía la pregunta.
- **Aceptación:** al tocar una sugerencia se envía y se responde; las sugerencias desaparecen cuando la conversación ya empezó.

### HU-07 · Historial de conversaciones ⬜
**Como** visitante, **quiero** volver a mis conversaciones anteriores **para** no perder lo que ya consulté.
- Conversaciones guardadas en `localStorage`; botón "Nueva conversación"; lista del historial con título y fecha; abrir y borrar conversaciones.
- **Aceptación:** al recargar la página las conversaciones siguen ahí; se pueden abrir, crear y borrar.

### HU-08 · Lugares en las respuestas ⬜
**Como** visitante, **quiero** que cuando el asistente nombre un lugar pueda verlo en el mapa **para** saber dónde queda.
- Tarjeta de lugar dentro de la respuesta con botón "Ver en el mapa" que navega a `/mapa` y deja el lugar como objetivo.
- **Aceptación:** al pulsar el botón se abre el mapa centrado en ese lugar con su ficha abierta (depende de HU-09 y HU-12).

---

## Mapa

### HU-09 · Mapa del campus ✅
**Como** visitante, **quiero** ver un mapa del campus **para** ubicarme en él.
- Mapa Mapbox GL JS ocupando el área de contenido; cámara inicial centrada en la UNMSM con zoom e inclinación definidos; controles de zoom y de reorientar al norte; límites para no alejarse del campus; botón "Volver al campus".
- **Aceptación:** el mapa carga, se puede mover y hacer zoom, y el botón regresa a la vista inicial; si falta el token se muestra un mensaje claro.

### HU-10 · Lugares y filtros ✅
**Como** visitante, **quiero** ver los lugares del campus y filtrarlos por categoría **para** encontrar lo que busco.
- Datos de lugares (facultades, bibliotecas, comedores, servicios, etc.) con coordenadas y categoría; capa de puntos con íconos; chips de categoría (una activa a la vez o ninguna).
- **Aceptación:** se ven todos los lugares; al activar una categoría solo aparecen los de ese tipo; al desactivarla vuelven todos.

### HU-11 · Buscar un lugar ✅
**Como** visitante, **quiero** buscar un lugar por nombre **para** ir directo a él.
- Barra de búsqueda con resultados mientras escribo (sin distinguir tildes ni mayúsculas); al elegir un resultado la cámara vuela al lugar.
- **Aceptación:** buscar "biblioteca" lista las coincidencias; elegir una centra el mapa y abre su ficha.

### HU-12 · Ficha de lugar ✅
**Como** visitante, **quiero** ver los datos de un lugar al tocarlo **para** conocerlo antes de ir.
- Tarjeta con nombre, categoría, descripción y horario si lo hay; botón "Cómo llegar"; se abre como panel inferior en móvil y lateral en escritorio; cerrar con botón o tecla Esc.
- **Aceptación:** tocar un punto abre su ficha; cerrarla la quita; "Cómo llegar" inicia HU-13.

---

## Rutas y ubicación

### HU-13 · Calcular una ruta ⬜
**Como** visitante, **quiero** elegir un origen y un destino **para** saber por dónde caminar.
- Grafo de caminos del campus a partir de los datos GeoJSON; búsqueda del camino más corto (A\* o Dijkstra) entre el punto más cercano a cada extremo; selector de origen (mi ubicación, un lugar o un punto en el mapa) y de destino.
- **Aceptación:** con dos puntos válidos se calcula una ruta que sigue solo caminos del campus; si no hay camino se avisa. Tests del algoritmo y de la distancia (haversine).

### HU-14 · Ver la ruta ⬜
**Como** visitante, **quiero** ver la ruta dibujada y su distancia **para** decidir si me conviene.
- Línea de la ruta sobre el mapa con marcadores de origen y destino; tarjeta con distancia y tiempo estimado a pie; botón para cancelar la ruta; la cámara encuadra toda la ruta.
- **Aceptación:** al calcular una ruta se dibuja y se muestran distancia y tiempo; cancelar la limpia.

### HU-15 · Mi ubicación ⬜
**Como** visitante, **quiero** ver dónde estoy en el mapa **para** orientarme.
- Botón "Mi ubicación" con `navigator.geolocation`; explicación antes de pedir el permiso; mensajes claros si lo deniego o no está disponible; punto del usuario con círculo de precisión; aviso si estoy fuera del campus (geocerca).
- **Aceptación:** con permiso aparece mi punto y el mapa me centra; sin permiso o fuera del campus aparece un mensaje, sin errores en consola. Tests de la geocerca.

### HU-16 · Guía paso a paso ⬜
**Como** visitante, **quiero** que el mapa me siga mientras camino **para** llegar sin perderme.
- Modo guía con `watchPosition`; la cámara sigue al usuario y puede desactivarse al mover el mapa manualmente; distancia restante actualizada; brújula con `deviceorientation` donde esté disponible (en iOS pide permiso); aviso de llegada.
- **Aceptación:** al iniciar la guía el punto se mueve con mi posición y la distancia restante baja; al llegar se muestra un aviso y la guía termina.

---

## Datos

### HU-22 · Base de datos de lugares ⬜
**Como** equipo, **quiero** que los datos de los lugares vivan en una base de datos **para** corregirlos sin redesplegar y compartir una sola fuente con el asistente.
- Tablas `places` y `place_categories` en Supabase (nombre, categoría, coordenadas, palabras clave y los campos de la ficha de HU-12: horario, teléfono, anexo, descripción, carreras, servicios); lectura pública y escritura restringida con RLS; migración y carga inicial de los 55 lugares desde los datos actuales; cliente de Supabase en la web con un único módulo de acceso; carga al abrir la app con estado de carga y de error; copia de respaldo incluida en la app por si falla la red; variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `web/.env.example`.
- Fuera de alcance: pantalla para editar los datos desde la web; que el RAG deje de usar su propio corpus; que el backend lea esta tabla (puede ser una historia posterior).
- Depende de: HU-10, HU-11 y HU-12 (para conocer los campos de la ficha).
- Decisiones a tomar al escribir la spec (HU-23 elimina Supabase, así que la web ya no puede leer la base directo con una anon key: tendría que usar un endpoint `GET /api/places` del backend): leer directo desde Supabase o a través de un endpoint del backend; usar el proyecto de Supabase del backend o uno nuevo; quién verifica los datos marcados como «demo» antes de cargarlos.
- **Aceptación:** la web muestra los mismos 55 lugares leídos de Supabase; si la carga falla, usa la copia incluida y avisa; cambiar un horario en la tabla se ve al recargar, sin redesplegar; la búsqueda sigue resolviéndose en memoria, sin llamar al backend; hay tests del acceso a datos.

### HU-23 · Postgres con pgvector en Docker ⬜
**Como** equipo, **quiero** que el asistente use un Postgres con pgvector que corra en un contenedor **para** desarrollar y probar el RAG completo en local, sin depender de Supabase.
- Servicios `db` (`pgvector/pgvector:pg16`) y `migrate` (Flyway) en `docker-compose.yml`, con volumen persistente; migraciones SQL versionadas en `backend/db/migrations` (`V1` con el esquema: extensión `vector`, tabla `documents`, índice HNSW y `match_documents`).
- Backend: reemplazar el cliente `supabase` (API REST) por acceso directo a Postgres con `psycopg` y `pgvector` en la búsqueda, la ingesta y la subida de entradas; una sola variable `DATABASE_URL`. **Se elimina Supabase** (paquete, variables, carpeta `supabase/`).
- `script/dev.sh`: comandos `ingest`, `db-reset` y `psql`; `test` incluye pruebas de integración contra la base. CI con un Postgres real; `.env.example` y READMEs al día.
- Fuera de alcance: alojar Postgres en producción; migrar los datos de Supabase (se regeneran con la ingesta); cambiar de proveedor de embeddings (la clave de Gemini sigue siendo necesaria); actualizar `documents/` (HU-20).
- Depende de: ninguna historia de la web. Es trabajo de backend. Para ingerir y responder con calidad real hace falta la clave de Gemini (ya en `backend/.env`).
- Decisiones tomadas: solo `DATABASE_URL`; migraciones con Flyway; si la base está vacía, 503 con mensaje claro; la base se levanta siempre. Spec en `spec/HU-23/`.
- **Aceptación:** `./script/dev.sh` levanta base, migraciones, backend y web; la ingesta carga el corpus en el Postgres local; con `RAG_USE_MOCK=false` y la clave de Gemini, `POST /api/chat` responde usando la búsqueda por vectores contra el contenedor; los tests del backend pasan sin Supabase; no queda ninguna referencia a Supabase en `backend/` ni en `docker-compose.yml`.

## Extras y cierre

### HU-17 · Recorrer el campus con un avatar ⬜
**Como** visitante, **quiero** explorar el campus de forma virtual con un avatar **para** conocerlo antes de ir.
- Selector de punto de inicio; avatar animado (quieto/caminando) sobre el mapa; cámara cercana e inclinada; movimiento con teclado (flechas/WASD) y con toque en pantallas táctiles; botón para salir del modo.
- **Aceptación:** el avatar aparece en el punto elegido, se mueve por los caminos y se anima al caminar; salir restaura la vista normal.

### HU-18 · Apariencia ⬜
**Como** visitante, **quiero** elegir entre tema claro y oscuro **para** leer cómodo.
- Tokens de color claro y oscuro; selector en el encabezado; respeta `prefers-color-scheme` por defecto; preferencia guardada en `localStorage`; el estilo del mapa cambia con el tema.
- **Aceptación:** el cambio se aplica al instante en toda la app y se mantiene al recargar.

### HU-19 · Bienvenida ⬜
**Como** visitante nuevo, **quiero** una breve introducción **para** entender qué puedo hacer.
- Pantalla o modal de 2–3 pasos (mapa, rutas, asistente) en la primera visita, con opción de saltarla; indicador guardado en `localStorage`; accesible desde la ayuda para volver a verla.
- **Aceptación:** se muestra solo la primera vez y se puede saltar o repetir.

### HU-20 · Calidad y cierre ⬜
**Como** equipo, **quiero** pruebas, accesibilidad y documentación al día **para** entregar una web estable.
- Pruebas de las tiendas, utilidades y componentes clave; accesibilidad (etiquetas, foco visible, contraste, navegación por teclado); retirar la carpeta `frontend/` anterior; `README.md` y `documents/02-frontend.md` actualizados con el nuevo stack y comandos; revisar `backend` para el origen de CORS de `localhost:5173`; revocar los tokens de Mapbox que estuvieron en el repositorio.
- **Aceptación:** `npm run test` y `npm run build` pasan sin errores; en Lighthouse la accesibilidad es ≥ 90; el repositorio solo contiene `web/` como frontend.

## Después de todo lo anterior

### HU-21 · Adaptación a móvil ⬜
**Como** visitante con celular o tablet, **quiero** que la web se adapte a mi pantalla **para** usarla igual de bien que en computadora.
- Breakpoints (~768px y ~480px); barra de navegación inferior en lugar de la lateral; fichas y paneles del mapa como panel inferior; chat y búsqueda ajustados al teclado virtual; controles táctiles (tamaño mínimo 44px); revisar `viewport` y áreas seguras (notch); revisar cada pantalla de HU-03 a HU-19.
- **Aceptación:** a 375px, 768px y 1440px no hay scroll horizontal y todas las funciones se pueden usar; probado en un celular real (con HTTPS en la red local para la geolocalización).
