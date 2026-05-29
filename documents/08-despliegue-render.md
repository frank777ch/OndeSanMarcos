# 8. Despliegue del backend en Render

Guía para desplegar el **backend RAG** (FastAPI) en [Render](https://render.com)
de forma **independiente del frontend**. Al terminar tendrás una URL pública
HTTPS que tu equipo puede consumir (`GET /health`, `POST /api/chat`, `/docs`).

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

La clave es decirle a Render que la carpeta raíz del servicio es `backend/`.
Eso se hace con **`rootDir: backend`** en `render.yaml` (ya configurado), o con
el campo **Root Directory = `backend`** si lo creas a mano en el dashboard.
Con `rootDir`, Render ejecuta el build y el arranque *dentro* de `backend/`,
así que `requirements.txt` y el paquete `app` se resuelven sin prefijos.

---

## 8.2 Requisitos previos

1. El código ya está en GitHub (rama `main`) — hecho.
2. Una cuenta en [render.com](https://render.com) (puedes entrar con GitHub).
3. Autorizar a Render a leer este repositorio.

---

## 8.3 Opción A — Blueprint con `render.yaml` (recomendada)

El archivo [`render.yaml`](../render.yaml) en la raíz ya define el servicio.

1. En Render: **New +** → **Blueprint**.
2. Conecta el repositorio `OndeSanMarcos` y elige la rama `main`.
3. Render detecta `render.yaml` y muestra el servicio `ondesanmarcos-backend`.
4. **Apply** → Render hace el primer build y deploy.

Eso es todo. Los valores (carpeta, comandos, variables) salen del archivo.

---

## 8.4 Opción B — A mano desde el dashboard

Si prefieres no usar el blueprint:

1. **New +** → **Web Service** → conecta el repo y rama `main`.
2. Completa los campos:

   | Campo | Valor |
   |-------|-------|
   | **Root Directory** | `backend` |
   | **Runtime / Language** | `Python 3` |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
   | **Health Check Path** | `/health` |
   | **Instance Type** | `Free` |

3. En **Environment**, agrega las variables de la sección 8.5.
4. **Create Web Service**.

> ⚠️ El **Start Command** debe usar `--port $PORT`: Render asigna el puerto por
> la variable `$PORT`, no es fijo. Y `--host 0.0.0.0` para que sea accesible.

---

## 8.5 Variables de entorno

| Variable | Valor | Para qué |
|----------|-------|----------|
| `PYTHON_VERSION` | `3.11.9` | El código requiere Python 3.11+. |
| `RAG_USE_MOCK` | `true` | Corre el motor sin LLM ni Supabase (no tocar aún). |
| `CORS_ORIGINS` | `*` | Abierto; la app móvil nativa no aplica CORS. |
| `APP_ENV` | `production` | Marca el entorno. |

Todas tienen valor por defecto seguro en `app/config.py`, así que el servicio
arranca aunque falte alguna; se declaran explícitas para dejar la intención clara.

---

## 8.6 Verificar que quedó arriba

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

## 8.7 Qué consume el frontend

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

## 8.8 Detalles del plan gratis

- **Cold start:** el servicio se **duerme tras ~15 min** sin tráfico; el primer
  request luego tarda ~50s en responder. Normal en el tier free.
- **Redeploys automáticos:** con `autoDeploy: true`, cada push a `main` redepliega.
- Si el cold start molesta en las pruebas, evalúa Railway (no se duerme) o el
  plan de pago de Render.

---

## 8.9 Más adelante: proveedores reales

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
