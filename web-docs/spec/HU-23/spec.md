# HU-23 · Postgres con pgvector en Docker

- **Estado:** Aprobada
- **Historia:** ver `../../histories.md#hu-23`
- **Depende de:** ninguna historia de la web. Es trabajo de backend e infraestructura local.
- **Archivos hermanos:** [plan.md](plan.md) · [task.md](task.md)

## 1. Contexto y objetivo
El asistente (RAG) busca fragmentos del corpus por similitud de vectores en una base Postgres con la extensión pgvector. Hoy esa base es un proyecto de Supabase y el backend la consulta con el paquete `supabase` (API REST), no con SQL directo. Para desarrollar y probar el asistente completo hace falta una cuenta, internet y un proyecto que Supabase pausa por inactividad.

Esta historia pone un Postgres con pgvector en un contenedor, crea su esquema con migraciones versionadas (Flyway) y hace que el backend hable con él por SQL. Todo corre en local con `./script/dev.sh`. La única credencial externa que queda es la clave de Gemini, que ya está en `backend/.env`.

## 2. Alcance
**Dentro:**
- Servicio de base de datos y servicio de migraciones (Flyway) en `docker-compose.yml`.
- Migraciones SQL versionadas con el esquema del RAG.
- Backend: búsqueda, ingesta y subida de entradas con SQL directo (`DATABASE_URL`) en lugar del cliente de Supabase.
- **Eliminar Supabase** del proyecto: el paquete, las variables, la carpeta `supabase/` y sus menciones en el código, la configuración y la documentación del backend.
- Comandos en `script/dev.sh` para ingerir el corpus, reiniciar la base y abrir `psql`.
- Pruebas (unitarias y de integración), `.env.example`, CI y documentación del backend al día.

**Fuera (y dónde se hace):**
- Alojar Postgres en producción y desplegar → historia futura (cuando haya despliegue).
- Migrar los datos que están hoy en Supabase → no se migran: se regeneran con la ingesta.
- Cambiar el proveedor de embeddings o del modelo de lenguaje → no se hace; Gemini sigue siendo necesario para vectores y respuestas reales.
- Guardar los lugares del mapa en la base → HU-22.
- Actualizar `documents/` (describe la app móvil y menciona Supabase) → HU-20.
- Cambios en `web/` → ninguno.

## 3. Requisitos

### Base de datos y migraciones en Docker
| ID | Requisito |
|---|---|
| RF-23.1 | `docker-compose.yml` debe definir un servicio `db` con la imagen `pgvector/pgvector:pg16`, un volumen con nombre para persistir los datos y credenciales de desarrollo definidas en el propio archivo (sin secretos reales). La base debe levantarse siempre con `./script/dev.sh`, incluso en modo mock. |
| RF-23.2 | `db` debe tener una comprobación de salud (`pg_isready`). |
| RF-23.3 | Un servicio `migrate` con la imagen oficial de Flyway debe aplicar las migraciones de `backend/db/migrations` a la base una vez que esté sana, y terminar con éxito. El servicio `backend` debe esperar a que `db` esté sana y `migrate` haya terminado bien antes de arrancar. |
| RF-23.4 | Las migraciones deben ser archivos SQL versionados (`V1__…sql`, `V2__…sql`). Aplicarlas de nuevo no debe fallar ni repetir lo ya aplicado. Una migración ya aplicada no se edita: un cambio se hace con una migración nueva (Flyway detecta ediciones por checksum y falla). |
| RF-23.5 | La migración `V1` debe crear el esquema del RAG: extensión `vector`, tabla `documents` (con `embedding` de 768 dimensiones), índice HNSW por similitud coseno y función `match_documents`. No debe contener nada específico de Supabase (roles `service_role`, `grant`). |
| RF-23.6 | Los datos deben persistir al reiniciar los contenedores y borrarse solo con `./script/dev.sh clean` o con `./script/dev.sh db-reset`. |
| RF-23.7 | El puerto de Postgres debe publicarse solo en `localhost` (por defecto 5432, configurable) para que el backend pueda correr fuera de Docker. |

### Backend
| ID | Requisito |
|---|---|
| RF-23.8 | La configuración debe usar una sola variable `DATABASE_URL`. Las variables `SUPABASE_URL` y `SUPABASE_SERVICE_KEY` dejan de existir, y el paquete `supabase` deja de ser dependencia. |
| RF-23.9 | Con `RAG_USE_MOCK=false` y `DATABASE_URL` definida, la recuperación debe consultar `match_documents` por SQL y devolver el mismo formato de filas (`id`, `content`, `metadata`, `similarity`) que hoy, de modo que el motor RAG no cambie. |
| RF-23.10 | La ingesta debe reemplazar el contenido de la tabla de forma atómica (si falla a la mitad, no quedan datos a medias) y ser idempotente: ingerir dos veces deja las mismas filas, sin duplicar. |
| RF-23.11 | La subida de entradas (`upload_entries`) debe poder contar, borrar por `place_id` e insertar fragmentos con SQL, con el mismo comportamiento que hoy. |
| RF-23.12 | Con `RAG_USE_MOCK=false` y sin `DATABASE_URL`, el backend debe seguir usando la recuperación local, como hoy. |
| RF-23.13 | Con `RAG_USE_MOCK=true`, el backend no debe abrir ninguna conexión a la base; el servidor debe arrancar aunque la base esté apagada. |
| RF-23.14 | Si la base no responde o rechaza la conexión, `POST /api/chat` debe devolver 503 con un mensaje claro, sin quedarse colgado más de unos segundos. |
| RF-23.15 | Si la base está conectada pero la tabla `documents` está vacía, `POST /api/chat` debe devolver 503 con el mensaje «La base de conocimiento está vacía; ejecuta ./script/dev.sh ingest». No debe usar la búsqueda local en silencio ni ingerir por su cuenta. |

### Operación y calidad
| ID | Requisito |
|---|---|
| RF-23.16 | `./script/dev.sh` debe tener tres comandos nuevos: `ingest` (embebe el corpus y lo carga en la base, desde el contenedor del backend), `db-reset` (borra los datos y vuelve a aplicar las migraciones) y `psql` (abre una consola SQL de la base). |
| RF-23.17 | `backend/.env.example` debe documentar `DATABASE_URL` con el valor para Docker y el valor para correr fuera de Docker. El README del backend y el de la raíz deben explicar el flujo: levantar, ingerir, consultar. |
| RF-23.18 | Los tests unitarios del backend deben pasar sin base de datos, sin red y sin Gemini. Debe haber además pruebas de integración contra un Postgres real, marcadas y omitidas cuando no haya `DATABASE_URL`, que se ejecuten en `./script/dev.sh test` y en la CI. |
| RF-23.19 | La ingesta y la búsqueda con el Postgres local deben funcionar con la clave de Gemini ya configurada en `backend/.env`. |

## 4. Escenarios de aceptación
**Escenario 1: levantar todo desde cero** (RF-23.1 a RF-23.5)
- **Cuando** ejecuto `./script/dev.sh` con un volumen nuevo
- **Entonces** la base queda sana, Flyway aplica `V1`, el backend arranca después y la web responde en `:5173`.

**Escenario 2: migraciones repetibles** (RF-23.4)
- **Cuando** reinicio con `./script/dev.sh down` y `./script/dev.sh`
- **Entonces** Flyway no reaplica nada y termina bien.

**Escenario 3: ingerir** (RF-23.10, RF-23.16, RF-23.19)
- **Dado** `LLM_PROVIDER=gemini`, la clave configurada y la base migrada
- **Cuando** ejecuto `./script/dev.sh ingest`
- **Entonces** veo cuántos fragmentos se cargaron y la tabla `documents` los contiene.

**Escenario 4: consultar con vectores** (RF-23.9)
- **Dado** `RAG_USE_MOCK=false` y el corpus ingerido
- **Cuando** envío `POST /api/chat` con «¿Dónde queda la biblioteca central?»
- **Entonces** la respuesta menciona la Biblioteca Central e incluye su lugar en `locations`, usando la búsqueda por vectores del contenedor.

**Escenario 5: idempotencia** (RF-23.10)
- **Cuando** ingiero dos veces seguidas
- **Entonces** el número de filas es el mismo, no el doble.

**Escenario 6: ingesta que falla a la mitad** (RF-23.10)
- **Dado** que la ingesta falla antes de terminar
- **Entonces** la tabla conserva los datos anteriores intactos.

**Escenario 7: persistencia y reinicio** (RF-23.6)
- **Cuando** ejecuto `./script/dev.sh down` y luego `./script/dev.sh`
- **Entonces** los datos siguen cargados; tras `./script/dev.sh db-reset` la tabla existe y está vacía.

**Escenario 8: base vacía** (RF-23.15)
- **Dado** una base recién migrada sin ingesta y `RAG_USE_MOCK=false`
- **Cuando** envío una consulta
- **Entonces** recibo 503 con «La base de conocimiento está vacía; ejecuta ./script/dev.sh ingest».

**Escenario 9: base caída** (RF-23.14)
- **Dado** que detengo el contenedor `db` con el backend en marcha y `RAG_USE_MOCK=false`
- **Cuando** envío una consulta
- **Entonces** recibo 503 con un mensaje claro en pocos segundos.

**Escenario 10: modo mock** (RF-23.13)
- **Dado** `RAG_USE_MOCK=true` y la base detenida
- **Cuando** envío una consulta
- **Entonces** el backend responde normalmente.

**Escenario 11: subir entradas** (RF-23.11)
- **Cuando** subo una entrada aprobada con `upload_entries`
- **Entonces** sus fragmentos quedan en la tabla y, si el `place_id` ya existía, los anteriores se reemplazan.

**Escenario 12: Supabase eliminado** (RF-23.8)
- **Cuando** busco `supabase` en `backend/` (código, requisitos, `.env.example`) y en `docker-compose.yml`
- **Entonces** no aparece, salvo en `RESUMEN-AVANCE.md`, que es un registro histórico.

**Escenario 13: tests** (RF-23.18)
- **Cuando** ejecuto `./script/dev.sh test`
- **Entonces** pasan los tests unitarios del backend, las pruebas de integración contra la base y los tests de la web.

## 5. Preguntas abiertas
- Ninguna. Decisiones: **solo `DATABASE_URL` y eliminar Supabase** (P1), **migraciones con Flyway** como servicio de Docker (P2), **503 con mensaje claro si la base está vacía** (P3) y **la base se levanta siempre** (P4).

## 6. Historial
- 2026-10-23 · Borrador creado con preguntas abiertas.
- 2026-10-23 · Preguntas resueltas. P2 pasó de «cómo cargar el esquema» a «qué herramienta de migraciones»: Flyway. Spec aprobada.
