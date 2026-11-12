# HU-25 · Tareas

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

## Tareas
- [x] T1 · Agregar `PyJWT` a `requirements.txt`, reconstruir la imagen y fijar `JWT_SECRET` de prueba en `tests/conftest.py` (RF-25.4)
- [x] T2 · Campos `jwt_secret` y `access_token_expire_minutes` en `Settings` (RF-25.5)
- [x] T3 · `Database.get_admin` y su versión en el fake de pruebas (RF-25.2, RF-25.8)
- [x] T4 · `auth/tokens.py`: crear y decodificar el token (RF-25.1, RF-25.4, RF-25.7)
- [x] T5 · `auth/rate_limit.py`: limitador con reloj inyectable y tests (RF-25.10)
- [x] T6 · `auth/service.py`: `authenticate` con hash señuelo (RF-25.2, RF-25.3)
- [x] T7 · `schemas/auth.py` y `auth/dependencies.py` (`get_current_admin`, `get_store`) (RF-25.6 a RF-25.9)
- [x] T8 · `api/auth.py`: `POST /api/auth/login` y `GET /api/auth/me`; incluir el router en `main.py` (RF-25.1, RF-25.6, RF-25.10, RF-25.12)
- [x] T9 · Exigir `JWT_SECRET` (≥ 32 caracteres) en el `lifespan` con mensaje claro (RF-25.5)
- [x] T10 · Tests de la API: login, 401, 422, 429, /me, administrador borrado, 503, logs (RF-25.1 a RF-25.12)
- [x] T11 · Test de integración con Postgres real (RF-25.1, RF-25.8)
- [x] T12 · `.env.example` (con cómo generar el secreto: `python -c "import secrets; print(secrets.token_urlsafe(48))"`), README del backend y `/docs` (RF-25.13)
- [x] T13 · Añadir `JWT_SECRET` al `backend/.env` local

## Verificación final
- [x] Tests del backend en verde (unitarias e integración, en Docker)
- [x] Escenarios 1 a 5 de `spec.md` comprobados (1 a 4 a mano con `curl` contra el backend real y por tests; 5 por tests)
- [x] `spec.md` en «Implementada»; tabla resumen y título en `../../histories.md` con ✅
- [ ] Commit `feat(backend): HU-25 …` con spec, plan, task y código

## Pendiente / notas
- Pantalla de login en la web: HU-26.
- `JWT_SECRET` se añadió al `backend/.env` local (generada); sin ella el backend no arranca.
