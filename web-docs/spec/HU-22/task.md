# HU-22 · Tareas

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

> `task.md` es la lista de trabajo, en el orden en que se ejecuta. Cada tarea es pequeña (≲ 1 h) y apunta al requisito que cubre. Se marca `[x]` al terminar.

## Tareas
- [x] T1 · Migración `V3__places.sql` con `place_categories`, `places`, restricciones e índices (RF-22.1 a RF-22.4)
- [x] T2 · Tests de integración del esquema: columnas, rechazos y listas no nulas (RF-22.1 a RF-22.4)
- [x] T3 · `Database.insert_place_categories` e `insert_places` (`on conflict do nothing`, transacción, cuentan lo insertado) y su versión en `FakeDatabase` (RF-22.12)
- [x] T4 · `app/places/seed.py`: tipos, `load_seed` y `validate_seed` con `SeedError` que nombra el lugar (RF-22.3, RF-22.4, RF-22.13)
- [x] T5 · `apply_seed` y `main()` de la CLI con resumen y errores de conexión (RF-22.5, RF-22.6, RF-22.11, RF-22.12, RF-22.14, RF-22.16)
- [x] T6 · Tests unitarios de la carga con `FakeDatabase` (RF-22.4, RF-22.7, RF-22.12, RF-22.13, RF-22.16, escenario 7)
- [x] T7 · `app/tools/places/slugs.py` (`slugify`, `derive_slug`) y sus tests (RF-22.7)
- [x] T8 · `web/scripts/dump-places.mjs`: vuelca categorías y lugares de `places.ts` a JSON (RF-22.6)
- [x] T9 · `app/tools/places/export_seed.py`: fusión de duplicados, completado desde `places.py` y corpus, `places.json`, `place_id_map.json` y resumen (RF-22.6 a RF-22.10, RF-22.14)
- [x] T10 · Tests de la exportación con datos de ejemplo pequeños: fusión, completado sin pisar, mapa completo, resumen (RF-22.8 a RF-22.10, RF-22.14)
- [x] T11 · Correr la exportación real, revisar el resumen y resolver a mano lo que quede (coincidencias por nombre, diferencias) y versionar los dos JSON
- [x] T12 · Tests de integración de la carga con la semilla real: categorías, lugares, `verified_at` vacío, idempotencia y horario editado conservado (RF-22.5, RF-22.6, RF-22.11, RF-22.12)
- [x] T13 · Comando `seed-places` en `script/dev.sh`, su ayuda y el test de `test_dev_script.py` (RF-22.15)
- [x] T14 · `backend/README.md`: tablas, flujo de exportación, comando y cómo reiniciar (RF-22.15)

## Verificación final
- [x] `./scripts/dev.sh test` del backend en verde (unitarias e integración, en Docker)
- [x] Escenarios 1 a 7 de `spec.md` comprobados (1, 2, 3, 4, 5 y 7 por tests de integración y unitarios; 2 también a mano con `psql` sobre la base de desarrollo; 6 por tests de la exportación y la corrida real)
- [x] `./scripts/dev.sh seed-places` dos veces seguidas: la primera insertó 9 categorías y 54 lugares; la segunda, 0
- [x] `spec.md` en «Implementada»; tabla resumen y título en `../../histories.md` con ✅
- [ ] Commit `feat(backend): HU-22 …` con spec, plan, task y código

## Pendiente / notas
- Falta el commit `feat(backend): HU-22 …` (a pedido del equipo).
- La carpeta del repo es `scripts/`, pero README, `dev.sh` y `tests/test_dev_script.py` dicen `script/`: ese test se omite en silencio. Conviene corregirlo aparte.
- Resultado de la exportación: 54 lugares (55 de la web menos la fusión de «23» y «25»); solo se completó la descripción de `comedor-universitario` desde el corpus; no hubo diferencias web ≠ `places.py`.
- `places.py` tiene `ciencias-economicas`, que no coincide por nombre con ningún lugar de la web (la web tiene `…-antiguo` y `…-nuevo`). No se exportó; HU-29 debe decidir a cuál apunta.
- Que la API, la web y el asistente lean estas tablas: HU-27, HU-28 y HU-29.
- Borrar `places.py`, `corpus.py` y los `.md` de origen: más adelante, cuando HU-29 reemplace su uso.
