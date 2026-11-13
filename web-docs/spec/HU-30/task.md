# HU-30 · Tareas

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

> `task.md` es la lista de trabajo, en el orden en que se ejecuta. Cada tarea es pequeña (≲ 1 h) y apunta al requisito que cubre. Se marca `[x]` al terminar.

## Tareas
- [x] T1 · Migración `V4__place_id_sequence.sql` (siguiente número libre) con `places_id_seq` desde 1000 y test de integración de la secuencia (RF-30.8)
- [x] T2 · `app/places/area.py` (`CAMPUS_AREA`, `in_campus`) y `app/places/text.py` (`normalize_text`) con tests (RF-30.4, RF-30.13)
- [x] T3 · `schemas/places_admin.py`: `PlaceIn`, `PlaceCategoryIn` y esquemas de salida con descripciones; tests de validación y de normalización (RF-30.7, RF-30.8, RF-30.13 a RF-30.15, RF-30.19, RF-30.20, RF-30.29)
- [x] T4 · `Database`: `admin_list_places`, `admin_get_place`, `category_exists`, `place_exists` y `would_create_cycle`; tests de integración (RF-30.3 a RF-30.5, RF-30.13)
- [x] T5 · `Database`: `create_place` y `update_place` (id con `nextval`, `verified_at` con `coalesce`, `updated_at` y `updated_by`); tests de integración (RF-30.6, RF-30.8 a RF-30.12, RF-30.27)
- [x] T6 · `Database`: categorías (`admin_list_categories`, `create_category`, `update_category`, `delete_category`) y `DuplicateError`; tests de integración (RF-30.18 a RF-30.22)
- [x] T7 · `tests/fake_places_admin.py`: réplica en memoria de los métodos anteriores (RF-30.*, pruebas unitarias)
- [x] T8 · `app/places/sync.py`: `PlaceSync`, implementación por defecto `"skipped"`, captura de excepciones y `get_place_sync()`; tests (RF-30.23 a RF-30.25)
- [x] T9 · `app/places/service.py`: crear y editar con comprobaciones de categoría, padre y ciclo, errores 422 con el formato de FastAPI, y registro en el log (RF-30.6, RF-30.9, RF-30.13, RF-30.30)
- [x] T10 · `app/api/admin_places.py`: endpoints de lugares (listar con filtros y `q`, ver, crear con `Location`, editar, reindexar) con `get_current_admin` (RF-30.1, RF-30.3 a RF-30.12, RF-30.16, RF-30.17, RF-30.23 a RF-30.25)
- [x] T11 · Endpoints de categorías (listar, crear, editar, borrar) (RF-30.18 a RF-30.22)
- [x] T12 · `main.py`: incluir el router y el middleware `Cache-Control: no-store` en `/api/admin` (RF-30.2)
- [x] T13 · Tests de la API con base falsa: acceso, filtros, crear, editar, validaciones, despublicar, 405, categorías, `rag_sync`, 503, OpenAPI y log (RF-30.1 a RF-30.30)
- [x] T14 · Tests de integración de extremo a extremo con Postgres: escenarios 1 a 8 y 10 (RF-30.6 a RF-30.22, RF-30.26, RF-30.27)
- [x] T15 · `backend/README.md`: endpoints de administración, campos, errores 422/409/405, `rag_sync` y ejemplos con `curl` (RF-30.29)
- [x] T16 · Prueba manual con el backend real: login, flujo completo con `curl`, `/docs` con «Authorize» y la base apagada (escenarios 1, 11)

## Verificación final
- [x] Backend completo en verde en Docker (`pytest`: unitarias e integración)
- [x] Escenarios de `spec.md` comprobados con `curl` y pruebas; los puntos del asistente (2, 4 y 9 completos) quedan pendientes de HU-29
- [ ] `spec.md` en «Implementada»; tabla resumen y título en `../../histories.md` con ✅
- [ ] Commit `feat(backend): HU-30 …` con spec, plan, task y código

## Pendiente / notas
- Conectar `PlaceSync` con `reindex_place` y la caché del asistente cuando exista HU-29 (un solo archivo: `app/places/sync.py`).
- La pantalla que usa estos endpoints es HU-31.
