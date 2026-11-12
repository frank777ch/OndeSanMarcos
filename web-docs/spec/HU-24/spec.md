# HU-24 · Usuario administrador inicial

- **Estado:** Implementada
- **Historia:** ver `../../histories.md#hu-24`
- **Depende de:** HU-23 (Postgres y migraciones Flyway).
- **Archivos hermanos:** [plan.md](plan.md) · [task.md](task.md)

## 1. Contexto y objetivo
Las futuras funciones de administración (por ejemplo editar lugares) necesitan una cuenta de administrador. Esta historia crea la tabla de administradores y garantiza que exista uno inicial, definido en el `.env` del backend, sin crearlo a mano en la base y sin guardar su contraseña en claro.

## 2. Alcance
**Dentro:**
- Tabla nueva de administradores (`username`, `password`) creada con una migración.
- Variables del administrador inicial en el `.env` del backend.
- Al iniciar la app: crear ese administrador si no existe, guardando la contraseña hasheada.
- Pruebas, `.env.example` y documentación del backend.

**Fuera (y dónde se hace):**
- Iniciar sesión, tokens y proteger endpoints → historia futura.
- Endpoints para crear, listar o cambiar administradores → historia futura.
- Pantallas de administración en la web → historia futura.

## 3. Requisitos
| ID | Requisito |
|---|---|
| RF-24.1 | Una migración nueva (`V2`) debe crear la tabla `admin_users` con `id`, `username` (único, no nulo), `password_hash` (no nulo) y `created_at`. `V1` no se edita. |
| RF-24.2 | La configuración debe leer `ADMIN_USERNAME` y `ADMIN_PASSWORD` del `.env` del backend; ambas vacías por defecto. |
| RF-24.3 | Cuando la app inicia con `DATABASE_URL`, `ADMIN_USERNAME` y `ADMIN_PASSWORD` definidos y no existe un administrador con ese `username`, el sistema debe crearlo. |
| RF-24.4 | La contraseña debe guardarse hasheada con bcrypt; la contraseña en claro no debe guardarse ni aparecer en logs. |
| RF-24.5 | Cuando ya existe un administrador con ese `username`, el sistema no debe crear otro ni modificar su contraseña, aunque `ADMIN_PASSWORD` haya cambiado. Reiniciar varias veces deja una sola fila. |
| RF-24.6 | Si falta `DATABASE_URL`, la app no debe arrancar y debe informar con un error claro que la causa es la variable de entorno faltante. Si falta `ADMIN_USERNAME` o `ADMIN_PASSWORD`, no se crea nada, se registra un aviso que nombra las variables y la app arranca. |
| RF-24.7 | Si la base no responde o la contraseña no es válida (más de 72 bytes), la app debe arrancar igual y registrar un aviso claro, sin exponer la contraseña. |
| RF-24.8 | `backend/.env.example` debe documentar `ADMIN_USERNAME` y `ADMIN_PASSWORD` con un aviso de cambiar la contraseña fuera de desarrollo. |

## 4. Escenarios de aceptación
**Escenario 1: primer arranque** (RF-24.3, RF-24.4)
- **Dado** `ADMIN_USERNAME=admin` y `ADMIN_PASSWORD=secreto` en `backend/.env` y la tabla vacía
- **Cuando** arranca el backend
- **Entonces** `admin_users` tiene una fila `admin` cuyo `password_hash` empieza con `$2b$` y verifica contra `secreto`.

**Escenario 2: reinicio** (RF-24.5)
- **Dado** el administrador ya creado
- **Cuando** reinicio el backend, incluso con otra `ADMIN_PASSWORD`
- **Entonces** sigue habiendo una sola fila y el hash no cambió.

**Escenario 3: configuración incompleta** (RF-24.6, RF-24.7)
- **Cuando** arranco sin `DATABASE_URL`
- **Entonces** el backend no arranca y el error dice que falta la variable de entorno `DATABASE_URL`.
- **Cuando** arranco sin `ADMIN_*`, o con la base apagada
- **Entonces** el backend arranca y registra un aviso.

## 5. Preguntas abiertas
- Ninguna.

## 6. Historial
- 2026-11-12 · Borrador creado e implementado.
- 2026-11-12 · RF-24.6: sin `DATABASE_URL` la app no arranca. Esto reemplaza en la práctica RF-23.12 (recuperación local sin base) y RF-23.13 en cuanto a «arrancar sin DATABASE_URL»; arrancar con la base apagada sigue permitido.
