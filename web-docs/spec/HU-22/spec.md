# HU-22 · Base de datos de lugares

- **Estado:** Implementada
- **Historia:** ver `../../histories.md#hu-22`
- **Depende de:** HU-23 (Postgres con Flyway) y HU-12 (campos de la ficha).
- **Archivos hermanos:** [plan.md](plan.md) · [task.md](task.md)

> `spec.md` dice **qué** debe hacer la historia y **cómo se comprueba**. El cómo técnico va en `plan.md` y el trabajo pendiente en `task.md`.

## 1. Contexto y objetivo
Hoy los lugares del campus están en tres copias que se mantienen a mano: `web/src/features/map/data/places.ts` (55 lugares, con ficha completa), `backend/app/knowledge/places.py` (37, sin ficha) y `frontend/…/unmsm.ts` (app móvil). Corregir un horario obliga a tocar varios archivos y redesplegar. Esta historia crea en Postgres las tablas de lugares y categorías, con campos suficientes para una ficha completa, y carga en ellas los datos actuales. Es la base para que la API, la web, el asistente y el panel de administración usen una sola fuente (HU-27 en adelante).

## 2. Alcance
**Dentro:**
- Migración nueva con las tablas `place_categories` y `places`.
- Exportación única de los datos actuales a un JSON versionado (`backend/db/seed/places.json`), tomando de cada lugar el registro con más datos; ese JSON es la semilla.
- Script de carga idempotente que lee solo ese JSON.
- Unificación de ids y tabla de equivalencias con los ids antiguos.
- Datos sin verificar marcados como tales.
- Pruebas (unitarias del script e integración contra Postgres) y documentación del backend.

**Fuera (y dónde se hace):**
- Endpoints de lectura → HU-27.
- Que la web lea la base → HU-28. Que el asistente la lea y reindexe → HU-29.
- Crear, editar o borrar lugares (API y pantalla) → HU-30 y HU-31.
- Eventos → HU-32 en adelante.
- App móvil (`frontend/`): sigue con sus datos locales.
- Subir imágenes (solo se guarda una URL, sin usarla todavía).
- Borrar `places.py`, `corpus.py` y los `.md` de origen: se retirarán más adelante, y por eso la semilla no debe depender de ellos una vez exportada.
- Verificar con la universidad los datos «demo»: se cargan sin verificar.

## 3. Requisitos
Formato: «Cuando <situación>, el sistema debe <comportamiento>».

| ID | Requisito |
|---|---|
| RF-22.1 | Una migración nueva (`V3`) debe crear `place_categories` con `id` (texto, clave primaria), `label`, `color` y `sort_order`. `V1` y `V2` no se editan. |
| RF-22.2 | La misma migración debe crear `places` con: `id` (texto, clave primaria, slug), `name` (no nulo), `short_name`, `category_id` (no nulo, referencia a `place_categories`), `lat` y `lng` (no nulos), `keywords` (lista de textos, vacía por defecto), `description`, `schedule`, `detailed_schedule` (lista de textos), `phone`, `annex`, `email`, `website`, `access_hint`, `careers` (lista), `services` (lista), `usage`, `image_url`, `parent_place_id` (opcional, referencia a `places`), `is_published` (verdadero por defecto), `verified_at` (vacío si no está verificado), `created_at`, `updated_at` y `updated_by`. |
| RF-22.3 | La base debe rechazar un lugar con latitud fuera de [-90, 90], longitud fuera de [-180, 180], un `id` que no sea un slug (minúsculas, dígitos y guiones), una categoría inexistente o un `parent_place_id` igual a su propio `id`. |
| RF-22.4 | Los campos de lista de `places` no deben aceptar nulos; la ausencia de datos se representa con lista vacía, y la de un campo opcional de texto con nulo, nunca con cadena vacía. |
| RF-22.5 | Cuando se ejecuta el script de carga, el sistema debe insertar las 9 categorías actuales (`facultades`, `cafeterias`, `auditorios`, `campos-deportivos`, `puertas`, `administracion`, `salud`, `servicios`, `otros`) con su etiqueta, color y orden. |
| RF-22.6 | Cuando se ejecuta el script de carga, el sistema debe insertar un lugar por cada lugar del JSON semilla con todos sus campos. La semilla guarda `lat` y `lng` por separado; la conversión desde `[lng, lat]` de `places.ts` ocurre en la exportación. |
| RF-22.7 | Cada lugar de la semilla debe tener un `id` slug único y estable. Los lugares que hoy ya tienen slug lo conservan; los que tienen id numérico («1»–«40») reciben un slug derivado de su nombre o sigla, y la colisión se resuelve con un sufijo numérico. |
| RF-22.8 | La exportación debe generar una tabla de equivalencias (id antiguo de la web → slug nuevo) en un archivo versionado en el repositorio, para migrar referencias existentes. |
| RF-22.9 | En la exportación, los lugares que hoy están duplicados por nombre (los ids «23» y «25», Facultad de Ingeniería Industrial) deben cargarse como un solo lugar, con ambos ids antiguos apuntando a él en la tabla de equivalencias, y la exportación debe informar la fusión. Se conservan los campos del registro que tiene más datos. |
| RF-22.10 | La exportación que genera el JSON semilla debe tomar `places.ts` como base. Cuando un lugar existe también en `places.py` (mismo slug o mismo nombre) y en `places.ts` falta su horario o sus palabras clave, debe completarlos desde `places.py`; y cuando falta la descripción y el corpus (`corpus.py`) tiene un documento con ese `place_id`, debe usar su texto. En ningún caso reemplaza un valor que `places.ts` ya trae. |
| RF-22.11 | Todos los lugares cargados deben quedar con `verified_at` vacío, porque los datos de la ficha vienen marcados como «demo». |
| RF-22.12 | El script debe ser idempotente: ejecutarlo de nuevo no duplica filas ni sobrescribe campos de un lugar que ya existe en la base, de modo que las ediciones hechas después de la carga se conservan. Lo mismo vale para las categorías: solo se insertan las que faltan. |
| RF-22.13 | Cuando un lugar del JSON semilla no es válido (sin nombre, sin categoría conocida o con coordenadas fuera de rango), el script debe cancelar toda la carga sin escribir nada y nombrar el lugar y el motivo. |
| RF-22.14 | La exportación debe imprimir un resumen: lugares exportados, fusionados, campos completados desde `places.py` o el corpus y casos en que el valor de la web difiere del de `places.py`. El script de carga debe imprimir cuántos lugares insertó y cuántos ya existían. |
| RF-22.15 | `script/dev.sh` debe tener un comando para ejecutar la carga, y `backend/README.md` debe documentar la tabla, el comando y cómo reiniciar los datos. |
| RF-22.16 | Si la base no responde o falta `DATABASE_URL`, el script debe terminar con un mensaje claro y sin traza larga. |

## 4. Escenarios de aceptación
**Escenario 1: carga inicial** (RF-22.5, RF-22.6, RF-22.7, RF-22.11)
- **Dado** la base con las migraciones aplicadas y vacía
- **Cuando** ejecuto el script de carga
- **Entonces** hay 9 categorías y un lugar por cada lugar único del JSON semilla (los de `places.ts` sin duplicados), todos con slug, con coordenadas separadas en `lat` y `lng` y con `verified_at` vacío.

**Escenario 2: ficha completa** (RF-22.6)
- **Dado** la base cargada
- **Cuando** consulto un lugar con ficha (por ejemplo la FISI)
- **Entonces** obtengo en una sola consulta su nombre, categoría, coordenadas, palabras clave, horario, teléfono, anexo, descripción, carreras y servicios iguales a los de `places.ts`.

**Escenario 3: duplicados y equivalencias** (RF-22.8, RF-22.9)
- **Cuando** reviso la tabla de equivalencias y la base
- **Entonces** los ids «23» y «25» apuntan al mismo slug, existe una sola Facultad de Ingeniería Industrial y todos los ids antiguos de la web tienen equivalencia.

**Escenario 4: idempotencia** (RF-22.12)
- **Dado** la base cargada y un horario cambiado a mano en un lugar
- **Cuando** ejecuto el script otra vez
- **Entonces** el número de filas no cambia y el horario editado se conserva.

**Escenario 5: datos inválidos** (RF-22.3, RF-22.13)
- **Cuando** intento insertar un lugar con latitud 200, con categoría inexistente o con id «Mi Lugar»
- **Entonces** la base lo rechaza; y si el origen contiene un lugar así, el script no escribe nada y nombra el lugar.

**Escenario 6: exportación con más datos** (RF-22.10, RF-22.14)
- **Dado** un lugar sin horario en `places.ts` pero con horario en `places.py`
- **Cuando** ejecuto la exportación
- **Entonces** el JSON trae ese horario, el resumen lo lista como completado, y un valor que `places.ts` ya tenía no se reemplaza.

**Escenario 7: la semilla es independiente** (RF-22.6, RF-22.13)
- **Dado** el JSON semilla ya exportado
- **Cuando** ejecuto la carga sin `places.ts`, `places.py` ni `corpus.py` disponibles
- **Entonces** la carga funciona igual.

## 5. Preguntas abiertas
Resueltas el 2026-11-12:
- **Origen de los datos:** `places.ts` es la base por tener la ficha más completa; se exporta una vez a `backend/db/seed/places.json`, completando lo que falte desde `places.py` y el corpus. Los `.md` y `corpus.py` se borrarán más adelante, así que la semilla no depende de ellos.
- **Si web y backend difieren:** gana la web.
- **`short_name` y `access_hint`:** se cargan vacíos.
- **Categorías:** tabla, para que el administrador pueda crear más (HU-30).
- **Coordenadas aproximadas:** no se marcan en esta historia; `verified_at` vacío cubre el aviso.

## 6. Historial
- 2026-11-12 · Borrador creado.
- 2026-11-12 · Aprobada. El origen pasa a ser un JSON semilla exportado una vez (RF-22.6, 22.8–22.10, 22.14); se añaden el escenario 7 y el borrado futuro de `places.py`/`corpus.py` como fuera de alcance.
- 2026-11-12 · Implementada.
