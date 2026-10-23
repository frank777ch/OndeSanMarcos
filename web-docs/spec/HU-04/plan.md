# HU-04 · Plan técnico

- **Spec:** [spec.md](spec.md)
- **Estado:** Aprobado

## 1. Enfoque
1. Ampliar `Config` con la sección `api` (dirección, timeout, mock, logs).
2. `services/api/client.ts`: cliente `fetch` con `AbortController`, errores tipados (`ApiError`) y logs.
3. `services/api/chatApi.ts`: `sendChatQuery`, que elige entre el backend y el mock y normaliza la respuesta.
4. `features/chat/mock/mockChat.ts`: respuestas simuladas a partir de `PLACES` del mapa.
5. Tipos del contrato en `features/chat/types`, que usará HU-05.

## 2. Datos y tipos
```ts
// features/chat/types/index.ts
interface LocationResult { id: string; name: string; schedule?: string }
interface Coordinate { latitude: number; longitude: number }
interface ChatResponse {
  answer: string
  locations: LocationResult[]
  drawRoute: boolean
  destination: Coordinate | null
}

// services/api/client.ts
type ApiErrorKind = 'network' | 'timeout' | 'http' | 'invalid'
class ApiError extends Error {
  kind: ApiErrorKind
  status?: number   // solo en 'http'
  detail: string    // técnico: método, URL, causa. Solo a consola (RF-04.24)
  // message = texto legible para el usuario (RF-04.12)
}
```

Forma cruda del backend (`ChatApiResponse`): `{ answer, locations?, draw_route?, destination? }`; `schedule` puede venir `null`.

**Mensajes (RF-04.12):** función `userMessageFor(kind, status)` en `client.ts`, con los cinco textos de la spec.

## 3. Archivos
| Ruta | Qué hace | Cubre |
|---|---|---|
| `web/src/config.ts` | Modifica: añade `Config.api` (`baseUrl`, `timeoutMs`, `useMockChat`) y `Config.dev.enableLogs` | RF-04.1 a RF-04.4 |
| `web/src/config.test.ts` | Modifica: tests de los valores por defecto y de cada variable | RF-04.1 a RF-04.4 |
| `web/.env.example` | Revisar que documente las tres variables | RF-04.5 |
| `web/src/services/api/client.ts` | Nuevo: `apiClient.post`, `ApiError`, `userMessageFor`, logs | RF-04.6 a RF-04.13, RF-04.23, RF-04.24 |
| `web/src/services/api/client.test.ts` | Nuevo: tests del cliente con `fetch` simulado | RF-04.6 a RF-04.13, RF-04.23, RF-04.24 |
| `web/src/services/api/chatApi.ts` | Nuevo: `sendChatQuery`, normalización, elección mock/real | RF-04.14 a RF-04.19 |
| `web/src/services/api/chatApi.test.ts` | Nuevo: tests de la normalización y del modo mock | RF-04.14 a RF-04.19 |
| `web/src/features/chat/types/index.ts` | Nuevo: tipos del chat | RF-04.15 |
| `web/src/features/chat/mock/mockChat.ts` | Nuevo: `buildMockResponse`, `mockChatQuery` | RF-04.19 a RF-04.22 |
| `web/src/features/chat/mock/mockChat.test.ts` | Nuevo: tests del mock | RF-04.20 a RF-04.22 |

## 4. Estado (stores) y comunicación
No hay stores. Flujo:

`sendChatQuery(query)` → si `Config.api.useMockChat`: `mockChatQuery(query)` (sin red) → si no: `apiClient.post('/api/chat', { query })` → normaliza → `ChatResponse`.

**Cliente:**
- `url = baseUrl + endpoint`. Timeout con `AbortController` y `setTimeout(timeoutMs)`; el temporizador se limpia en `finally` (RF-04.13).
- `fetch` lanza `TypeError` → `ApiError('network')`. `AbortError` → `'timeout'`. `!response.ok` → `'http'` con `status`. `response.json()` falla → `'invalid'`.
- Cada `ApiError` guarda `detail` con método, URL y causa; `message` es el texto legible.
- Logs: si `Config.dev.enableLogs`, `console.log('[api]', método, URL, estado, ms)` y, en fallos, `console.warn('[api]', error.detail)`. Sin logs, silencio total. El `detail` nunca sale del cliente hacia la UI (la UI solo lee `message`).

**Normalización (`chatApi.ts`):** `answer` debe ser `string`, si no `ApiError('invalid')`; `locations ?? []` con `schedule: l.schedule ?? undefined`; `drawRoute: raw.draw_route ?? false`; `destination: raw.destination ?? null`.

**Mock:** normaliza la consulta (minúsculas, sin tildes) y busca coincidencias con el nombre y las `keywords` de cada lugar de `PLACES` (los que tengan horario o descripción pueden usar `schedule`). Devuelve `{ id, name, schedule }` de los lugares encontrados. Retardo de 700 ms con `setTimeout`.

## 5. Decisiones
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| `ApiError` con `message` legible y `detail` técnico aparte | Lanzar `Error` con el texto técnico y que la UI lo traduzca | La UI no puede filtrar el detalle por error (RF-04.12, RF-04.24) |
| Sin caída automática al mock | Mock como respaldo si el backend falla | Oculta fallos y confunde al usuario (P3) |
| `Config.api.timeoutMs` fijo en 30 000 | Variable de entorno | No se pidió ajustarlo; evita otra variable |
| Mock en `features/chat/mock`, con datos de `PLACES` | Copiar los lugares de la app anterior | Los ids del mock deben existir en el mapa (RF-04.22) y `frontend/` se borra en HU-20 |
| Convertir a camelCase en `chatApi.ts` | Usar `snake_case` en toda la web | Mantiene el estilo de TypeScript y el contrato de la app anterior |
| Solo `post` en el cliente | Añadir `get`, `put`, `delete` | No hay ningún uso hoy (YAGNI) |

## 6. Estrategia de pruebas
| Requisito | Test |
|---|---|
| RF-04.1 a RF-04.4 | `config.test.ts` (valores por defecto; barra final; `true` exacto; logs solo con la variable y en desarrollo) |
| RF-04.6, RF-04.7 | `client.test.ts` (cabecera y cuerpo JSON; devuelve el JSON) |
| RF-04.8, RF-04.13 | `client.test.ts` (timeout con temporizadores falsos; se limpia el temporizador) |
| RF-04.9, RF-04.10, RF-04.11 | `client.test.ts` (tipo `network`, `http` con `status`, `invalid`) |
| RF-04.12 | `client.test.ts` (los cinco mensajes; ninguno contiene el estado ni la URL) |
| RF-04.23, RF-04.24 | `client.test.ts` (con logs, `console.log` con método, URL, estado y ms; sin logs, nada; `detail` solo en consola y no en `message`) |
| RF-04.14, RF-04.15, RF-04.16, RF-04.17 | `chatApi.test.ts` (URL y cuerpo; camelCase; `locations` ausente; `schedule` nulo; sin `answer` → `invalid`) |
| RF-04.18, RF-04.19 | `chatApi.test.ts` (con mock no se llama a `fetch`; tarda 700 ms con temporizadores falsos) |
| RF-04.20, RF-04.21, RF-04.22 | `mockChat.test.ts` (un lugar, varios, sin tildes ni mayúsculas, sin coincidencias; todos los ids existen en `PLACES`) |

Manual: escenarios 1 (backend real con `./script/dev.sh`), 4 (apagar el backend), 5 y 6 (apagar la base de datos: el backend responde 503).

## 7. Riesgos y dependencias
- **CORS.** En desarrollo el backend acepta cualquier origen (`CORS_ORIGINS=*`). Al desplegar hay que fijar el origen de la web.
- **Cambio de contrato.** Si el backend renombra campos, la normalización los deja pasar sin error (campos opcionales). Solo `answer` es obligatorio.
- **Palabras clave del mock.** Hoy salen de `PLACES.keywords`; si HU-22 las mueve a la base de datos, hay que adaptar el mock.
- **Mensajes 4xx distintos de 422.** Caen en el mensaje genérico (RF-04.12).

## 8. Historial
- 2026-10-23 · Plan creado tras aprobar la spec.
- 2026-10-23 · Ejecutado. El timeout se detecta con `controller.signal.aborted`. El mock empareja palabras completas (no subcadenas) para que siglas cortas como «pre» no den falsos positivos.
