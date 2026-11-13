# Historias de usuario: OndeSanMarcos Web

## Resumen

| ID | Nombre | Estado |
|---|---|---|
| HU-01 | Rama y documentación | ✅ Hecha |
| HU-02 | Proyecto base | ✅ Hecha |
| HU-03 | Diseño y estructura (escritorio) | ✅ Hecha |
| HU-04 | Conexión con el backend | ✅ Hecha |
| HU-05 | Preguntar al asistente | ✅ Hecha |
| HU-06 | Preguntas sugeridas | ⬜ Pendiente |
| HU-07 | Historial de conversaciones | ⬜ Pendiente |
| HU-08 | Lugares en las respuestas | ✅ Hecha (dentro de HU-05) |
| HU-09 | Mapa del campus | ✅ Hecha |
| HU-10 | Lugares y filtros | ✅ Hecha |
| HU-11 | Buscar un lugar | ✅ Hecha |
| HU-12 | Ficha de lugar | ✅ Hecha |
| HU-13 | Calcular una ruta | ✅ Hecha |
| HU-14 | Ver la ruta | ⬜ Pendiente |
| HU-15 | Mi ubicación | ✅ Hecha |
| HU-16 | Guía paso a paso | ⬜ Pendiente |
| HU-17 | Recorrer el campus con un avatar | ⬜ Pendiente |
| HU-18 | Apariencia | ⬜ Pendiente |
| HU-19 | Bienvenida | ⬜ Pendiente |
| HU-20 | Calidad y cierre | ⬜ Pendiente |
| HU-21 | Adaptación a móvil | ⬜ Pendiente |
| HU-22 | Base de datos de lugares | ✅ Hecha |
| HU-23 | Postgres con pgvector en Docker | ✅ Hecha |
| HU-24 | Usuario administrador inicial | ✅ Hecha |
| HU-25 | Login de administrador (backend) | ✅ Hecha |
| HU-26 | Login de administrador (web) | ✅ Hecha |
| HU-27 | API pública de lugares | ✅ Hecha |
| HU-28 | La web lee los lugares de la API | ⬜ Pendiente |
| HU-29 | El asistente usa los lugares de la base | ⬜ Pendiente |
| HU-30 | Administrar lugares (API) | ✅ Implementada |
| HU-31 | Administrar lugares (web) | ⬜ Pendiente |
| HU-32 | Base de datos y API de eventos | ⬜ Pendiente |
| HU-33 | Eventos en la web | ⬜ Pendiente |
| HU-34 | El asistente responde sobre eventos | ⬜ Pendiente |
| HU-35 | Administrar eventos (web) | ⬜ Pendiente |
| HU-36 | Buscador de lugares en el servidor | ⬜ Pendiente |
| HU-37 | Perfil del administrador y cambio de contraseña | ⬜ Pendiente |

**Avance: 18 de 35 historias hechas.** HU-22 a HU-35 tienen ID alto para no renumerar. Orden propuesto para los datos: HU-22 → 27 → 28 → 29 → 30 → 31 (lugares) y luego HU-32 → 33 → 34 → 35 (eventos); conviene terminarlos antes de HU-20. Al cerrar una historia hay que actualizar esta tabla y el ✅ de su título más abajo.

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
| Datos: lugares (antes de HU-20) | HU-22, HU-23, HU-27 a HU-31 |
| Datos: eventos | HU-32 a HU-35 |
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

### HU-04 · Conexión con el backend ✅
**Como** desarrollador, **quiero** un cliente HTTP y una configuración central **para** que toda la app hable con el backend de forma uniforme.
- Módulo de configuración leído de `import.meta.env`; cliente con timeout, manejo de errores y logs opcionales en desarrollo; función `sendChatQuery` para `POST /chat`; modo mock para trabajar sin backend.
- **Aceptación:** con el backend local en `http://localhost:8000` se obtiene una respuesta real; con `VITE_USE_MOCK_CHAT=true` se obtiene una simulada; los errores de red y los timeouts devuelven un mensaje legible. Hay tests del cliente.

---

## Asistente

### HU-05 · Preguntar al asistente ✅
**Como** visitante, **quiero** escribir una pregunta y recibir una respuesta **para** resolver dudas sobre el campus.
- Pantalla de chat con lista de mensajes, caja de texto (Enter envía, Shift+Enter salta de línea), burbujas de usuario y de asistente, indicador de "escribiendo…", desplazamiento automático al último mensaje; estado de error con botón "Reintentar"; tarjetas de lugar bajo la respuesta con botón "Ver en el mapa" (vuelo hasta el lugar y ficha abierta, absorbe HU-08).
- **Aceptación:** la pregunta se envía, se ve la respuesta y no se pueden enviar mensajes vacíos ni dos consultas a la vez.

### HU-06 · Preguntas sugeridas ⬜
**Como** visitante, **quiero** ver preguntas de ejemplo **para** saber qué puedo preguntar sin pensar en cómo redactarlo.
- Chips de sugerencias en el chat vacío; al elegir uno se envía la pregunta.
- **Aceptación:** al tocar una sugerencia se envía y se responde; las sugerencias desaparecen cuando la conversación ya empezó.

### HU-07 · Historial de conversaciones ⬜
**Como** visitante, **quiero** volver a mis conversaciones anteriores **para** no perder lo que ya consulté.
- Conversaciones guardadas en `localStorage`; botón "Nueva conversación"; lista del historial con título y fecha; abrir y borrar conversaciones.
- **Aceptación:** al recargar la página las conversaciones siguen ahí; se pueden abrir, crear y borrar.

### HU-08 · Lugares en las respuestas ✅ (hecha dentro de HU-05)
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

### HU-13 · Calcular una ruta ✅
**Como** visitante, **quiero** elegir un origen y un destino **para** saber por dónde caminar.
- Grafo de caminos del campus a partir de los datos GeoJSON; búsqueda del camino más corto (A\* o Dijkstra) entre el punto más cercano a cada extremo; selector de origen (mi ubicación, un lugar o un punto en el mapa) y de destino.
- **Aceptación:** con dos puntos válidos se calcula una ruta que sigue solo caminos del campus; si no hay camino se avisa. Tests del algoritmo y de la distancia (haversine).

### HU-14 · Ver la ruta ⬜
**Como** visitante, **quiero** ver la ruta dibujada y su distancia **para** decidir si me conviene.
- Línea de la ruta sobre el mapa con marcadores de origen y destino; tarjeta con distancia y tiempo estimado a pie; botón para cancelar la ruta; la cámara encuadra toda la ruta.
- **Aceptación:** al calcular una ruta se dibuja y se muestran distancia y tiempo; cancelar la limpia.

### HU-15 · Mi ubicación ✅
**Como** visitante, **quiero** ver dónde estoy en el mapa **para** orientarme.
- Botón "Mi ubicación" con `navigator.geolocation`; explicación antes de pedir el permiso; mensajes claros si lo deniego o no está disponible; punto del usuario con círculo de precisión; aviso si estoy fuera del campus (geocerca).
- **Aceptación:** con permiso aparece mi punto y el mapa me centra; sin permiso o fuera del campus aparece un mensaje, sin errores en consola. Tests de la geocerca.

### HU-16 · Guía paso a paso ⬜
**Como** visitante, **quiero** que el mapa me siga mientras camino **para** llegar sin perderme.
- Modo guía con `watchPosition`; la cámara sigue al usuario y puede desactivarse al mover el mapa manualmente; distancia restante actualizada; brújula con `deviceorientation` donde esté disponible (en iOS pide permiso); aviso de llegada.
- **Aceptación:** al iniciar la guía el punto se mueve con mi posición y la distancia restante baja; al llegar se muestra un aviso y la guía termina.

---

## Datos

### HU-22 · Base de datos de lugares ✅
**Como** equipo, **quiero** que los lugares del campus vivan en tablas de Postgres **para** tener una sola fuente de datos, corregirlos sin redesplegar y poder editarlos desde el panel de administración más adelante.
- Migración `V3` con `place_categories` (id, etiqueta, color) y `places`: `id` (slug estable), nombre y nombre corto, categoría, `lat`/`lng`, `keywords`, descripción, horario resumido y detallado, teléfono, anexo, correo, web, cómo llegar, carreras, servicios, uso (auditorios), imagen, lugar padre (un auditorio dentro de una facultad), `is_published`, `verified_at`, `updated_at` y `updated_by`.
- Script de carga idempotente que lee los lugares actuales de la web (`web/src/features/map/data/places.ts`) y del backend (`app/knowledge/places.py`), unifica los ids (hoy «1»–«40» y slugs; los ids «23» y «25» repiten el nombre) y conserva una tabla de equivalencias; los datos marcados «demo» se cargan con `verified_at` vacío.
- Fuera de alcance: exponer los datos por la API (HU-27); que la web o el RAG los lean (HU-28, HU-29); editarlos (HU-30 en adelante); la app móvil (`frontend/`), que sigue con sus datos locales.
- Depende de: HU-23 (Postgres y Flyway).
- **Aceptación:** al aplicar las migraciones y correr la carga existen todos los lugares con sus categorías y campos; correrla otra vez no duplica ni pisa cambios hechos a mano; una consulta SQL devuelve la ficha completa de un lugar; hay tests de integración contra Postgres.

### HU-23 · Postgres con pgvector en Docker ✅
**Como** equipo, **quiero** que el asistente use un Postgres con pgvector que corra en un contenedor **para** desarrollar y probar el RAG completo en local, sin depender de Supabase.
- Servicios `db` (`pgvector/pgvector:pg16`) y `migrate` (Flyway) en `docker-compose.yml`, con volumen persistente; migraciones SQL versionadas en `backend/db/migrations` (`V1` con el esquema: extensión `vector`, tabla `documents`, índice HNSW y `match_documents`).
- Backend: reemplazar el cliente `supabase` (API REST) por acceso directo a Postgres con `psycopg` y `pgvector` en la búsqueda, la ingesta y la subida de entradas; una sola variable `DATABASE_URL`. **Se elimina Supabase** (paquete, variables, carpeta `supabase/`).
- `script/dev.sh`: comandos `ingest`, `db-reset` y `psql`; `test` incluye pruebas de integración contra la base. CI con un Postgres real; `.env.example` y READMEs al día.
- Fuera de alcance: alojar Postgres en producción; migrar los datos de Supabase (se regeneran con la ingesta); cambiar de proveedor de embeddings (la clave de Gemini sigue siendo necesaria); actualizar `documents/` (HU-20).
- Depende de: ninguna historia de la web. Es trabajo de backend. Para ingerir y responder con calidad real hace falta la clave de Gemini (ya en `backend/.env`).
- Decisiones tomadas: solo `DATABASE_URL`; migraciones con Flyway; si la base está vacía, 503 con mensaje claro; la base se levanta siempre. Spec en `spec/HU-23/`.
- **Aceptación:** `./script/dev.sh` levanta base, migraciones, backend y web; la ingesta carga el corpus en el Postgres local; con `RAG_USE_MOCK=false` y la clave de Gemini, `POST /api/chat` responde usando la búsqueda por vectores contra el contenedor; los tests del backend pasan sin Supabase; no queda ninguna referencia a Supabase en `backend/` ni en `docker-compose.yml`.

### HU-24 · Usuario administrador inicial ✅
**Como** equipo, **quiero** que exista un usuario administrador definido en el `.env` del backend **para** habilitar las futuras funciones de administración sin crearlo a mano.
- Tabla `admin_users` (`username` único, `password_hash`) con la migración `V2`; `ADMIN_USERNAME` y `ADMIN_PASSWORD` en `backend/.env`; al iniciar la app se crea el administrador si no existe, con la contraseña hasheada (bcrypt); si ya existe no se modifica.
- Fuera de alcance: iniciar sesión, tokens, proteger endpoints y pantallas de administración.
- Depende de: HU-23. Spec en `spec/HU-24/`.
- **Aceptación:** con las variables definidas, el primer arranque crea una fila con hash `$2b$`; reiniciar no duplica ni cambia el hash; sin variables o con la base apagada, el backend arranca igual.

### HU-25 · Login de administrador (backend) ✅
**Como** administrador, **quiero** iniciar sesión con mi usuario y contraseña **para** obtener un token y usar los endpoints de administración.
- `POST /api/auth/login` (usuario y contraseña → token con vencimiento), `GET /api/auth/me` protegido y un mecanismo reutilizable para proteger endpoints; `JWT_SECRET` y `ACCESS_TOKEN_EXPIRE_MINUTES` en `backend/.env`; error genérico ante credenciales incorrectas; bloqueo tras 5 intentos fallidos.
- Fuera de alcance: pantalla de login (HU-26), gestión de administradores, refresh de token.
- Depende de: HU-24. Spec en `spec/HU-25/`.
- **Aceptación:** el login correcto devuelve un token que `/me` acepta; credenciales incorrectas, token alterado o vencido dan 401; el sexto intento fallido seguido da 429; sin `JWT_SECRET` la app no arranca.

### HU-26 · Login de administrador (web) ✅
**Como** administrador, **quiero** iniciar y cerrar sesión desde la web **para** acceder al área de administración.
- Pantalla `/admin/login` (usuario y contraseña, errores de credenciales, bloqueo y conexión); sesión guardada en la pestaña y mantenida al recargar; área `/admin` protegida con la barra lateral del mapa, una sola pestaña «Perfil» vacía y «Cerrar sesión»; un único punto para llamadas autenticadas a la API; si la sesión vence o es rechazada, vuelve al login. Sin enlace visible para los visitantes.
- Fuera de alcance: funciones de administración (HU-30 y siguientes), refresh de token, «olvidé mi contraseña», móvil (HU-21).
- Depende de: HU-25. Spec en `spec/HU-26/`.
- **Aceptación:** con las credenciales correctas se llega a `/admin`; con las incorrectas aparece el error y se conserva el usuario; recargar mantiene la sesión; sin sesión `/admin` lleva al login; cerrar sesión (en la barra lateral) la termina; los visitantes no ven cambios.

### HU-27 · API pública de lugares ✅
**Como** visitante, **quiero** que la web pueda pedir los lugares al backend **para** ver siempre los datos vigentes.
- `GET /api/places` (con filtro por categoría y solo lugares publicados), `GET /api/places/{id}` y `GET /api/place-categories`, sin autenticación; respuesta con todos los campos de la ficha; encabezados de caché para no cargar la base en cada visita.
- Fuera de alcance: escritura (HU-29); consumo desde la web (HU-28); eventos (HU-31).
- Depende de: HU-22.
- **Aceptación:** los endpoints devuelven los lugares y categorías cargados en HU-22; un lugar no publicado no aparece; un id inexistente da 404; con la base apagada responde 503 con mensaje claro; aparecen en `/docs`.

### HU-28 · La web lee los lugares de la API ⬜
**Como** visitante, **quiero** que el mapa, el buscador y las fichas usen los datos de la base **para** ver información al día.
- Un único módulo de acceso a datos que carga lugares y categorías al abrir la app, con estado de carga y de error; copia de respaldo incluida en la app por si falla la red; la búsqueda (HU-11) y los filtros (HU-10) siguen resolviéndose en memoria; retirar `places.ts` como fuente principal.
- Fuera de alcance: edición (HU-30); eventos (HU-33).
- Depende de: HU-27.
- **Aceptación:** el mapa muestra los mismos lugares que la base; si la API falla, usa la copia y avisa; cambiar un horario en la base se ve al recargar, sin redesplegar; hay tests del acceso a datos.

### HU-29 · El asistente usa los lugares de la base ⬜
**Como** visitante, **quiero** que el asistente responda con la información actual de los lugares **para** no recibir datos desfasados.
- `find_places` y las tarjetas «Ver en mapa» leen de la tabla (con caché en memoria invalidada al editar) y la coincidencia por palabra clave pasa de subcadena a límites de palabra (evita falsos positivos como «pre»); `documents` gana `source_type` y `source_id` (migración `V4`) con índice único; `reindex_place(id)` arma el texto de la ficha, calcula el embedding y hace upsert (y borra si el lugar se despublica); la ingesta completa usa los lugares de la base en vez de duplicarlos desde `corpus.py`.
- Fuera de alcance: endpoints de edición (HU-30); eventos (HU-34).
- Depende de: HU-22. Conviene hacerla antes de HU-30.
- **Aceptación:** preguntar por un lugar usa los datos de la tabla; tras `reindex_place` la respuesta refleja el cambio sin reingerir todo; una palabra clave ya no coincide dentro de otra palabra; los tests del motor siguen en verde.

### HU-30 · Administrar lugares (API) ✅
**Como** administrador, **quiero** crear, editar y despublicar lugares y categorías **para** mantener la información del campus sin tocar el código.
- `POST` y `PUT` de lugares, y `POST/PUT/DELETE` de categorías, protegidos con `get_current_admin` (HU-25); los lugares **no se borran**: se despublican con `is_published`; el `id` de un lugar nuevo es un número incremental asignado por el sistema; validación de campos (coordenadas dentro del campus, categoría existente); registro de `updated_by` y `updated_at`; al guardar o despublicar se invalida la caché y se llama a `reindex_place` (HU-29); `verified_at` editable.
- Fuera de alcance: pantalla (HU-31); subir imágenes (se guarda solo la URL); historial de cambios.
- Depende de: HU-25, HU-27 y HU-29.
- **Aceptación:** sin token las escrituras dan 401; crear un lugar lo hace aparecer en `GET /api/places` y en las respuestas del asistente; despublicarlo lo retira de ambos; datos inválidos dan 422 con el campo; hay tests de integración.

### HU-31 · Administrar lugares (web) ⬜
**Como** administrador, **quiero** una pantalla para ver, buscar, crear y editar lugares **para** gestionarlos sin usar la API a mano.
- Pestaña «Lugares» en `/admin`: tabla con búsqueda y filtro por categoría y por «sin verificar»; despublicar y marcar como verificado; categorías (crear y editar); mensajes de error y confirmación; usa el punto único de llamadas autenticadas de HU-26.
- **Crear y editar en un diálogo:** al pulsar «Nuevo lugar» (o editar uno) se abre un diálogo **por encima de todo**, con el fondo difuminado; tiene un **título** («Nuevo lugar» / «Editar lugar»), una **X** para cerrar y también se cierra con **Esc**; contiene el formulario con todos los campos de la ficha. El foco entra al diálogo y vuelve al cerrar. Se reutiliza el componente `Modal` existente, al que se añade el difuminado del fondo.
- **Coordenadas en un mapa 2D:** el formulario muestra un mapa en vista plana (sin inclinación ni rotación) centrado en el campus; al hacer clic se coloca un marcador y se llenan latitud y longitud (que también se pueden escribir y mueven el marcador); al editar, el marcador parte de la posición actual. Se usa **Mapbox** (ya está en el proyecto, con el mismo token y estilo que el mapa público, en vista plana con rotación e inclinación desactivadas) y **no Leaflet**: Leaflet añadiría una dependencia y otro proveedor de mapa con un aspecto distinto, y no hace falta porque Mapbox permite la vista 2D. Solo se admite un punto dentro del área del campus (HU-30).
- Fuera de alcance: eventos (HU-32); móvil (HU-21).
- Depende de: HU-26 y HU-30.
- **Aceptación:** crear, editar y despublicar un lugar desde la pantalla se refleja en el mapa y en el asistente; «Nuevo lugar» abre un diálogo con título, X y Esc, sobre el resto de la pantalla y con el fondo difuminado; elegir un punto en el mapa 2D llena latitud y longitud; un error de validación se muestra junto al campo sin cerrar el diálogo.

### HU-32 · Base de datos y API de eventos ⬜
**Como** equipo, **quiero** guardar los eventos de la universidad **para** mostrarlos y consultarlos por fecha.
- Migración `V5` con `events`: `id`, título, descripción, categoría (académico, cultural, deportivo, admisión, otro), `starts_at`, `ends_at`, `all_day`, regla de recurrencia opcional, `place_id` (opcional) y `location_text` para sitios fuera del mapa, organizador, contacto, enlace, imagen, `is_published`, `created_by`, `updated_at`.
- API: `GET /api/events` (filtros `from`, `to`, `place_id`, `category`; solo publicados y no vencidos por defecto) y `GET /api/events/{id}` públicos; `POST/PUT/DELETE` solo para el administrador (HU-25); al guardar se indexa en `documents` con `source_type = event` y `expires_at` (usa la base de HU-29).
- Fuera de alcance: pantallas (HU-33 y HU-35); preguntar eventos al asistente (HU-34).
- Depende de: HU-25 y HU-29.
- **Aceptación:** un evento creado como administrador aparece en `GET /api/events` dentro de su rango de fechas y deja de aparecer al vencer; el filtro por lugar y por fecha funciona; sin token las escrituras dan 401; hay tests de integración.

### HU-33 · Eventos en la web ⬜
**Como** visitante, **quiero** ver qué eventos hay en el campus **para** saber a dónde ir.
- Sección «Eventos» con lista por día («hoy», «esta semana») y filtro por categoría; ficha del evento con fecha, lugar y enlace; botón «Ver en mapa» y «Cómo llegar» cuando el evento tiene lugar; en la ficha de un lugar, sus próximos eventos.
- Fuera de alcance: edición (HU-35); avisos o recordatorios; calendario exportable.
- Depende de: HU-28 y HU-32.
- **Aceptación:** la lista muestra los eventos de hoy y de la semana; abrir uno con lugar centra el mapa en él; la ficha de un lugar con eventos próximos los lista; sin eventos aparece un mensaje claro.

### HU-34 · El asistente responde sobre eventos ⬜
**Como** visitante, **quiero** preguntarle al asistente qué eventos hay y cuándo son **para** enterarme sin buscar.
- Detección de intención temporal («hoy», «esta semana», «cuándo es…») junto a `wants_route`; consulta SQL de `events` por fecha y por lugar, y los resultados se pasan al modelo como contexto junto con la recuperación por vectores; los eventos vencidos no se usan; si el evento tiene lugar, se devuelve como tarjeta «Ver en mapa».
- Fuera de alcance: recordatorios; crear eventos por chat.
- Depende de: HU-29 y HU-32.
- **Aceptación:** «¿qué hay hoy?» lista los eventos de hoy; «¿cuándo es la feria de libros?» responde con fecha y lugar; sin eventos próximos lo dice sin inventar; un evento pasado no se menciona.

### HU-35 · Administrar eventos (web) ⬜
**Como** administrador, **quiero** crear y editar eventos desde el panel **para** mantener la agenda del campus al día.
- Pestaña «Eventos» en `/admin`: lista con filtro (próximos, pasados, borradores); formulario con todos los campos (fechas, lugar elegido de la lista o texto libre, enlace, imagen por URL); duplicar un evento; despublicar y eliminar con confirmación; errores de validación junto al campo.
- Fuera de alcance: carga masiva; móvil (HU-21).
- Depende de: HU-26, HU-32 y HU-31 (reutiliza el formulario y el selector de lugar).
- **Aceptación:** un evento creado aquí aparece en la web (HU-33) y lo responde el asistente (HU-34); despublicarlo lo retira de ambos; una fecha de fin anterior a la de inicio se rechaza.

### HU-36 · Buscador de lugares en el servidor ⬜
**Como** visitante, **quiero** que el buscador del mapa entienda un nombre mal escrito y ordene por parecido **para** encontrar un lugar aunque no recuerde cómo se escribe.
- Endpoint público `GET /api/places/search?q=` que busca en la tabla `places` con Postgres (`pg_trgm` y `unaccent`, sin embeddings ni pgvector): sin tildes ni mayúsculas, por sigla, nombre y palabras clave, y con coincidencia aproximada («bibliotca» → Biblioteca). Solo lugares publicados.
- El buscador del mapa y los campos de «Planificar ruta» (`PlaceCombobox`) muestran al instante los resultados locales y los reemplazan por los del servidor cuando llegan; si el servidor no responde se quedan con los locales.
- Fuera de alcance: búsqueda semántica con pgvector («dónde almorzar»); búsqueda de eventos; móvil (HU-21).
- Depende de: HU-27 y HU-28.
- **Aceptación:** escribir «bibliotca» muestra la Biblioteca; un lugar despublicado no aparece; con el backend apagado el buscador sigue funcionando con la lista local.

### HU-37 · Perfil del administrador y cambio de contraseña ⬜
**Como** administrador, **quiero** ver mis datos y cambiar mi contraseña desde la pestaña «Perfil» **para** mantener mi cuenta segura sin tocar la base de datos.
- Pestaña «Perfil» (`/admin`): muestra los datos de la cuenta (usuario, fecha de alta, vencimiento de la sesión) y un botón «Cambiar contraseña» que abre un diálogo con contraseña actual, nueva y confirmación.
- Endpoint protegido `POST /api/auth/change-password`; `GET /api/auth/me` pasa a devolver también la fecha de alta.
- Fuera de alcance: recuperar una contraseña olvidada; crear o borrar otros administradores; cambiar el nombre de usuario; móvil (HU-21).
- Depende de: HU-25 y HU-26.
- **Aceptación:** con la contraseña actual correcta se cambia y se puede entrar con la nueva; con la actual incorrecta no se cambia y el diálogo lo dice junto al campo.

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
