# HU-05 · Plan técnico

- **Spec:** [spec.md](spec.md)
- **Estado:** Ejecutado

## 1. Enfoque
1. Un store de chat en memoria (`useChatStore`) guarda los mensajes y la consulta en curso. Vive fuera de los componentes para que la conversación sobreviva al cambio Mapa ↔ Asistente (RF-05.23) y para que una respuesta que llega con el usuario en el mapa no se pierda.
2. El store llama a `sendChatQuery` de HU-04; esta historia no toca el cliente HTTP.
3. `ChatPage` arma la columna: lista de mensajes (con scroll propio) y `ChatInput` fijo abajo.
4. Cada respuesta se muestra con `AssistantMessage` (texto + `PlaceLinkCard` por lugar). El botón llama a `selectPlace(id, 'other')` del store del mapa y navega a `/mapa`.
5. El vuelo ya existe (`FlyToSelection`). No hay que tocar el mapa: `MapPage` se desmonta al salir de `/mapa`, así que al volver arranca en la vista del campus y el efecto vuela a la selección (RF-05.19 a RF-05.21).

## 2. Datos y tipos
Tipos del contrato (los define HU-04 en `features/chat/types`; se usan tal cual):

```ts
interface LocationResult { id: string; name: string; schedule?: string | null }
interface ChatResponse { answer: string; locations: LocationResult[]; drawRoute: boolean; destination: Coordinate | null }
```

`drawRoute` y `destination` se ignoran (fuera de alcance: HU-13/14).

Tipos propios del chat:

```ts
type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; text: string; places: LocationResult[] }

type ChatStatus = 'idle' | 'sending' | 'error'
```

`places` ya viene filtrado: solo lugares cuyo id existe en `PLACES` (RF-05.18). El filtro se aplica al guardar la respuesta, no al pintar, para que el test del store lo cubra.

## 3. Archivos
| Ruta | Qué hace | Cubre |
|---|---|---|
| `web/src/features/chat/store/useChatStore.ts` | Nuevo: `messages`, `status`, `error`, `lastQuery`; acciones `send(text)`, `retry()` | RF-05.1, RF-05.4 a RF-05.6, RF-05.10, RF-05.11, RF-05.18, RF-05.23 |
| `web/src/features/chat/utils/query.ts` | Nuevo: `normalizeQuery(text)` (recorta y valida 1–1000) | RF-05.3, RF-05.6 |
| `web/src/features/chat/components/ChatInput.tsx` | Nuevo: textarea que crece hasta 6 líneas, Enter/Shift+Enter, botón «Enviar», foco | RF-05.1 a RF-05.4, RF-05.6, RF-05.15, RF-05.25, RF-05.27 |
| `web/src/features/chat/components/MessageList.tsx` | Nuevo: región `aria-live`, mensajes, indicador, error, botón «Ir al último mensaje» | RF-05.8, RF-05.10, RF-05.13, RF-05.14, RF-05.27 |
| `web/src/features/chat/hooks/useStickToBottom.ts` | Nuevo: scroll al final salvo que el usuario esté a más de 120 px | RF-05.13, RF-05.14 |
| `web/src/features/chat/components/UserMessage.tsx` | Nuevo: burbuja a la derecha | RF-05.26 |
| `web/src/features/chat/components/AssistantMessage.tsx` | Nuevo: texto con saltos de línea y lista de tarjetas | RF-05.5, RF-05.7, RF-05.16, RF-05.17, RF-05.26 |
| `web/src/features/chat/components/PlaceLinkCard.tsx` | Nuevo: tarjeta (icono, nombre, horario cortado) y botón «Ver en el mapa» | RF-05.16, RF-05.19, RF-05.22, RF-05.27 |
| `web/src/features/chat/components/TypingIndicator.tsx` | Nuevo: «escribiendo…» (tres puntos animados, `role="status"`) | RF-05.8 |
| `web/src/features/chat/components/ChatError.tsx` | Nuevo: mensaje de error + «Reintentar» | RF-05.10, RF-05.11 |
| `web/src/features/chat/components/ChatWelcome.tsx` | Nuevo: texto de bienvenida del chat vacío | RF-05.12 |
| `web/src/pages/ChatPage.tsx` | Modifica: columna de 48 rem, sin scroll de página | RF-05.24, RF-05.25 |
| `web/src/features/map/store/useMapStore.ts` | Sin cambios de código (se reutiliza `selectPlace`); se añade un test | RF-05.19, RF-05.22 |
| `web/src/features/map/components/FlyToSelection.test.tsx` | Modifica: test de que un remonte con selección `other` vuela de nuevo | RF-05.20, RF-05.21 |
| `web/src/features/map/components/PlaceSearch.tsx` | Modifica: el campo arranca con el nombre del lugar ya elegido | RF-05.19 (con RF-12.18) |

## 4. Estado (stores) y comunicación
`useChatStore` (zustand, **sin** `persist`; HU-07 lo añade):

- `send(text)`:
  1. `normalizeQuery(text)`; si es vacío o `status === 'sending'`, no hace nada (RF-05.3, RF-05.4).
  2. Añade el mensaje del usuario, guarda `lastQuery`, pone `status = 'sending'` y `error = null`.
  3. Espera `sendChatQuery(query)`. Si responde, añade el mensaje del asistente con los lugares filtrados y `status = 'idle'`. Si falla, `status = 'error'` y `error = error.message` (el texto legible de `ApiError`, HU-04). El detalle técnico no se guarda en el store ni se muestra.
- `retry()`: solo si `status === 'error'`. Repite `lastQuery` sin añadir otro mensaje del usuario (RF-05.11).
- El store guarda un id de petición; una respuesta que llega después de otra más nueva (no puede pasar con RF-05.4, pero protege el reintento) se descarta.

**Pantalla:** `ChatPage` lee `messages`, `status`, `error`. `MessageList` muestra, después de los mensajes, `TypingIndicator` si `sending` o `ChatError` si `error`.

**Tarjeta → mapa:** `PlaceLinkCard` hace `useMapStore.getState().selectPlace(id, 'other')` y luego `navigate('/mapa')`. `selectPlace` ya quita el filtro que oculte el lugar (RF-05.22) y deja el origen `other`, así que `FlyToSelection` vuela y `PlaceCard` abre la ficha al montar el mapa.

**Foco:** `ChatInput` enfoca el textarea al montar y cuando `status` pasa de `sending` a `idle` o `error` (RF-05.15).

**Scroll (`useStickToBottom`):** guarda si el usuario estaba a ≤ 120 px del final antes de que cambie el contenido. Si estaba cerca, baja al final (`scrollTo` con `behavior: 'smooth'`, o `auto` con `prefers-reduced-motion`); si no, muestra «Ir al último mensaje». Un mensaje propio siempre baja al final (RF-05.13).

## 5. Decisiones
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Chat en un store de zustand | Estado en `ChatPage` | `ChatPage` se desmonta al ir al mapa; el store conserva la conversación (RF-05.23) y HU-07 solo añade `persist` |
| Reutilizar `selectPlace` y el vuelo existente | Un contador `flyNonce` para forzar el vuelo | `MapPage` se desmonta al salir de `/mapa`, así que cada visita vuela sola (RF-05.21). Si más adelante el mapa deja de desmontarse (vista dividida), se añade el contador |
| Filtrar los ids desconocidos al guardar la respuesta | Filtrar al pintar | Se prueba en el store y la tarjeta puede asumir que el lugar existe |
| Texto del asistente con `white-space: pre-wrap` | Renderizar Markdown | El backend devuelve texto plano; Markdown abre XSS y no se pidió |
| `textarea` con altura calculada por `scrollHeight` | `contenteditable` | Más simple, accesible y compatible con Enter/Shift+Enter |
| Estilos con Tailwind y las variables de `index.css` | CSS Modules | Es lo que usa el resto de la web; el tema claro/oscuro sale de las variables (RF-05.28) |
| Sin `AbortController` al salir del chat | Cancelar la consulta al desmontar | La respuesta se guarda en el store aunque el usuario esté en el mapa |
| Un solo mensaje de error en el lugar de la respuesta | Toast | El usuario ve a qué pregunta corresponde y tiene «Reintentar» a mano |

## 6. Estrategia de pruebas
`sendChatQuery` se simula con `vi.mock`; los componentes del mapa no se montan (se prueba el store y el router en memoria).

| Requisito | Test |
|---|---|
| RF-05.3, RF-05.6 | `utils/query.test.ts` (vacío, solo espacios, recorte, 1000 caracteres) |
| RF-05.1, RF-05.5 | `store/useChatStore.test.ts` (añade usuario y asistente en orden) |
| RF-05.4 | `store/useChatStore.test.ts` (un segundo `send` con `sending` no llama al cliente) |
| RF-05.10, RF-05.11 | `store/useChatStore.test.ts` (fallo → `error`; `retry` repite la consulta sin duplicar el mensaje) |
| RF-05.18 | `store/useChatStore.test.ts` (lugares con id desconocido se descartan) |
| RF-05.23 | `store/useChatStore.test.ts` (el estado sobrevive entre montajes: se lee desde el store) |
| RF-05.2, RF-05.3, RF-05.4, RF-05.6, RF-05.15, RF-05.25, RF-05.27 | `components/ChatInput.test.tsx` (Enter envía, Shift+Enter no, deshabilitado vacío/enviando, `maxLength`, foco, nombre «Enviar») |
| RF-05.5, RF-05.7, RF-05.16, RF-05.17, RF-05.26 | `components/AssistantMessage.test.tsx` (texto con saltos de línea, tarjetas en orden, sin tarjetas) |
| RF-05.16, RF-05.19, RF-05.22, RF-05.27 | `components/PlaceLinkCard.test.tsx` (nombre y horario; el botón elige el lugar con origen `other`, quita el filtro y navega a `/mapa`; nombre accesible con el lugar) |
| RF-05.8, RF-05.10, RF-05.12, RF-05.27 | `components/MessageList.test.tsx` (indicador, error con «Reintentar», bienvenida con chat vacío, `aria-live`) |
| RF-05.13, RF-05.14 | `hooks/useStickToBottom.test.tsx` (baja al final cerca del fondo; no baja y muestra el botón si está lejos; el botón baja) |
| RF-05.20, RF-05.21 | `map/components/FlyToSelection.test.tsx` (con selección `other`, desmontar y montar de nuevo vuela otra vez) |
| RF-05.12, RF-05.23, RF-05.24 | `pages/ChatPage.test.tsx` (bienvenida; la conversación sigue al desmontar y volver a montar la página) |

Manual (requiere token de Mapbox y el backend o `VITE_USE_MOCK_CHAT=true`): escenarios 7 (vuelo y ficha), 12, 13, 14, 15 y 16 (lector de pantalla y teclado). El 6 se prueba apagando el backend.

## 7. Riesgos y dependencias
- **Depende de HU-04.** Sin `sendChatQuery` ni modo mock no se puede empezar la T3. Si HU-04 sigue pendiente, se hace primero.
- **Ids del backend vs. mapa.** Los ids de `locations` vienen de `backend/app/knowledge`; los del mapa, de `data/places.ts`. Hoy coinciden porque los dos salen de la app anterior. HU-22/HU-23 mueven los datos a la base de datos y deben conservar los ids. Un id que no coincida se omite (RF-05.18), así que la respuesta se ve pero sin tarjeta.
- **Vuelo con el mapa recién cargado.** `FlyToSelection` llama a `flyTo` en cuanto el mapa existe, quizá antes de que termine de cargar el estilo. `flyTo` funciona antes de la carga, pero hay que verlo a mano (escenario 7); si la animación se corta, se espera al evento `load`.
- **Texto largo sin espacios** (URLs) puede desbordar la columna: usar `overflow-wrap: anywhere`.
- **Esperas largas.** Sin aviso de arranque en frío, una consulta lenta solo muestra «escribiendo…»; el tiempo máximo lo fija el timeout de HU-04.

## 8. Historial
- 2026-10-23 · Plan creado tras aprobar la spec (sin aviso de servidor despertando).
- 2026-10-23 · Ejecutado. Cambios sobre el plan: «escribiendo…» usa `animate-pulse` de Tailwind (sin tocar `index.css`); `useStickToBottom` expone `away` y el botón «Ir al último mensaje» se muestra siempre que el usuario esté lejos del final; `PlaceSearch` arranca con el lugar elegido para que el campo no quede vacío al llegar desde el chat. Los tests de `FlyToSelection` cubren el remonte; no hizo falta tocar el store del mapa.
