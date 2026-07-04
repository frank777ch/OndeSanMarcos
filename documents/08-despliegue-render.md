# 8. Despliegue del backend en Render

Guía para desplegar el **backend RAG** (FastAPI) en [Render](https://render.com)
de forma **independiente del frontend**. Al terminar tendrás una URL pública
HTTPS que tu equipo puede consumir (`GET /health`, `POST /api/chat`, `/docs`).

El despliegue se hace con un **Blueprint** de Render: el archivo
[`render.yaml`](../render.yaml) (en la raíz del repo) describe el servicio como
*Infraestructura como Código*, así que el deploy es **declarativo y
reproducible** desde el propio repositorio.

> El backend corre con **LLM real** (`RAG_USE_MOCK=false`, proveedor **Gemini**):
> genera respuestas ancladas al corpus oficial del campus. La recuperación es
> **local** (bag-of-words sobre el corpus); Supabase + pgvector siguen pendientes.
> Requiere el secreto `LLM_API_KEY` (ver §8.4). Detalle del motor en
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
| Build Command | `pip install -r requirements.txt -r requirements-llm.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health Check | `/health` |
| Plan / Runtime | `free` · Python |
| Auto-deploy | sí (cada push a `main` redepliega) |

> El Start Command usa `--port $PORT` (Render asigna el puerto por esa variable,
> no es fijo) y `--host 0.0.0.0` para que el servicio sea accesible.

---

## 8.4 Variables de entorno

Las no secretas se declaran en `render.yaml`; la llave del LLM es un **secreto**
(`sync: false`) que se ingresa en el dashboard de Render, nunca en el repo:

| Variable | Valor | Para qué |
|----------|-------|----------|
| `PYTHON_VERSION` | `3.11.9` | El código requiere Python 3.11+. |
| `RAG_USE_MOCK` | `false` | Usa el LLM real (Gemini) en vez del mock. |
| `LLM_PROVIDER` | `gemini` | Proveedor del LLM. |
| `LLM_MODEL` | `gemini-2.5-flash` | Modelo de Gemini. |
| `LLM_API_KEY` | *(secreto)* | Llave de Google AI Studio. **Se pone en el dashboard** (`sync: false`). |
| `CORS_ORIGINS` | `*` | Abierto; la app móvil nativa no aplica CORS. |
| `APP_ENV` | `production` | Marca el entorno. |

> **Importante:** con `RAG_USE_MOCK=false`, si falta `LLM_API_KEY` el endpoint
> `/api/chat` responde **503** (`/health` sigue 200). Define el secreto en Render
> (**Environment → Add Environment Variable**) antes o junto con el primer deploy.

Las demás tienen valor por defecto seguro en `app/config.py`, así que el servicio
arranca aunque falte alguna.

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

> **Nota honesta:** el LLM real (Gemini) genera respuestas naturales ancladas al
> **corpus oficial** del campus. La recuperación es **local** (bag-of-words), no
> aún pgvector, así que la cobertura depende del corpus cargado; suficiente para
> Q&A real del campus, con margen de mejora al migrar a embeddings + pgvector.

---

## 8.7 Detalles del plan gratis

- **Cold start:** el servicio se **duerme tras ~15 min** sin tráfico; el primer
  request luego tarda ~50s en responder. Normal en el tier free.
- **Redeploys automáticos:** con `autoDeploy: true`, cada push a `main` redepliega.
- Si el cold start molesta en las pruebas, evalúa Railway (no se duerme) o el
  plan de pago de Render.

---

## 8.8 Recuperación con pgvector (Supabase)

El **LLM real (Gemini)** y la **recuperación con pgvector** ya están
implementados. El `render.yaml` declara `SUPABASE_URL` y activa pgvector cuando
existe también el secreto `SUPABASE_SERVICE_KEY`; sin ese secreto el servicio cae
con gracia a la recuperación **local** (bag-of-words), sin romperse.

| Variable | Valor | Nota |
|----------|-------|------|
| `LLM_PROVIDER` / `LLM_MODEL` | `gemini` / `gemini-2.5-flash` | También soporta `openai`/`anthropic`. |
| `LLM_API_KEY` | *(secreto)* | Llave de Gemini; también la usan los embeddings. |
| `SUPABASE_URL` | `https://<ref>.supabase.co` | URL del proyecto (no secreta, en el `render.yaml`). |
| `SUPABASE_SERVICE_KEY` | *(secreto)* | `service_role` key; se ingresa en el dashboard. |

> El build instala `requirements-llm.txt` (Gemini) y `requirements-pgvector.txt`
> (cliente `supabase`). La tabla/función de la base se crean con
> `backend/db/schema.sql` y se pueblan con `python -m app.rag.ingest_pgvector`.
> Guía completa y evidencia local en [`09-pgvector-supabase.md`](./09-pgvector-supabase.md).
