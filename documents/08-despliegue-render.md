# 8. Despliegue del backend en Render

Guía para desplegar el **backend RAG** (FastAPI) en [Render](https://render.com)
de forma **independiente del frontend**. Al terminar tendrás una URL pública
HTTPS que tu equipo puede consumir (`GET /health`, `POST /api/chat`, `/docs`).

El despliegue se hace con un **Blueprint** de Render: el archivo
[`render.yaml`](../render.yaml) (en la raíz del repo) describe el servicio como
*Infraestructura como Código*, así que el deploy es **declarativo y
reproducible** desde el propio repositorio.

> El backend corre en **modo mock** (`RAG_USE_MOCK=true`): sin LLM ni base
> vectorial externa, sin llaves. Es autocontenido. Ver detalle del motor en
> [07-avance-backend](./07-avance-backend.md).

---

## 8.1 El backend está en una subcarpeta

El repo es un monorepo: el backend vive en **`backend/`**, no en la raíz.

```
OndeSanMarcos/
├── render.yaml          ← blueprint de Render (en la RAÍZ, obligatorio aquí)
├── backend/             ← el servicio que se despliega
│   ├── app/main.py      ←   app FastAPI (objetivo: app.main:app)
│   ├── requirements.txt ←   dependencias núcleo
│   └── ...
└── frontend/            ← NO se despliega aquí
```

Render necesita saber que la carpeta raíz del servicio es `backend/`. Eso lo
resuelve **`rootDir: backend`** en `render.yaml`: Render ejecuta el build y el
arranque *dentro* de `backend/`, así que `requirements.txt` y el paquete `app`
se resuelven sin prefijos.

---

## 8.2 Requisitos previos

1. El código ya está en GitHub (rama `main`) — hecho.
2. Una cuenta en [render.com](https://render.com) (puedes entrar con GitHub).
3. Autorizar a Render a leer este repositorio.

---

## 8.3 Desplegar con el Blueprint

El archivo [`render.yaml`](../render.yaml) ya define todo el servicio, así que el
despliegue son cuatro pasos:

1. En Render: **New +** → **Blueprint**.
2. Conecta el repositorio `OndeSanMarcos` y elige la rama `main`.
3. Render detecta `render.yaml` y muestra el servicio `ondesanmarcos-backend`.
4. **Apply** → Render hace el primer build y deploy.

> Render lee el `render.yaml` **desde GitHub**: cualquier cambio al blueprint
> debe estar commiteado y pusheado antes de aplicar.

### Qué declara el `render.yaml`

Estos ajustes salen del archivo (no se configuran a mano):

| Ajuste | Valor |
|--------|-------|
| Carpeta del servicio (`rootDir`) | `backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health Check | `/health` |
| Plan / Runtime | `free` · Python |
| Auto-deploy | sí (cada push a `main` redepliega) |

> El Start Command usa `--port $PORT` (Render asigna el puerto por esa variable,
> no es fijo) y `--host 0.0.0.0` para que el servicio sea accesible.

---

## 8.4 Variables de entorno

Declaradas en `render.yaml` (no son secretas en modo mock):

| Variable | Valor | Para qué |
|----------|-------|----------|
| `PYTHON_VERSION` | `3.11.9` | El código requiere Python 3.11+. |
| `RAG_USE_MOCK` | `true` | Corre el motor sin LLM ni Supabase (no tocar aún). |
| `CORS_ORIGINS` | `*` | Abierto; la app móvil nativa no aplica CORS. |
| `APP_ENV` | `production` | Marca el entorno. |

Todas tienen valor por defecto seguro en `app/config.py`, así que el servicio
arranca aunque falte alguna; se declaran explícitas para dejar la intención clara.

---

## 8.5 Verificar que quedó arriba

Render te da una URL tipo `https://ondesanmarcos-backend.onrender.com`.

```bash
# 1. Salud
curl https://ondesanmarcos-backend.onrender.com/health
# -> {"status":"ok","service":"OndeSanMarcos RAG API","version":"..."}

# 2. Consulta real al asistente
curl -X POST https://ondesanmarcos-backend.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "horario de la biblioteca"}'

# 3. Documentación interactiva (en el navegador)
#    https://ondesanmarcos-backend.onrender.com/docs
```

Pásale a tu equipo la **URL base** + `/docs`: ahí prueban los endpoints sin código.

---

## 8.6 Qué consume el frontend

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| `POST` | `/api/chat` | `{ "query": string }` | `{ answer, locations[], draw_route, destination? }` |
| `GET`  | `/health` | — | `{ status, service, version }` |

`LocationResult = { id, name, schedule? }` · `Coordinate = { latitude, longitude }`.

En el frontend (Expo) basta apuntar la URL del backend y apagar su mock del chat
(`EXPO_PUBLIC_API_URL` → URL de Render; `EXPO_PUBLIC_USE_MOCK_CHAT=false`).

> **Nota honesta:** en modo mock las respuestas son **deterministas y limitadas
> a un corpus de ejemplo**. Sirve para cablear la integración (forma de la
> respuesta, "Ver en mapa", `draw_route`), no como Q&A real todavía.

---

## 8.7 Detalles del plan gratis

- **Cold start:** el servicio se **duerme tras ~15 min** sin tráfico; el primer
  request luego tarda ~50s en responder. Normal en el tier free.
- **Redeploys automáticos:** con `autoDeploy: true`, cada push a `main` redepliega.
- Si el cold start molesta en las pruebas, evalúa Railway (no se duerme) o el
  plan de pago de Render.

---

## 8.8 Más adelante: proveedores reales

Cuando haya llaves y base vectorial, **sin redesplegar código**, solo cambian
variables de entorno (ver `app/rag/providers.py` y `requirements-rag.txt`):

| Variable | Ejemplo | Nota |
|----------|---------|------|
| `RAG_USE_MOCK` | `false` | Activa proveedores reales. |
| `LLM_PROVIDER` | `openai` / `anthropic` | Proveedor del LLM. |
| `LLM_API_KEY` | `sk-...` | Llave del proveedor. |
| `LLM_MODEL` | `gpt-4o-mini` / `claude-haiku-4-5-20251001` | Modelo. |
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | — | Para pgvector (recuperación real, **pendiente** de implementar). |

> En modo real habría que añadir `requirements-rag.txt` al build y la
> recuperación con pgvector todavía no está implementada
> (`_build_pgvector_retriever` lanza un error con instrucciones).
