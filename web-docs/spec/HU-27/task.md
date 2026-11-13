# HU-27 · Tareas

- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

> `task.md` es la lista de trabajo, en el orden en que se ejecuta. Cada tarea es pequeña (≲ 1 h) y apunta al requisito que cubre. Se marca `[x]` al terminar.

## Tareas
- [x] T1 · `schemas/places.py`: `PlaceCategoryOut` y `PlaceOut` con descripciones de campo y sin `created_at` ni `updated_by` (RF-27.2 a RF-27.4, RF-27.15)
- [x] T2 · `Database.list_place_categories`, `list_places` y `get_place` con `PUBLIC_PLACE_COLUMNS`, solo publicados y orden `name, id` (RF-27.1 a RF-27.8, RF-27.14)
- [x] T3 · Versión en memoria de las tres consultas en `FakeDatabase` (RF-27.*)
- [x] T4 · `api/caching.py`: `cached_json` con `ETag` de contenido, `Cache-Control: public, max-age=60` y 304 (acepta lista, `W/` y `*`) y sus tests (RF-27.10, RF-27.11)
- [x] T5 · `api/places.py`: los tres endpoints, `get_places_store`, validación del slug y 404 uniforme (RF-27.1 a RF-27.9, RF-27.12)
- [x] T6 · Incluir el router en `main.py` y comprobar el 503 con la base caída (RF-27.13)
- [x] T7 · Tests de la API con base falsa: categorías, lista, campos, orden, filtro, detalle, 404, sin autenticación, caché, vacío, 503 y OpenAPI (RF-27.1 a RF-27.13, RF-27.15)
- [x] T8 · Tests de integración con la semilla real: escenarios 1 a 6, lugar no publicado y una sola sentencia por consulta (RF-27.4, RF-27.8, RF-27.14)
- [x] T9 · `backend/README.md`: endpoints, campos, política de caché y ejemplos con `curl` (RF-27.16)

## Verificación final
- [x] Backend completo en verde en Docker: 291 pasan, 13 se omiten (las que necesitan el repo raíz)
- [x] Escenarios 1 a 8 de `spec.md` comprobados (1 a 6 por tests de integración; 7 a mano apagando la base: los tres endpoints dan 503 y se recuperan al encenderla; 8 por el test de OpenAPI y revisando `/openapi.json`; `/docs` no se abrió en el navegador)
- [x] `curl` contra el backend real: `fisi` (200 con `Cache-Control` y `ETag`), mismo `If-None-Match` (304), id inexistente (404), 54 lugares, 8 puertas
- [x] `spec.md` en «Implementada»; tabla resumen y título en `../../histories.md` con ✅
- [ ] Commit `feat(backend): HU-27 …` con spec, plan, task y código

## Pendiente / notas
- Falta el commit `feat(backend): HU-27 …` (a pedido del equipo).
- El mensaje 503 de la base sugiere `./script/dev.sh` (ruta antigua; la real es `scripts/`). Es un texto de `app/rag/db.py` anterior a esta historia; se corrige junto con el resto de menciones.
- Que la web consuma la API: HU-28. Que el asistente lea la tabla: HU-29.
