# OndeSanMarcos

Web responsive para orientarse en el campus de la **UNMSM**: mapa 3D con los lugares del campus y un asistente (RAG) que responde dudas. Sin registro ni login.

> **Rama `feat/web`.** Esta rama reconstruye la app como web (Vite + React) y deja de ser una app móvil. La app Expo anterior sigue en `frontend/` solo como referencia y se borra en la historia HU-20. En `main` todavía está la versión móvil.

## Estado

Se trabaja por historias de usuario (HU) con Spec-Driven Development. **8 de 23 hechas**: base del proyecto, diseño y navegación, mapa, lugares con filtros, búsqueda y ficha de lugar, además de la base de datos del asistente (Postgres + pgvector en Docker). Siguen la conexión con el backend, el chat, las rutas y la ubicación del usuario.

- Resumen y detalle de cada historia: [`web-docs/histories.md`](web-docs/histories.md)
- Plan técnico: [`web-docs/plan.md`](web-docs/plan.md)
- Cómo se escribe cada historia (spec, plan y tareas): [`web-docs/spec/README.md`](web-docs/spec/README.md)

Por ahora la interfaz está pensada **solo para escritorio** (≥ 1024 px). La adaptación a móvil es la historia HU-21.

## Estructura

| Carpeta | Contenido |
|---|---|
| `web/` | La web: Vite + React + TypeScript + Tailwind CSS v4. |
| `backend/` | API FastAPI con el asistente RAG (Python 3.11+) y las migraciones de la base (`backend/db/migrations`). |
| `web-docs/` | Plan, historias de usuario y specs de la web. |
| `documents/` | Documentación del proyecto original (describe la app móvil; sin actualizar). |
| `script/` | `dev.sh`, para levantar todo con Docker. |
| `frontend/` | App móvil anterior (Expo). Solo referencia; se elimina en HU-20. |

## Inicio rápido (Docker)

Requiere Docker con `docker compose`.

```sh
./script/dev.sh            # base de datos + backend :8000 + web :5173 (Ctrl+C detiene)
./script/dev.sh up -d      # en segundo plano
./script/dev.sh logs web   # logs de un servicio (db | migrate | backend | web)
./script/dev.sh test       # tests del backend (con integración) y de la web
./script/dev.sh down       # detener (la base de datos se conserva)
```

Base de datos del asistente (Postgres + pgvector en un contenedor):

```sh
./script/dev.sh ingest     # carga el corpus en la base (una vez; consume llamadas a Gemini)
./script/dev.sh psql       # consola SQL
./script/dev.sh db-dump    # copia de seguridad de los vectores
./script/dev.sh db-restore # restaura el último dump, sin gastar cuota de Gemini
./script/dev.sh db-reset   # BORRA la base (pide confirmación)
```

- Web: http://localhost:5173
- API: http://localhost:8000/docs (Swagger) y http://localhost:8000/health
- Base de datos: `localhost:5432` (usuario, contraseña y base: `ondesanmarcos`; solo desarrollo)

La primera vez crea `backend/.env` y `web/.env` desde sus `.env.example`. El backend arranca en **modo mock** (`RAG_USE_MOCK=true`): no usa la base de datos ni necesita llaves de LLM. Para respuestas reales: `RAG_USE_MOCK=false`, `LLM_PROVIDER=gemini` y `LLM_API_KEY` en `backend/.env`, y `./script/dev.sh ingest` una vez.

### Token de Mapbox

El mapa necesita un token **público** de Mapbox (empieza con `pk.`). Se crea gratis en https://account.mapbox.com/access-tokens/ y se pega en `web/.env`:

```sh
VITE_MAPBOX_TOKEN=pk.eyJ1...
```

Hay que reiniciar el servidor después de cambiarlo. Sin token, la página del mapa muestra un aviso. Nunca uses el token secreto (`sk.`) en la web.

## Sin Docker

### Web

Requiere Node 20+.

```sh
cd web
cp .env.example .env     # y completa VITE_MAPBOX_TOKEN
npm install
npm run dev              # http://localhost:5173
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | servidor de desarrollo |
| `npm run build` | revisa tipos y genera `dist/` |
| `npm run test` | tests (Vitest) |
| `npm run lint` | oxlint |

Variables de `web/.env`: `VITE_API_URL` (por defecto `http://localhost:8000`), `VITE_MAPBOX_TOKEN`, `VITE_USE_MOCK_CHAT` y `VITE_ENABLE_DEV_LOGS`.

### Backend

Requiere Python 3.11+.

```sh
cd backend
python -m venv .venv
source .venv/bin/activate        # en Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # en Windows: copy .env.example .env
uvicorn app.main:app --reload
python -m pytest                 # tests
```

Para respuestas reales (no mock) hacen falta `LLM_API_KEY` (Gemini) y `DATABASE_URL` (un Postgres con pgvector; `./script/dev.sh` ya levanta uno) en `backend/.env`, y cargar el corpus con la ingesta. Detalles y cuidado de la cuota de Gemini en [`backend/README.md`](backend/README.md).

## Flujo de trabajo

- Una historia por commit: `feat(web): HU-XX …`, con su spec, plan, tareas y código juntos.
- Cada historia tiene una carpeta `web-docs/spec/HU-XX/` con `spec.md` (qué), `plan.md` (cómo) y `task.md` (tareas).
- Los tests citan el requisito que cubren, por ejemplo `RF-11.7`. Para encontrarlos: `grep -rn "RF-11.7" web/src web-docs`.
- Los datos de los lugares (horarios, teléfonos, carreras) vienen de la app anterior y están **sin verificar** con la universidad.
