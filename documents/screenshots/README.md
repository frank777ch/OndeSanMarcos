# 📸 Capturas para la sustentación

Carpeta para las imágenes que se usan en la presentación del proyecto
(slides en Canva). Hoy puede estar **vacía**; ve subiendo aquí las capturas
siguiendo el estándar de abajo.

---

## Estándar de nombres

Formato: **`NN-area-descripcion.png`**

- `NN` — número de dos dígitos para ordenar (`01`, `02`, …).
- `area` — uno de: `app`, `backend`, `repo`, `gestion`, `diagrama`.
- `descripcion` — en **minúsculas**, **kebab-case**, **sin acentos ni espacios**.
- Extensión preferida: **`.png`** (usa `.jpg` solo para fotos).

**Ejemplos:**

```
01-app-mapa-3d-general.png
02-app-mapa-modo-libre.png
03-app-chat-conversacion.png
10-backend-pytest-verde.png
11-backend-swagger-docs.png
12-backend-render-dashboard.png
20-repo-documents-github.png
30-gestion-product-backlog.png
40-diagrama-arquitectura-general.png
```

> Sugerencia: usa el mismo `NN` que el número de slide donde irá la captura,
> para ubicarlas rápido al armar Canva.

---

## Checklist de capturas

### De la app (emulador o dispositivo)
- [ ] `app` — Onboarding
- [ ] `app` — Welcome / Login
- [ ] `app` — Mapa 3D, vista general (la más vistosa)
- [ ] `app` — Mapa 3D, modo libre (street view) + chips de filtro
- [ ] `app` — Mapa con avatar / ubicación
- [ ] `app` — Asistente: conversación con burbujas + LocationCard ("Ver en mapa")
- [ ] `app` — Perfil

### Del código / herramientas
- [ ] `backend` — VS Code: árbol `backend/app/rag/` y un archivo (ej. `engine.py`)
- [ ] `backend` — Terminal: `pytest` → "37 passed"
- [ ] `backend` — Swagger UI (`/docs`) del backend desplegado
- [ ] `backend` — Respuesta JSON de `/api/chat` (la de `draw_route` + `destination`)
- [ ] `backend` — Navegador: `/health` respondiendo
- [ ] `backend` — Dashboard de Render con el servicio "Live"
- [ ] `backend` — `render.yaml` en el editor
- [ ] `repo` — GitHub: carpeta `documents/` (los documentos)
- [ ] `repo` — GitHub: un doc renderizado con un diagrama Mermaid

### Documentos de gestión (entregables)
- [ ] `gestion` — Planning Document (portada + índice)
- [ ] `gestion` — Product Backlog (tabla o tablero)
- [ ] `gestion` — User Stories (una con criterios de aceptación)
- [ ] `gestion` — Roadmap / Gantt (o timeline)

### Diagramas (ya están en los documentos)

No necesitas crearlos: los diagramas viven como **Mermaid** dentro de
`documents/*.md` y se renderizan solos en GitHub. Para llevarlos a las slides,
ábrelos en [mermaid.live](https://mermaid.live) y expórtalos como PNG/SVG.

| Diagrama | Dónde está |
|----------|------------|
| Arquitectura general (implementado vs. planificado) | `01-arquitectura-general.md` |
| ¿Qué es RAG? y pipeline de consulta | `03-backend-rag.md` |
| Pipeline de ingesta | `07-avance-backend.md` |
| Despliegue | `01-arquitectura-general.md` · `08-despliegue-render.md` |
| Secuencia Chat→Mapa | `05-flujos.md` |
| Cronograma (Gantt) | `06-backlog-y-roadmap.md` |
