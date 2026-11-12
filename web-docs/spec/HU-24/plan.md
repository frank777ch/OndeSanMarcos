# HU-24 · Plan técnico

- **Spec:** [spec.md](spec.md)
- **Estado:** Ejecutado

## 1. Enfoque
Migración `V2` para la tabla. Un módulo `app/auth` con el hash (bcrypt) y la función que crea el administrador inicial. `main.py` la invoca en el `lifespan` de FastAPI, capturando los fallos para que la app arranque igual. `Database` gana dos métodos sobre `admin_users`.

## 2. Datos y tipos
- `admin_users(id bigint identity pk, username text unique not null, password_hash text not null, created_at timestamptz default now())`.
- `Settings.admin_username`, `Settings.admin_password` (`str`, vacío por defecto).

## 3. Archivos
| Ruta | Qué hace | Cubre |
|---|---|---|
| `backend/db/migrations/V2__admin_users.sql` | Crea `admin_users` | RF-24.1 |
| `backend/app/config.py` | Campos `admin_username` y `admin_password` | RF-24.2 |
| `backend/app/auth/passwords.py` | `hash_password` y `verify_password` (bcrypt) | RF-24.4 |
| `backend/app/auth/admin.py` | `ensure_initial_admin(db, username, password)` | RF-24.3, RF-24.5 |
| `backend/app/rag/db.py` | `admin_exists` y `insert_admin` | RF-24.3, RF-24.5 |
| `backend/app/main.py` | `lifespan` que siembra y captura errores | RF-24.6, RF-24.7 |
| `backend/requirements.txt` | `bcrypt` | RF-24.4 |
| `backend/.env.example`, `backend/README.md` | Documentación | RF-24.8 |

## 4. Decisiones
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Columna `password_hash` (no `password`) | Llamarla `password` | Deja claro que nunca es texto plano. |
| bcrypt | passlib, scrypt de la stdlib | Estándar conocido, una sola dependencia pequeña; passlib está sin mantenimiento. |
| Si existe, no actualizar la contraseña | Sincronizar con el `.env` | Evita que un cambio en el `.env` pise una contraseña cambiada desde la app más adelante. |
| Sembrar en `lifespan` | Script aparte | Lo pidió la historia: al iniciar la app. |
| Falta `DATABASE_URL` aborta el arranque; base apagada o sin `ADMIN_*` solo avisa | Abortar siempre | Lo pidió la historia para la variable faltante; con la base apagada el servidor sigue arrancando (RF-23.13). |
| Insert con `on conflict do nothing` | Solo `select` previo | Evita la carrera entre varias réplicas. |

## 5. Estrategia de pruebas
| Requisito | Test |
|---|---|
| RF-24.1 | `tests/integration/test_admin_users.py` › «RF-24.1» |
| RF-24.2 | `tests/test_config.py` › «RF-24.2» |
| RF-24.3, 24.4 | `tests/test_admin.py` › «RF-24.3», «RF-24.4» · integración › «RF-24.3» |
| RF-24.5 | `tests/test_admin.py` › «RF-24.5» · integración › «RF-24.5» |
| RF-24.6, 24.7 | `tests/test_admin.py` › «RF-24.6», «RF-24.7» |

Manual: arrancar con `./script/dev.sh` y revisar `./script/dev.sh psql` → `select username, password_hash from admin_users;`.

## 6. Riesgos y dependencias
- bcrypt solo admite 72 bytes: se rechaza una contraseña más larga con aviso.
- `ADMIN_PASSWORD` queda en el `.env`: no se sube al repo y debe cambiarse en producción.

## 7. Historial
- 2026-11-12 · Plan creado.
