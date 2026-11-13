# HU-37 · Plan técnico

- **Spec:** [spec.md](spec.md) · **Estado:** Aprobado

## Backend
- `Database.get_admin` devuelve también `created_at`; `Database.update_admin_password(username, hash)`; el protocolo `AdminLookup` gana ese método.
- `app/schemas/auth.py`: `MeResponse.created_at` y `ChangePasswordRequest` (política de RF-37.6 en un validador del campo `new_password`, de modo que el 422 apunta a ese campo).
- `app/api/auth.py`: `POST /api/auth/change-password` (204). Reutiliza `get_current_admin` y el `LoginRateLimiter` del login: una actual incorrecta → 403 y cuenta como fallo; bloqueo → 429.
- `app/main.py`: los 422 de `/api/auth` no repiten el valor recibido (`input`/`ctx`), porque FastAPI lo incluye por defecto y sería la contraseña en claro (RF-37.7).
- Sin migración: `admin_users.created_at` ya existe.

## Web
- `services/api/adminClient.ts`: `fetchMe()` devuelve `{username, createdAt}`; `changePassword()`.
- `components/PasswordInput`: campo con mostrar/ocultar.
- `features/admin/profile/{passwordRules.ts, components/ChangePasswordDialog.tsx}` y `pages/AdminProfilePage.tsx`. Errores por campo con `parseFieldErrors` (HU-31); 403 → campo actual; 429 → minutos de espera; éxito → cierra y `Toast`.

## Pruebas
| Requisito | Test |
|---|---|
| RF-37.1 a 37.9 | `backend/tests/test_auth_api.py`, `backend/tests/integration/test_auth_login.py` |
| RF-37.10, 37.11 | `AdminProfilePage.test.tsx` |
| RF-37.11 a 37.15 | `ChangePasswordDialog.test.tsx`, `passwordRules.test.ts` |
