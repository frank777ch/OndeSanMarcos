#!/usr/bin/env bash
# Levanta todo en contenedores: base de datos (Postgres + pgvector :5432), migraciones, backend
# (FastAPI :8000) y web (Vite :5173), como se hacía antes de que ./scripts/dev.sh pasara a
# correr el backend y la web en local. Útil para comprobar que funciona sin depender de tu
# máquina (Python, Node). Requiere solo Docker con `docker compose`.
#
# Uso: ./scripts/preview.sh [comando] [args]
#   up          (por defecto) carga los lugares y categorías, construye y levanta todo en primer plano (Ctrl+C detiene).
#               Escucha en 0.0.0.0: abre http://<IP-de-tu-Mac>:5173 desde el celular (misma wifi)
#   up -d       levanta en segundo plano
#   down        detiene y elimina los contenedores (la base de datos se conserva)
#   logs        sigue los logs (acepta un servicio: db | migrate | backend | web)
#   restart     reinicia los servicios
#   clean       down + borra el volumen de node_modules de la web. NO borra la base de datos
#   test        corre los tests del backend (incluye integración) y de la web, en contenedores
#
# Los comandos de la base de datos (ingest, seed-places, reindex-places, psql, db-dump, db-snapshot, db-restore, db-reset)
# están en ./scripts/dev.sh.
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  echo "Error: se necesita Docker con el plugin 'docker compose'." >&2
  exit 1
fi

compose() { docker compose -f docker-compose.yml -f docker-compose.preview.yml "$@"; }

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

# Los puertos 8000 y 5173 son los mismos que usa ./scripts/dev.sh: no pueden correr a la vez.
if [ -f .dev/backend.pid ] && kill -0 "$(cat .dev/backend.pid)" 2>/dev/null; then
  echo "Error: ./scripts/dev.sh tiene el backend corriendo en local. Detenlo con ./scripts/dev.sh down." >&2
  exit 1
fi

# Levanta solo la base y espera a que las migraciones terminen.
ensure_db() {
  compose up -d db >/dev/null
  compose run --rm migrate >/dev/null
}

# Carga los lugares y categorías del campus (db/seed/places.json) para que el mapa no salga vacío.
# Es idempotente: no pisa lo que ya existe en la base.
seed_places() {
  ensure_db
  compose run --rm --no-deps backend python -m app.places.seed
}

# IP de la red local, para abrir la web desde el celular (vacía si no se detecta).
lan_ip() {
  ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null \
    || hostname -I 2>/dev/null | awk '{print $1}' || true
}

cmd="${1:-up}"
[ $# -gt 0 ] && shift

case "$cmd" in
  up)
    echo "Backend: http://localhost:8000/docs   Web: http://localhost:5173   Base de datos: localhost:${DB_PORT:-5432}"
    # La web y el backend escuchan en 0.0.0.0. Desde el celular «localhost» sería el
    # propio celular, así que la web apunta al backend por la IP de la red local.
    ip="$(lan_ip)"
    if [ -n "$ip" ]; then
      export LAN_API_URL="http://$ip:8000"
      echo "Celular (misma red wifi): http://$ip:5173"
    fi
    seed_places
    compose up --build "$@"
    ;;
  down) compose down "$@" ;;
  logs) compose logs -f "$@" ;;
  restart) compose restart "$@" ;;
  clean)
    # Solo se borran los contenedores y node_modules. El volumen de la base de datos
    # (db_data) NO se toca: regenerar los vectores gasta la cuota de Gemini.
    compose down
    project="${COMPOSE_PROJECT_NAME:-$(basename "$PWD" | tr '[:upper:]' '[:lower:]')}"
    docker volume rm "${project}_web_node_modules" >/dev/null 2>&1 || true
    echo "Listo. La base de datos se conservó (usa ./scripts/dev.sh db-reset para borrarla)."
    ;;
  test)
    ensure_db
    # El backend corre unitarias + integración (usa su propia base «_test»; no toca la de desarrollo).
    compose run --rm --no-deps backend python -m pytest
    compose run --rm --no-deps web sh -c \
      "cmp -s package-lock.json node_modules/.lock-copy || (npm ci --no-audit --no-fund && cp package-lock.json node_modules/.lock-copy); npm run test"
    ;;
  *)
    echo "Comando desconocido: $cmd" >&2
    awk 'NR > 1 && /^#/ { print; next } NR > 1 { exit }' "$0" >&2
    exit 1
    ;;
esac
