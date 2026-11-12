# HU-24 · Tareas

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

## Tareas
- [x] T1 · Migración `V2__admin_users.sql` (RF-24.1)
- [x] T2 · Campos `ADMIN_*` en `Settings` (RF-24.2)
- [x] T3 · `app/auth/passwords.py` con bcrypt y dependencia (RF-24.4)
- [x] T4 · `admin_exists` e `insert_admin` en `Database` (RF-24.3, RF-24.5)
- [x] T5 · `ensure_initial_admin` (RF-24.3, RF-24.5)
- [x] T6 · `lifespan` en `main.py` (RF-24.6, RF-24.7)
- [x] T7 · Tests unitarios e integración
- [x] T8 · `.env.example`, README del backend e histories (RF-24.8)

## Verificación final
- [x] Tests del backend en verde (unitarios + integración, en Docker)
- [x] Escenarios de `spec.md` comprobados (1 y 2 a mano con `ADMIN_*` por variable de entorno; 3 por tests)
- [x] `spec.md` en «Implementada»; `histories.md` con ✅
- [x] Commit `feat(backend): HU-24 …`

## Pendiente / notas
- `backend/.env` local aún no tiene `ADMIN_USERNAME`/`ADMIN_PASSWORD`: hay que añadirlos para que se cree el admin.
