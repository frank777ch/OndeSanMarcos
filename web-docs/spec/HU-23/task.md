# HU-23 · Tareas

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

## Tareas
- [x] T1 · Spec escrita y aprobada (todos)
- [x] T2 · Plan y tareas escritos
- [x] T3 · Migración `backend/db/migrations/V1__pgvector_schema.sql` (sin `grant`) y borrar `backend/db/schema.sql` y `supabase/` (RF-23.4, RF-23.5, RF-23.8)
- [x] T4 · `docker-compose.yml`: servicios `db` (con salud) y `migrate` (Flyway), dependencias del `backend` y `DATABASE_URL` (RF-23.1 a RF-23.3, RF-23.6, RF-23.7)
- [x] T5 · Comprobar el arranque desde cero: `db` sana, Flyway aplica `V1`, el backend arranca; reiniciar sin reaplicar (escenarios 1 y 2) (RF-23.3, RF-23.4)
- [x] T6 · Dependencias: quitar `supabase`; añadir `psycopg[binary]`, `psycopg_pool` y `pgvector`; reconstruir la imagen del backend (RF-23.8)
- [x] T7 · `Settings`: `database_url` y `db_connect_timeout`; quitar Supabase + `tests/test_config.py` (RF-23.8)
- [x] T8 · `app/rag/db.py`: pool perezoso, `match`, `replace_all`, `count_place`, `delete_place`, `insert_rows`, `is_empty`, conversión de errores + `tests/test_db.py` (RF-23.9 a RF-23.11, RF-23.14, RF-23.15)
- [x] T9 · `providers.py`: usar `db.py` y seleccionar por `database_url` + actualizar `tests/test_providers.py` (RF-23.9, RF-23.12, RF-23.13)
- [x] T10 · `ingest_pgvector.py` con `db.replace_all` + actualizar `tests/test_ingest_pgvector.py` (RF-23.10)
- [x] T11 · `upload_entries.py` con `db.py` + actualizar `tests/test_upload_entries.py` (RF-23.11)
- [x] T12 · Limpiar menciones a Supabase en el código del backend (comentarios y textos) y en `requirements-*.txt` (RF-23.8)
- [x] T13 · Marcador `integration` en `pytest.ini` y pruebas de integración (esquema, búsqueda, ingesta, subida, base vacía) (RF-23.18)
- [x] T14 · `script/dev.sh`: `ingest`, `db-reset`, `psql`; `test` levanta `db` y `migrate` (RF-23.16, RF-23.18)
- [x] T15 · `.github/workflows/backend-ci.yml`: Postgres con pgvector, migraciones y `DATABASE_URL` (RF-23.18)
- [x] T16 · Documentación: `backend/.env.example`, `backend/README.md` y `README.md` de la raíz (RF-23.17)
- [x] T3b · `clean` ya no borra la base y `db-reset` pide confirmación (RF-23.6, RF-23.20)
- [x] T3c · `.gitignore` para `backend/db/dumps/` (RF-23.24)
- [x] T8b · `app/rag/embedding_cache.py` (caché en disco, reintentos, caché de consultas) + `tests/test_embedding_cache.py`, y usarlo desde `build_embedding_provider` (RF-23.22, RF-23.23, RF-23.25)
- [x] T10b · `ingest`: se niega si hay datos sin `--force`, imprime cuántos vinieron de Gemini y cuántos de la caché; aborta sin tocar la tabla si se agotan los reintentos (RF-23.21 a RF-23.23)
- [x] T13b · La base de pruebas `_test` se crea y se borra sola; los tests nunca tocan la base de desarrollo (RF-23.26)
- [x] T14b · `script/dev.sh`: `db-dump` y `db-restore` (RF-23.24)
- [x] T17 · Verificación manual con la clave de Gemini: ingesta real, consulta con vectores, base vacía, base caída y modo mock (escenarios 3 a 10) (RF-23.14, RF-23.15, RF-23.19)

## Verificación final
- [x] La base de desarrollo conserva sus filas después de ejecutar `./script/dev.sh test` y `./script/dev.sh clean` (RF-23.20, RF-23.26) — verificado: 55 filas antes y después
- [x] `./script/dev.sh test` en verde (backend: 158 pruebas, 12 de revisión estática se omiten en el contenedor y pasan aparte; web: 109)
- [x] `npm run build` y `npm run lint` en `web/` sin cambios ni errores
- [x] `grep -ri supabase backend docker-compose.yml script` sin resultados (salvo `RESUMEN-AVANCE.md`)
- [x] Escenarios de `spec.md` comprobados (anotar los manuales)
- [x] `spec.md` en «Implementada»; tabla resumen y título en `../../histories.md` con ✅
- [x] Commit `feat(backend): HU-23 …` con spec, plan, task y código

## Pendiente / notas
- Alojar Postgres en producción queda para cuando haya despliegue.
- `documents/` seguirá mencionando Supabase hasta HU-20.
- La ingesta real consume llamadas a Gemini: el corpus actual son 55 fragmentos. Se hizo **una sola vez**; la caché (`backend/.rag_cache/`, 55 embeddings) y la copia de seguridad (`backend/db/dumps/documents-latest.dump`) permiten rehacer la base sin gastar cuota. Ambas están ignoradas por git: si no quieres perderlas, haz una copia fuera del repo o decide versionar el dump.
- Las pruebas destructivas (`db-reset`, `db-restore`) se hacen en un proyecto de Compose aparte para no borrar la base real.
- Hallazgos al verificar: (1) el disco de Docker estaba lleno y hubo que ampliarlo; (2) el pool devolvía una conexión muerta tras reiniciar la base: se activó `check_connection` y se añadió una prueba; (3) `find_gaps.py` también usaba Supabase.
- `backend/.env` del equipo todavía tiene las variables `SUPABASE_*` vacías: ya no se leen y se pueden borrar.
- Los tokens y claves que estuvieron en el historial de git del repositorio (Mapbox) siguen pendientes de revocar (HU-20).
