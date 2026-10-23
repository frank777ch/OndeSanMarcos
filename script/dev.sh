#!/usr/bin/env bash
# Levanta la base de datos (Postgres + pgvector :5432), el backend (FastAPI :8000)
# y la web (Vite :5173) con Docker.
#
# Uso: ./script/dev.sh [comando] [args]
#   up          (por defecto) construye y levanta todo en primer plano (Ctrl+C detiene)
#   up -d       levanta en segundo plano
#   down        detiene y elimina los contenedores (la base de datos se conserva)
#   logs        sigue los logs (acepta un servicio: db | migrate | backend | web)
#   restart     reinicia los servicios
#   clean       down + borra node_modules de la web. NO borra la base de datos
#   test        corre los tests del backend (incluye integración) y de la web
#
# Base de datos (los vectores del asistente cuestan llamadas a Gemini: se cuidan):
#   ingest [--force]   embebe el corpus y lo carga en la base. Se niega si ya hay datos
#   psql               abre una consola SQL de la base
#   db-dump            guarda los datos en backend/db/dumps/ (no llama a Gemini)
#   db-restore [file]  restaura los datos desde un dump (por defecto, el último)
#   db-reset [--yes]   BORRA la base de datos y la recrea vacía. Pide confirmación
set -euo pipefail

cd "$(dirname "$0")/.."

DB_USER=ondesanmarcos
DB_NAME=ondesanmarcos
DUMP_DIR=backend/db/dumps

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

# Pide confirmación escribiendo «si». `--yes` la omite.
confirm() {
  local message="$1" force="${2:-}"
  [ "$force" = "--yes" ] && return 0
  read -r -p "$message Escribe 'si' para continuar: " answer
  [ "$answer" = "si" ]
}

# Cuántas filas tiene la tabla documents (vacío si la base no responde).
rows_in_db() {
  docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" -Atc "select count(*) from documents" 2>/dev/null || true
}

# Levanta solo la base y espera a que las migraciones terminen.
ensure_db() {
  docker compose up -d db >/dev/null
  docker compose run --rm migrate >/dev/null
}

cmd="${1:-up}"
[ $# -gt 0 ] && shift

case "$cmd" in
  up)
    echo "Backend: http://localhost:8000/docs   Web: http://localhost:5173   Base de datos: localhost:${DB_PORT:-5432}"
    docker compose up --build "$@"
    ;;
  down) docker compose down "$@" ;;
  logs) docker compose logs -f "$@" ;;
  restart) docker compose restart "$@" ;;
  clean)
    # Solo se borran los contenedores y node_modules. El volumen de la base de datos
    # (db_data) NO se toca: regenerar los vectores gasta la cuota de Gemini.
    docker compose down
    project="${COMPOSE_PROJECT_NAME:-$(basename "$PWD" | tr '[:upper:]' '[:lower:]')}"
    docker volume rm "${project}_web_node_modules" >/dev/null 2>&1 || true
    echo "Listo. La base de datos se conservó (usa ./script/dev.sh db-reset para borrarla)."
    ;;
  test)
    ensure_db
    # El backend corre unitarias + integración (usa su propia base «_test»; no toca la de desarrollo).
    docker compose run --rm --no-deps backend python -m pytest
    docker compose run --rm --no-deps web sh -c \
      "cmp -s package-lock.json node_modules/.lock-copy || (npm ci --no-audit --no-fund && cp package-lock.json node_modules/.lock-copy); npm run test"
    ;;
  ingest)
    ensure_db
    docker compose run --rm --no-deps backend python -m app.rag.ingest_pgvector "$@"
    ;;
  psql)
    docker compose up -d db >/dev/null
    docker compose exec db psql -U "$DB_USER" -d "$DB_NAME" "$@"
    ;;
  db-dump)
    ensure_db
    mkdir -p "$DUMP_DIR"
    file="$DUMP_DIR/documents-$(date +%Y%m%d-%H%M%S).dump"
    docker compose exec -T db pg_dump -U "$DB_USER" -d "$DB_NAME" --data-only --table=documents -Fc > "$file"
    cp "$file" "$DUMP_DIR/documents-latest.dump"
    echo "Guardado: $file (filas en la base: $(rows_in_db))"
    ;;
  db-restore)
    file="${1:-$DUMP_DIR/documents-latest.dump}"
    [ -f "$file" ] || { echo "No existe el archivo: $file" >&2; exit 1; }
    ensure_db
    current="$(rows_in_db)"
    if [ "${current:-0}" != "0" ]; then
      confirm "La tabla tiene $current filas y se reemplazarán por las de $file." "${2:-}" || { echo "Cancelado."; exit 0; }
    fi
    docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" -c "truncate documents restart identity"
    docker compose exec -T db pg_restore -U "$DB_USER" -d "$DB_NAME" --data-only < "$file"
    echo "Restauradas $(rows_in_db) filas desde $file."
    ;;
  db-reset)
    confirm "Se BORRARÁ toda la base de datos (hay que volver a ingerir o restaurar un dump)." "${1:-}" || { echo "Cancelado."; exit 0; }
    docker compose rm -sf backend migrate db >/dev/null
    volume="$(docker volume ls -q \
      --filter "label=com.docker.compose.project=${COMPOSE_PROJECT_NAME:-$(basename "$PWD" | tr '[:upper:]' '[:lower:]')}" \
      --filter "label=com.docker.compose.volume=db_data")"
    [ -n "$volume" ] && docker volume rm "$volume" >/dev/null
    ensure_db
    echo "Base de datos recreada y vacía (migraciones aplicadas)."
    ;;
  *)
    echo "Comando desconocido: $cmd" >&2
    sed -n '2,24p' "$0" >&2
    exit 1
    ;;
esac
