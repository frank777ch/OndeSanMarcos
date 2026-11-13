# HU-36 · Buscador de lugares en el servidor

- **Estado:** Aprobada
- **Historia:** ver `../../histories.md#hu-36`
- **Depende de:** HU-27 (API pública de lugares) y HU-28 (la web lee la API).
- **Archivos hermanos:** [plan.md](plan.md) · [task.md](task.md)

## 1. Contexto y objetivo
El buscador del mapa filtra en el navegador una copia de `places` y solo coincide por subcadena exacta: «bibliotca» no encuentra la Biblioteca. Esta historia agrega una búsqueda en el servidor, con Postgres, que ignora tildes y mayúsculas y tolera errores de escritura. Se decidió **no usar pgvector**: un embedding por búsqueda costaría latencia y cuota de Gemini, y con ~54 lugares la ventaja real es la tolerancia a errores y el orden por parecido, no la velocidad.

## 2. Alcance
**Dentro:** endpoint `GET /api/places/search`; consulta con `pg_trgm` y `unaccent`; uso desde `PlaceCombobox` (buscador del mapa y «Planificar ruta») con respaldo local; pruebas y documentación.
**Fuera:** búsqueda semántica con pgvector; búsqueda de eventos; índices GIN (con decenas de filas un escaneo es más barato; se agregan si el catálogo crece); móvil (HU-21).

## 3. Requisitos
### API
| ID | Requisito |
|---|---|
| RF-36.1 | `GET /api/places/search?q=<texto>` debe ser público (sin autenticación) y responder 200 con una lista de lugares con los mismos campos que `GET /api/places`. |
| RF-36.2 | Solo debe devolver lugares publicados. Un lugar despublicado no aparece. |
| RF-36.3 | La búsqueda no debe distinguir mayúsculas ni tildes, y debe mirar el nombre, el nombre corto (sigla) y las palabras clave. |
| RF-36.4 | Los resultados deben ordenarse por niveles: (0) sigla o palabra clave exacta, (1) el nombre empieza con el texto, (2) el nombre lo contiene, (3) una palabra clave lo contiene, (4) coincidencia aproximada. Dentro de un nivel, por parecido descendente y luego por nombre. |
| RF-36.5 | Debe tolerar errores de escritura: «bibliotca» encuentra la Biblioteca. La coincidencia aproximada solo se aplica a textos de 3 o más caracteres, para no devolver ruido. |
| RF-36.6 | `q` debe tener entre 2 y 100 caracteres (después de recortar espacios). Con menos de 2 caracteres la lista es vacía (200); con más de 100, 422. |
| RF-36.7 | Debe devolver como máximo 8 lugares; el parámetro opcional `limit` (1 a 20) cambia ese máximo. |
| RF-36.8 | Una consulta sin coincidencias debe responder 200 con lista vacía. |
| RF-36.9 | La respuesta debe llevar `ETag` y `Cache-Control: public, max-age=60` como el resto de la API pública (HU-27), y 304 con `If-None-Match` coincidente. |
| RF-36.10 | Si la base no responde, 503 con un mensaje claro. |
| RF-36.11 | La ruta no debe confundirse con `GET /api/places/{id}`: `search` no es un id de lugar. |
| RF-36.12 | Debe aparecer en `/docs` con descripción de parámetros y respuestas. |

### Web
| ID | Requisito |
|---|---|
| RF-36.13 | Al escribir en `PlaceCombobox` (2 o más caracteres), el sistema debe mostrar de inmediato los resultados de la búsqueda local. |
| RF-36.14 | Después de 200 ms sin escribir, el sistema debe pedir la búsqueda al servidor y, cuando llegue la respuesta **de esa misma consulta**, reemplazar la lista. Una respuesta de una consulta anterior se descarta. |
| RF-36.15 | Al seguir escribiendo, la petición anterior debe cancelarse. |
| RF-36.16 | Si el servidor no responde o falla, el sistema debe quedarse con los resultados locales, sin mostrar ningún error. |
| RF-36.17 | Un lugar que devuelva el servidor y no esté en la lista cargada (por ejemplo, creado hace un momento) debe poder elegirse igualmente. |
| RF-36.18 | El comportamiento de elegir, limpiar, teclado, opciones fijas («Mi ubicación») y mensaje «sin resultados» de `PlaceCombobox` no debe cambiar. |

## 4. Escenarios de aceptación
**Escenario 1: error de escritura** (RF-36.5, RF-36.14)
- **Cuando** escribo «bibliotca» en el buscador del mapa
- **Entonces** primero no veo coincidencias locales y, un instante después, aparece la Biblioteca.

**Escenario 2: sin tildes ni mayúsculas** (RF-36.3)
- **Cuando** pido `GET /api/places/search?q=INGENIERIA`
- **Entonces** recibo las facultades de ingeniería, con la FISI entre ellas.

**Escenario 3: despublicado** (RF-36.2)
- **Cuando** despublico un lugar desde `/admin` y lo busco por su nombre
- **Entonces** no aparece, ni en el servidor ni en el buscador.

**Escenario 4: sin conexión** (RF-36.16)
- **Cuando** el backend está apagado y escribo en el buscador
- **Entonces** sigo viendo los resultados locales y ningún error.

**Escenario 5: orden** (RF-36.4)
- **Cuando** busco una sigla exacta que además aparece dentro de otros nombres
- **Entonces** el lugar con esa sigla sale primero.

## 5. Preguntas abiertas
Resueltas el 2026-11-12:
- **¿pgvector?** No: Postgres con `pg_trgm` y `unaccent`, sin embeddings (decidido por el usuario).
- **¿Reemplazar la búsqueda local?** No: se conserva como respuesta inmediata y respaldo sin conexión.

## 6. Historial
- 2026-11-12 · Spec creada y aprobada.
- 2026-11-12 · Código implementado y probado. Pendiente la verificación manual en el navegador. El aviso «sin resultados» espera la respuesta del servidor (RF-36.18 matizado).
