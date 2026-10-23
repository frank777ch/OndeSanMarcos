# OndeSanMarcos Web

Web responsive (Vite + React + TypeScript) para orientarse en el campus de la UNMSM. Sin login ni registro.

## Requisitos
- Node 20+
- Backend FastAPI corriendo (ver `../backend/README.md`) o `VITE_USE_MOCK_CHAT=true`

## Todo con Docker (recomendado)
Desde la raíz del repo:
```bash
./script/dev.sh          # backend :8000 + web :5173 (Ctrl+C detiene)
./script/dev.sh up -d    # en segundo plano
./script/dev.sh logs web # logs de un servicio
./script/dev.sh test     # tests de backend y web
./script/dev.sh down     # detener (clean = también borra volúmenes)
```
Crea `backend/.env` y `web/.env` desde sus `.env.example` si faltan. El backend arranca en modo mock (sin llaves). Completa `VITE_MAPBOX_TOKEN` en `web/.env` para ver el mapa.

## Sin Docker
```bash
cp .env.example .env   # y completa VITE_MAPBOX_TOKEN
npm install
npm run dev            # http://localhost:5173
```

## Scripts
| Comando | Qué hace |
|---|---|
| `npm run dev` | servidor de desarrollo |
| `npm run build` | revisa tipos y genera `dist/` |
| `npm run test` | corre los tests (Vitest) |
| `npm run lint` | oxlint |

El alias `@/` apunta a `src/`.

## Estilos
Tailwind CSS v4. Los tokens (colores, fuentes, radios, sombras) están en `@theme` dentro de `src/index.css`; el tema oscuro los redefine con `data-theme="dark"`.
