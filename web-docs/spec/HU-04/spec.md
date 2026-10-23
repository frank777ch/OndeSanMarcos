# HU-04 · Conexión con el backend

- **Estado:** Implementada
- **Historia:** ver `../../histories.md#hu-04`
- **Depende de:** HU-02 (proyecto base y variables `VITE_*`), HU-10 (lista de lugares, la usa el modo mock)
- **Archivos hermanos:** [plan.md](plan.md) · [task.md](task.md)

> `spec.md` dice **qué** debe hacer la historia y **cómo se comprueba**. El cómo técnico va en `plan.md` y el trabajo pendiente en `task.md`.

## 1. Contexto y objetivo
La web habla con un solo servicio: el backend FastAPI, que corre en local con Docker (`http://localhost:8000`). Antes de construir el chat (HU-05) hace falta una forma única de llamarlo: configuración central, un cliente que no deje la pantalla colgada y errores que el usuario pueda leer.

También hace falta un **modo mock** para trabajar el chat sin backend ni llaves de Gemini.

## 2. Alcance
**Dentro:**
- Configuración de la API leída de las variables de entorno (dirección, tiempo máximo, modo mock, logs).
- Cliente HTTP con tiempo máximo y errores clasificados con mensaje legible en español.
- Función `sendChatQuery` para `POST /api/chat` que devuelve la respuesta ya normalizada.
- Modo mock que responde a partir de los lugares del mapa, sin red.
- Logs de red opcionales en desarrollo.

**Fuera (y dónde se hace):**
- Pantalla del chat, mostrar el error y «Reintentar» → HU-05.
- Reintentos automáticos: no se hacen; reintenta el usuario (HU-05).
- Autenticación: la web no tiene login.
- Respuestas en streaming: el backend responde completo.
- Revisar `GET /health` o mostrar el estado del backend: no se pidió.
- Restringir CORS en producción → al desplegar. En desarrollo el backend acepta cualquier origen.

## 3. Requisitos

### Configuración
| ID | Requisito |
|---|---|
| RF-04.1 | La dirección del backend debe leerse de `VITE_API_URL`; si falta o está vacía, debe ser `http://localhost:8000`. Las barras `/` al final se quitan. |
| RF-04.2 | El tiempo máximo de espera de una petición debe ser de 30 segundos. |
| RF-04.3 | El modo mock debe estar activo solo cuando `VITE_USE_MOCK_CHAT` vale exactamente `true`. |
| RF-04.4 | Los logs de red deben estar activos solo cuando `VITE_ENABLE_DEV_LOGS` vale `true` y la app corre en modo desarrollo. |
| RF-04.5 | `web/.env.example` debe documentar `VITE_API_URL`, `VITE_USE_MOCK_CHAT` y `VITE_ENABLE_DEV_LOGS` sin valores secretos. *(Ya existe desde HU-02; se comprueba que siga al día.)* |

### Cliente HTTP
| ID | Requisito |
|---|---|
| RF-04.6 | Cuando se envía un cuerpo, el cliente debe mandarlo como JSON con `Content-Type: application/json`. |
| RF-04.7 | Cuando el servidor responde con éxito (2xx), el cliente debe devolver el JSON de la respuesta. |
| RF-04.8 | Cuando la petición pasa de 30 segundos, el cliente debe cancelarla y fallar con un error de tipo `timeout`. |
| RF-04.9 | Cuando no hay conexión con el servidor (apagado, sin red, CORS), el cliente debe fallar con un error de tipo `network`. |
| RF-04.10 | Cuando el servidor responde con un estado que no es 2xx, el cliente debe fallar con un error de tipo `http` que conserve el número de estado. |
| RF-04.11 | Cuando una respuesta 2xx no es JSON válido, el cliente debe fallar con un error de tipo `invalid`. |
| RF-04.12 | Todo error del cliente debe traer un mensaje en español pensado para el usuario, sin números de estado, direcciones ni texto técnico. Mensajes: `network` → «No pudimos conectarnos con el asistente. Revisa tu conexión e inténtalo de nuevo.»; `timeout` → «El asistente tardó demasiado en responder. Inténtalo de nuevo.»; `http` 503 → «El asistente no está disponible por ahora. Inténtalo en unos minutos.»; `http` 422 → «Tu pregunta no es válida. Escríbela con entre 1 y 1000 caracteres.»; cualquier otro `http` o `invalid` → «El asistente tuvo un problema. Inténtalo de nuevo.» |
| RF-04.13 | El tiempo máximo no debe quedar activo después de terminar la petición (sin temporizadores colgados). |

### Consulta al asistente
| ID | Requisito |
|---|---|
| RF-04.14 | `sendChatQuery(query)` debe hacer `POST` a `<VITE_API_URL>/api/chat` con el cuerpo `{ "query": <texto> }`. |
| RF-04.15 | `sendChatQuery` debe devolver `answer` (texto), `locations` (lista de `{ id, name, schedule? }`), `drawRoute` (booleano, `false` si no viene) y `destination` (`{ latitude, longitude }` o `null`). Los nombres del backend en `snake_case` (`draw_route`) se convierten a `camelCase`. |
| RF-04.16 | Cuando el backend no envía `locations`, el resultado debe traer una lista vacía; cuando `schedule` viene `null`, el lugar no debe tener horario. |
| RF-04.17 | Cuando la respuesta no trae `answer` como texto, `sendChatQuery` debe fallar con un error de tipo `invalid`. |

### Modo mock
| ID | Requisito |
|---|---|
| RF-04.18 | Con el modo mock activo, `sendChatQuery` no debe hacer ninguna petición de red. |
| RF-04.19 | Con el modo mock activo, la respuesta debe tardar unos 700 ms, para que se vea el indicador «escribiendo…». |
| RF-04.20 | Cuando la consulta nombra un lugar del mapa (por su nombre, sigla o palabra clave, sin importar mayúsculas ni tildes), el mock debe responder con un texto y devolver ese lugar en `locations` con su `id`, `name` y `schedule`; si nombra varios, devuelve todos. |
| RF-04.21 | Cuando la consulta no nombra ningún lugar, el mock debe responder con un texto que diga que es una respuesta de demostración y con `locations` vacío. |
| RF-04.22 | Los `id` que devuelve el mock deben existir en la lista de lugares del mapa. |

### Logs
| ID | Requisito |
|---|---|
| RF-04.24 | Todo error del cliente debe llevar, aparte del mensaje, el detalle técnico (estado, dirección y causa). Ese detalle no debe mostrarse nunca en la pantalla: solo se escribe en la consola cuando los logs están activos. |
| RF-04.23 | Con los logs activos, el cliente debe escribir en consola, por cada petición, el método, la dirección, el estado o el tipo de error y la duración. Con los logs apagados no debe escribir nada. |

## 4. Escenarios de aceptación
**Escenario 1: respuesta real** (RF-04.14, RF-04.15)
- **Dado** que el backend corre en `http://localhost:8000` y el mock está apagado
- **Cuando** llamo a `sendChatQuery('¿Dónde queda la biblioteca?')`
- **Entonces** recibo un texto y una lista de lugares, y `drawRoute` es `false` o `true` según el backend.

**Escenario 2: respuesta simulada** (RF-04.18 a RF-04.20)
- **Dado** `VITE_USE_MOCK_CHAT=true` y el backend apagado
- **Cuando** llamo a `sendChatQuery('quiero ir a la biblioteca')`
- **Entonces** tras unos 700 ms recibo la Biblioteca Central en `locations` y no hubo ninguna petición de red.

**Escenario 3: consulta sin lugar en el mock** (RF-04.21)
- **Cuando** consulto «hola» con el mock activo
- **Entonces** recibo una respuesta de demostración sin lugares.

**Escenario 4: backend apagado** (RF-04.9, RF-04.12)
- **Dado** que el backend está apagado
- **Cuando** llamo a `sendChatQuery`
- **Entonces** falla con tipo `network` y el mensaje «No pudimos conectarnos con el asistente…».

**Escenario 5: tiempo agotado** (RF-04.8, RF-04.12, RF-04.13)
- **Dado** que el backend no responde en 30 segundos
- **Entonces** la petición se cancela y falla con tipo `timeout` y el mensaje de tiempo agotado.

**Escenario 6: base de datos caída** (RF-04.10, RF-04.12)
- **Dado** que el backend responde 503 (sin base de datos)
- **Entonces** falla con tipo `http` y el mensaje «El asistente no está disponible por ahora…», sin mostrar «503».

**Escenario 7: pregunta inválida** (RF-04.10, RF-04.12)
- **Dado** que el backend responde 422
- **Entonces** el mensaje pide una pregunta de entre 1 y 1000 caracteres.

**Escenario 8: respuesta rara** (RF-04.11, RF-04.17)
- **Dado** que el servidor responde 200 con un cuerpo que no es JSON, o sin `answer`
- **Entonces** falla con tipo `invalid` y el mensaje genérico.

**Escenario 9: configuración** (RF-04.1 a RF-04.4)
- **Cuando** no defino ninguna variable
- **Entonces** la dirección es `http://localhost:8000`, el mock está apagado y el tiempo máximo es 30 s; con `VITE_API_URL=http://x:8000/` la dirección queda `http://x:8000`.

**Escenario 10: logs** (RF-04.23)
- **Dado** `VITE_ENABLE_DEV_LOGS=true` en desarrollo
- **Cuando** envío una consulta
- **Entonces** veo una línea en la consola con método, dirección, estado y duración; con la variable en `false`, ninguna.

## 5. Preguntas abiertas
- Ninguna. Decisiones: **30 s** de tiempo máximo (P1), **mensajes de RF-04.12** (P2), **sin caída al mock** y **el error técnico solo en consola o logs, nunca en pantalla** (P3), y **`/api/chat`** (P4).

## 6. Historial
- 2026-10-23 · Borrador creado con preguntas abiertas.
- 2026-10-23 · Preguntas resueltas. Se añadió RF-04.24 (el detalle técnico del error solo va a la consola). Spec aprobada.
- 2026-10-23 · Implementado (tests, build y lint en verde).
- 2026-10-23 · Escenarios 1, 4, 5 y 6 verificados contra el backend de Docker.
