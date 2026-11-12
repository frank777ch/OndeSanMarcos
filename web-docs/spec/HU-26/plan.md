# HU-26 · Plan técnico

- **Spec:** [spec.md](spec.md)
- **Estado:** Ejecutado

## 1. Enfoque
1. `useAuthStore` (zustand) guarda la sesión (token y vencimiento) en `sessionStorage` y expone `login`, `logout` y la marca `expired`.
2. El cliente HTTP actual solo hace `POST` y sus mensajes son del asistente. Se amplía con `GET`, cabeceras opcionales y `retryAfterSeconds` en `ApiError`, sin cambiar lo que ya usa el chat.
3. `authApi` hace el login (sin token). `adminClient` es el **único punto autenticado**: añade `Authorization: Bearer`, y ante un 401 cierra la sesión con `expired` (RF-26.17, RF-26.18). `GET /api/auth/me` pasa por él.
4. La barra lateral de `AppLayout` se extrae a `SidebarShell`, que recibe los enlaces y un pie opcional. `AppLayout` y `AdminLayout` la usan, así el comportamiento es idéntico (RF-26.15, RF-26.21).
5. `/admin/login` queda fuera de ambos layouts (pantalla sola, sin la barra de visitantes). `/admin` va dentro de `AdminGuard` + `AdminLayout`.

## 2. Datos y tipos
```ts
interface AdminSession {
  token: string
  expiresAt: number // ms desde epoch: Date.now() + expires_in * 1000
}

interface AuthState {
  session: AdminSession | null
  expired: boolean          // true si la sesión se cerró por rechazo del servidor
  login(username: string, password: string): Promise<void>
  logout(reason?: 'expired'): void
  clearExpired(): void
}
```
- Clave de `sessionStorage`: `osm:admin-session`, siempre con `try/catch` (como hace `AppLayout` con `localStorage`). Al leer, una sesión con `expiresAt <= Date.now()` se descarta (RF-26.11).
- La contraseña solo vive en el estado del formulario; nunca llega al store ni al almacenamiento (RF-26.10).
- Respuesta del login (snake_case del backend): `{ access_token, token_type, expires_in }`; se convierte a `AdminSession` en `authApi`.
- `ApiError` gana `retryAfterSeconds?: number`, leído de la cabecera `Retry-After`.
- Mensajes del login (en la pantalla, no en `userMessageFor`, que habla del asistente): 401 → «Usuario o contraseña incorrectos»; 429 → «Demasiados intentos. Espera N min e inténtalo de nuevo.»; el resto → «No se pudo conectar con el servidor. Intenta de nuevo.»

## 3. Archivos
| Ruta | Qué hace | Cubre |
|---|---|---|
| `src/services/api/client.ts` | Añade `get`, cabeceras opcionales y `retryAfterSeconds`; el comportamiento del chat no cambia | RF-26.6, RF-26.18 |
| `src/features/admin/types.ts` | `AdminSession` y tipos de la API de autenticación | — |
| `src/features/admin/store/useAuthStore.ts` | Sesión, `login`, `logout`, `expired`, persistencia en `sessionStorage` | RF-26.4, 26.9 a 26.11, 26.16 |
| `src/services/api/authApi.ts` | `loginRequest(username, password)` | RF-26.4 a 26.7 |
| `src/services/api/adminClient.ts` | Único punto autenticado: añade el token y cierra la sesión ante 401; `fetchMe()` | RF-26.14, 26.17, 26.18 |
| `src/layouts/SidebarShell.tsx` | La barra lateral contraíble extraída de `AppLayout` (enlaces y pie por props) | RF-26.15, 26.21 |
| `src/layouts/AppLayout.tsx` | Usa `SidebarShell` con Mapa y Asistente; sin cambios visibles | RF-26.19 |
| `src/layouts/AdminLayout.tsx` | `SidebarShell` con «Perfil» y «Cerrar sesión» en el pie; contenido vacío | RF-26.15, 26.16 |
| `src/features/admin/components/AdminGuard.tsx` | Sin sesión → login; con sesión, verifica con `/me` antes de mostrar | RF-26.13, 26.14 |
| `src/pages/AdminLoginPage.tsx` | Formulario, errores, bloqueo con cuenta atrás, foco, redirecciones | RF-26.1 a 26.8, 26.12 |
| `src/pages/AdminProfilePage.tsx` | Página vacía de «Perfil» | RF-26.15 |
| `src/routes.tsx` | Rutas `/admin/login` y `/admin` (hija: índice «Perfil») | RF-26.13, 26.20 |

## 4. Estado y comunicación
- **Pantalla de login:** estado local (usuario, contraseña, enviando, error, bloqueo hasta). Al terminar bien llama `login` y navega a `/admin`. Si el store trae `expired`, muestra «Tu sesión expiró. Ingresa de nuevo.» y llama `clearExpired`.
- **Bloqueo (429):** guarda `blockedUntil = Date.now() + retryAfter`; el botón se deshabilita hasta entonces con un temporizador que se limpia al desmontar.
- **Guardia:** lee `session`. Sin sesión → `<Navigate to="/admin/login" replace />`. Con sesión llama `fetchMe()` una vez al montar; mientras tanto muestra «Verificando sesión…». Si `fetchMe` da 401, `adminClient` ya cerró la sesión y la guardia redirige por el cambio del store.
- **Cerrar sesión:** `logout()` borra el store y `sessionStorage`; la guardia redirige a `/admin/login` sin mensaje.
- El token solo lo lee `adminClient`; ningún componente construye la cabecera.

## 5. Decisiones
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Extraer `SidebarShell` | Copiar la barra en `AdminLayout` | Garantiza que se comporte igual (RF-26.21) y evita duplicar ~80 líneas. |
| `/admin/login` sin barra lateral | Dentro de `AppLayout` | La barra de visitantes ofrecería Mapa y Asistente y daría un enlace visible al área (RF-26.19). |
| `adminClient` aparte, sobre el cliente base | Meter el token en `apiClient` | El chat es público y no debe enviar el token; así el token solo sale en llamadas de administración. |
| Cerrar sesión por 401 en `adminClient` | Que cada pantalla lo maneje | Cumple RF-26.17 en un solo lugar. |
| `expired` como campo del store | Estado de navegación del router | El cierre ocurre fuera de React (en `adminClient`); el store es accesible desde ahí. |
| Errores que no son 401 en `/me` (red, 5xx) no cierran la sesión; el área se muestra | Cerrar sesión ante cualquier error | Un fallo temporal del servidor no debe expulsar al administrador; el área está vacía y el siguiente 401 real cierra la sesión. |
| El login envía `fetch` con el cliente base y mensajes propios | Reutilizar `userMessageFor` | Esos textos hablan del asistente. |

## 6. Estrategia de pruebas
| Requisito | Test |
|---|---|
| RF-26.1, 26.2, 26.8 | `AdminLoginPage.test.tsx` › foco en «Usuario»; botón deshabilitado con campos vacíos; Enter envía; contraseña `type=password`; error con `role="alert"` |
| RF-26.3 | › «RF-26.3: mientras envía deshabilita el botón y no duplica el envío» |
| RF-26.4 | › «RF-26.4: login correcto guarda la sesión y navega a /admin» |
| RF-26.5 | › «RF-26.5: 401 muestra el error, conserva el usuario, vacía la contraseña y la enfoca» |
| RF-26.6 | › «RF-26.6: 429 muestra los minutos redondeados hacia arriba y deshabilita hasta que pase» (reloj simulado) |
| RF-26.7 | › «RF-26.7: red caída o 5xx muestra el mensaje de conexión y permite reintentar» |
| RF-26.9, 26.10, 26.11 | `useAuthStore.test.ts` › recarga con sesión, vencida descartada, solo se guarda token y vencimiento; `client.test.ts` › con logs activos no se escribe la contraseña ni el token |
| RF-26.12 | `AdminLoginPage.test.tsx` › con sesión redirige a /admin |
| RF-26.13, 26.14 | `AdminGuard.test.tsx` › sin sesión va al login; con sesión llama `/me` y muestra el área; 401 cierra y vuelve al login con «Tu sesión expiró»; error de red no cierra |
| RF-26.15, 26.21 | `AdminLayout.test.tsx` › solo «Perfil» (sin Mapa ni Asistente) activa, contenido vacío; contraer y expandir; `AppLayout.test.tsx` actual sigue en verde |
| RF-26.16 | `AdminLayout.test.tsx` › «Cerrar sesión» borra la sesión y va al login |
| RF-26.17, 26.18 | `adminClient.test.ts` › añade `Authorization: Bearer`; un 401 cierra la sesión con `expired`; el chat (`apiClient`) no envía token |
| RF-26.19, 26.20 | `routes.test.tsx` › la barra de visitantes no tiene enlaces a admin; la ruta desconocida sigue en 404; `/admin` y `/admin/login` existen |

A mano (con el backend de HU-25 levantado): escenarios 1 a 8 de la spec con el administrador de HU-24, incluido el 7 borrando al administrador o esperando el vencimiento, y la transición de la barra.

## 7. Riesgos y dependencias
- **Depende de HU-25:** sin sus endpoints solo se prueba con `fetch` simulado. Para la prueba manual, HU-25 debe estar implementada.
- **Refactor de `AppLayout`:** es lo más delicado (la barra va encima del mapa y alimenta `--sidebar-w`). Sus tests actuales deben pasar sin cambios.
- **XSS:** el token en `sessionStorage` es legible por cualquier script de la página; se mitiga al no usar HTML inyectado y se acepta según la spec.
- **Token vencido a mitad de uso:** como no hay refresh, la próxima llamada responde 401 y se vuelve al login (RF-26.17).

## 8. Historial
- 2026-11-12 · Plan creado.
