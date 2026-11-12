# HU-25 · Login de administrador (backend)

- **Estado:** Implementada
- **Historia:** ver `../../histories.md#hu-25`
- **Depende de:** HU-24 (tabla `admin_users` y administrador inicial).
- **Archivos hermanos:** [plan.md](plan.md) · [task.md](task.md)

## 1. Contexto y objetivo
HU-24 deja al administrador guardado en la base, pero nada permite autenticarse con él. Esta historia agrega a la API el inicio de sesión: el administrador envía su usuario y contraseña, recibe un token con vencimiento y con él puede llamar a endpoints protegidos. Además deja listo el mecanismo reutilizable para proteger los endpoints de administración que vengan después. La pantalla de login en la web es HU-26.

## 2. Alcance
**Dentro:**
- Endpoint de login (usuario y contraseña → token).
- Endpoint protegido que devuelve el administrador autenticado, para comprobar el token.
- Mecanismo reutilizable para proteger endpoints (token válido y administrador existente).
- Variables de configuración del token en el `.env` del backend.
- Límite de intentos fallidos por usuario.
- Pruebas, `.env.example` y documentación del backend.

**Fuera (y dónde se hace):**
- Pantalla de login, guardado de la sesión y cierre de sesión en la web → HU-26.
- Crear, listar, cambiar la contraseña o borrar administradores → historia futura.
- Renovación de token (refresh) y revocación de tokens antes de vencer → historia futura. Mientras tanto, la sesión dura lo que dure el token.
- Endpoints de administración concretos (por ejemplo editar lugares) → HU-22 y siguientes.

## 3. Requisitos
| ID | Requisito |
|---|---|
| RF-25.1 | Cuando se envía `POST /api/auth/login` con `username` y `password` correctos, el sistema debe responder 200 con `access_token`, `token_type` igual a `bearer` y `expires_in` (segundos de vida del token). |
| RF-25.2 | Cuando el usuario no existe o la contraseña es incorrecta, el sistema debe responder 401 con el mismo mensaje en ambos casos, de modo que no se pueda saber si el usuario existe. El tiempo de respuesta tampoco debe delatar si el usuario existe. |
| RF-25.3 | Cuando el cuerpo del login no trae `username` o `password`, o vienen vacíos, el sistema debe responder 422. Una contraseña de más de 72 bytes se trata como incorrecta (401). |
| RF-25.4 | El token debe estar firmado con un secreto del servidor, identificar al administrador y tener un vencimiento. Su duración debe ser configurable y valer 60 minutos por defecto. |
| RF-25.5 | La configuración debe leer `JWT_SECRET` (obligatoria, mínimo 32 caracteres) y `ACCESS_TOKEN_EXPIRE_MINUTES` del `.env` del backend. Si falta `JWT_SECRET` o es demasiado corta, la app no debe arrancar y debe informar que la causa es esa variable de entorno. |
| RF-25.6 | Cuando se envía `GET /api/auth/me` con un token válido en `Authorization: Bearer <token>`, el sistema debe responder 200 con el `username` del administrador. |
| RF-25.7 | Cuando el token falta, está mal formado, tiene la firma alterada o ya venció, el sistema debe responder 401 con la cabecera `WWW-Authenticate: Bearer`, sin detallar el motivo. |
| RF-25.8 | Cuando el token es válido pero el administrador ya no existe en la base, el sistema debe responder 401. |
| RF-25.9 | Debe existir un mecanismo único y reutilizable para exigir autenticación en cualquier endpoint (el de RF-25.6 lo usa), de modo que proteger uno nuevo no requiera repetir la verificación del token. |
| RF-25.10 | Cuando un mismo usuario acumula 5 intentos fallidos seguidos en 15 minutos, el sistema debe responder 429 con la cabecera `Retry-After` a los intentos siguientes durante 15 minutos, incluso si la contraseña es correcta. Un login correcto antes de llegar al límite reinicia el conteo. |
| RF-25.11 | Si la base no responde durante el login o la verificación, el sistema debe responder 503 con un mensaje claro, no 500. |
| RF-25.12 | La contraseña y el hash no deben aparecer en respuestas ni en logs. Los intentos fallidos y los bloqueos deben registrarse con el usuario, sin la contraseña. |
| RF-25.13 | `backend/.env.example` y el README del backend deben documentar `JWT_SECRET` (con cómo generarla) y `ACCESS_TOKEN_EXPIRE_MINUTES`; los endpoints deben aparecer en la documentación interactiva de la API. |

## 4. Escenarios de aceptación
**Escenario 1: login correcto** (RF-25.1, RF-25.4, RF-25.6)
- **Dado** el administrador creado por HU-24
- **Cuando** envío su usuario y contraseña a `POST /api/auth/login` y luego llamo a `GET /api/auth/me` con el token recibido
- **Entonces** el login responde 200 con el token y `/me` responde 200 con su `username`.

**Escenario 2: credenciales incorrectas** (RF-25.2)
- **Cuando** envío un usuario inexistente, y luego uno existente con mala contraseña
- **Entonces** ambas respuestas son 401 con el mismo cuerpo.

**Escenario 3: token inválido o vencido** (RF-25.7, RF-25.8)
- **Cuando** llamo a `/me` sin token, con un token alterado, con uno vencido y con uno de un administrador borrado
- **Entonces** todas las respuestas son 401 con `WWW-Authenticate: Bearer`.

**Escenario 4: fuerza bruta** (RF-25.10)
- **Cuando** fallo 5 veces el login de un usuario y luego envío la contraseña correcta
- **Entonces** recibo 429 con `Retry-After`; pasado el bloqueo, el login correcto funciona.

**Escenario 5: configuración incompleta** (RF-25.5)
- **Cuando** arranco sin `JWT_SECRET` o con una de menos de 32 caracteres
- **Entonces** el backend no arranca y el error nombra la variable `JWT_SECRET`.

## 5. Preguntas abiertas
Resueltas el 2026-11-12:
- **Entrega del token:** en el cuerpo de la respuesta y en la cabecera `Authorization`; no cookie.
- **Contador de intentos:** en memoria (una sola instancia del backend). Con varias réplicas habrá que pasarlo a la base.
- **Sesión:** 60 minutos sin renovación; el refresh queda para una historia futura.

## 6. Historial
- 2026-11-12 · Borrador creado.
- 2026-11-12 · Aprobada: preguntas abiertas resueltas.
