# HU-23 · Tareas

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

## Tareas
- [x] T1 · Spec escrita y aprobada (todos)
- [x] T2 · Plan y tareas escritos
- [ ] T3 · Migración `backend/db/migrations/V1__pgvector_schema.sql` (sin `grant`) y borrar `backend/db/schema.sql` y `supabase/` (RF-23.4, RF-23.5, RF-23.8)
- [ ] T4 · `docker-compose.yml`: servicios `db` (con salud) y `migrate` (Flyway), dependencias del `backend` y `DATABASE_URL` (RF-23.1 a RF-23.3, RF-23.6, RF-23.7)
- [ ] T5 · Comprobar el arranque desde cero: `db` sana, Flyway aplica `V1`, el backend arranca; reiniciar sin reaplicar (escenarios 1 y 2) (RF-23.3, RF-23.4)
- [ ] T6 · Dependencias: quitar `supabase`; añadir `psycopg[binary]`, `psycopg_pool` y `pgvector`; reconstruir la imagen del backend (RF-23.8)
- [ ] T7 · `Settings`: `database_url` y `db_connect_timeout`; quitar Supabase + `tests/test_config.py` (RF-23.8)
- [ ] T8 · `app/rag/db.py`: pool perezoso, `match`, `replace_all`, `count_place`, `delete_place`, `insert_rows`, `is_empty`, conversión de errores + `tests/test_db.py` (RF-23.9 a RF-23.11, RF-23.14, RF-23.15)
- [ ] T9 · `providers.py`: usar `db.py` y seleccionar por `database_url` + actualizar `tests/test_providers.py` (RF-23.9, RF-23.12, RF-23.13)
- [ ] T10 · `ingest_pgvector.py` con `db.replace_all` + actualizar `tests/test_ingest_pgvector.py` (RF-23.10)
- [ ] T11 · `upload_entries.py` con `db.py` + actualizar `tests/test_upload_entries.py` (RF-23.11)
- [ ] T12 · Limpiar menciones a Supabase en el código del backend (comentarios y textos) y en `requirements-*.txt` (RF-23.8)
- [ ] T13 · Marcador `integration` en `pytest.ini` y pruebas de integración (esquema, búsqueda, ingesta, subida, base vacía) (RF-23.18)
- [ ] T14 · `script/dev.sh`: `ingest`, `db-reset`, `psql`; `test` levanta `db` y `migrate` (RF-23.16, RF-23.18)
- [ ] T15 · `.github/workflows/backend-ci.yml`: Postgres con pgvector, migraciones y `DATABASE_URL` (RF-23.18)
- [ ] T16 · Documentación: `backend/.env.example`, `backend/README.md` y `README.md` de la raíz (RF-23.17)
- [ ] T17 · Verificación manual con la clave de Gemini: ingesta real, consulta con vectores, base vacía, base caída y modo mock (escenarios 3 a 10) (RF-23.14, RF-23.15, RF-23.19)

## Verificación final
- [ ] `./script/dev.sh test` en verde (unitarias, integración y web)
- [ ] `npm run build` y `npm run lint` en `web/` sin cambios ni errores
- [ ] `grep -ri supabase backend docker-compose.yml script` sin resultados (salvo `RESUMEN-AVANCE.md`)
- [ ] Escenarios de `spec.md` comprobados (anotar los manuales)
- [ ] `spec.md` en «Implementada»; tabla resumen y título en `../../histories.md` con ✅
- [ ] Commit `feat(backend): HU-23 …` con spec, plan, task y código

## Pendiente / notas
- Alojar Postgres en producción queda para cuando haya despliegue.
- `documents/` seguirá mencionando Supabase hasta HU-20.
- La ingesta real consume llamadas a Gemini.
