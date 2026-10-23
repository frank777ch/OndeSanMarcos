#!/usr/bin/env bash
# Levanta backend (FastAPI :8000) y web (Vite :5173) con Docker.
#
# Uso: ./script/dev.sh [comando] [args de docker compose]
#   up        (por defecto) construye y levanta todo en primer plano (Ctrl+C detiene)
#   up -d     levanta en segundo plano
#   down      detiene y elimina los contenedores
#   logs      sigue los logs (acepta un servicio: backend | web)
#   restart   reinicia los servicios
#   clean     down + borra volúmenes (reinstala node_modules desde cero)
#   test      corre los tests del backend (pytest) y de la web (vitest)
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  echo "Error: se necesita Docker con el plugin 'docker compose'." >&2
  exit 1
fi

# Crea los .env desde los ejemplos si no existen.
# El backend arranca en modo mock (RAG_USE_MOCK=true): no necesita llaves.
ensure_env() {
  local dir="$1"
  if [ ! -f "$dir/.env" ] && [ -f "$dir/.env.example" ]; then
    cp "$dir/.env.example" "$dir/.env"
    echo "Creado $dir/.env desde $dir/.env.example"
  fi
}
ensure_env backend
ensure_env web

if grep -q "REEMPLAZAR" web/.env 2>/dev/null; then
  echo "Aviso: falta VITE_MAPBOX_TOKEN en web/.env (el mapa no cargará hasta definirlo)."
fi

cmd="${1:-up}"
[ $# -gt 0 ] && shift

case "$cmd" in
  up)
    echo "Backend: http://localhost:8000/docs   Web: http://localhost:5173"
    docker compose up --build "$@"
    ;;
  down) docker compose down "$@" ;;
  logs) docker compose logs -f "$@" ;;
  restart) docker compose restart "$@" ;;
  clean) docker compose down -v "$@" ;;
  test)
    docker compose run --rm --no-deps backend python -m pytest -q
    docker compose run --rm --no-deps web sh -c \
      "cmp -s package-lock.json node_modules/.lock-copy || (npm ci --no-audit --no-fund && cp package-lock.json node_modules/.lock-copy); npm run test"
    ;;
  *)
    echo "Comando desconocido: $cmd" >&2
    sed -n '2,12p' "$0" >&2
    exit 1
    ;;
esac
