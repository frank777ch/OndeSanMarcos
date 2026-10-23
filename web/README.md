# OndeSanMarcos Web

Web responsive (Vite + React + TypeScript) para orientarse en el campus de la UNMSM. Sin login ni registro.

## Requisitos
- Node 20+
- Backend FastAPI corriendo (ver `../backend/README.md`) o `VITE_USE_MOCK_CHAT=true`

## Uso
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
