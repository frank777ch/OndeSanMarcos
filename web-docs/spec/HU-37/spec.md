# HU-37 · Perfil del administrador y cambio de contraseña

- **Estado:** Borrador
- **Depende de:** HU-25 (login y `GET /api/auth/me`) y HU-26 (login en la web).
- **Archivos hermanos:** plan.md y task.md (se crean al aprobar la spec).

## 1. Contexto y objetivo
La pestaña «Perfil» de `/admin` existe pero está vacía y la contraseña del administrador solo se puede cambiar editando `.env` o la base. Esta historia muestra los datos de la cuenta y permite cambiar la contraseña desde un diálogo.

## 2. Alcance
**Dentro:** tarjeta de datos; diálogo de cambio de contraseña; endpoint `POST /api/auth/change-password`; `created_at` en `/me`.
**Fuera:** recuperar contraseña olvidada; gestión de otros administradores; cambiar el usuario; móvil.

## 3. Requisitos
### API
| ID | Requisito |
|---|---|
| RF-37.1 | `GET /api/auth/me` debe devolver además `created_at` (fecha de alta). |
| RF-37.2 | `POST /api/auth/change-password` con `current_password` y `new_password` debe exigir sesión de administrador (401 sin token válido). |
| RF-37.3 | Con la contraseña actual correcta y la nueva válida debe guardar el hash bcrypt de la nueva y responder 204. La nueva sirve en el siguiente login; la anterior deja de servir. |
| RF-37.4 | Con la contraseña actual incorrecta debe responder 403 con el mensaje «La contraseña actual no es correcta.» y no cambiar nada. |
| RF-37.5 | La contraseña actual incorrecta cuenta como intento fallido en el mismo límite del login (5 en 15 min → 429 con `Retry-After`). |
| RF-37.6 | La nueva contraseña debe tener entre 8 y 72 bytes y ser distinta de la actual; si no, 422 con el error en el campo `new_password`. |
| RF-37.7 | La contraseña y el hash no deben aparecer en respuestas ni en logs; el cambio se registra con el usuario. |
| RF-37.8 | Si la base no responde, 503 con un mensaje claro. |
| RF-37.9 | Debe aparecer en `/docs` con descripción de campos y respuestas. |

### Web
| ID | Requisito |
|---|---|
| RF-37.10 | «Perfil» debe mostrar el usuario, la fecha de alta y cuándo vence la sesión actual. |
| RF-37.11 | Un botón «Cambiar contraseña» debe abrir un diálogo (título, X, Esc, fondo difuminado) con contraseña actual, nueva y confirmación, cada una con opción de mostrar u ocultar. |
| RF-37.12 | El diálogo debe validar antes de enviar: campos obligatorios, mínimo 8 caracteres, la confirmación igual a la nueva y la nueva distinta de la actual. |
| RF-37.13 | Si el servidor rechaza la actual, el error debe verse junto a ese campo; un 429 debe indicar cuánto esperar. |
| RF-37.14 | Al tener éxito, el diálogo debe cerrarse y mostrar un aviso «Contraseña actualizada». |
| RF-37.15 | Mientras se envía, el botón debe quedar deshabilitado para evitar envíos dobles. |

## 4. Escenarios de aceptación
1. **Cambio correcto** (RF-37.3, 37.14): cambio la contraseña, cierro sesión y entro con la nueva.
2. **Actual incorrecta** (RF-37.4, 37.13): el diálogo marca el campo y nada cambia.
3. **Nueva inválida** (RF-37.6, 37.12): una de 5 caracteres o igual a la actual se rechaza.
4. **Bloqueo** (RF-37.5): tras 5 errores seguidos aparece el tiempo de espera.

## 5. Preguntas abiertas
1. **Sesión tras el cambio:** ¿se mantiene la sesión actual o se cierra para entrar de nuevo? Los tokens actuales (JWT) no se pueden revocar sin cambiar el diseño.
2. **Política de la nueva contraseña:** ¿solo mínimo 8 caracteres, o además exigir letras y números?
3. **Datos del perfil:** ¿basta con usuario, fecha de alta y vencimiento de la sesión?

## 6. Historial
- 2026-11-12 · Borrador creado.
