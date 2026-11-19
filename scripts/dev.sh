#!/usr/bin/env bash
# Entorno de desarrollo: la base de datos (Postgres + pgvector :5432) y las migraciones corren
# en Docker; el backend (FastAPI :8000) y la web (Vite :5173) corren en tu máquina, con recarga
# automática al editar el código.
#
# Requisitos: Docker (con `docker compose`), Python 3.11 o superior y Node.js con npm.
#
# Uso: ./scripts/dev.sh [comando] [args]
#   up          (por defecto) levanta todo y muestra los logs (Ctrl+C detiene backend y web).
#               Escucha en 0.0.0.0: abre http://<IP-de-tu-Mac>:5173 desde el celular (misma wifi)
#   up -d       levanta todo en segundo plano (logs en .dev/)
#   down        detiene backend y web y elimina los contenedores (la base de datos se conserva)
#   logs        sigue los logs (acepta un servicio: db | migrate | backend | web)
#   restart     reinicia el backend y la web
#   clean       down + borra backend/.venv y web/node_modules. NO borra la base de datos
#   test        corre los tests del backend (incluye integración) y de la web
#
# Base de datos (los vectores del asistente cuestan llamadas a Gemini: se cuidan):
#   ingest [--force]   embebe el corpus y lo carga en la base. Se niega si ya hay datos
#   reindex-places     vuelve a sincronizar todos los lugares con el asistente (una llamada a Gemini por lugar)
#   reindex-events     vuelve a sincronizar todos los eventos con el asistente (una llamada a Gemini por fragmento)
#   seed-places        carga los lugares del campus (backend/db/seed/places.json). No pisa lo que ya existe.
#                      `up` lo ejecuta solo si la tabla places está vacía (base nueva): así no vuelve a crear
#                      un lugar que borraste desde el panel
#   place-images       sube las portadas de los lugares a Garage (almacén S3 en Docker) y las enlaza en la base.
#                      También se ejecuta al hacer `up`. No pisa un image_url ya puesto
#   psql               abre una consola SQL de la base
#   db-dump            guarda los datos en backend/db/dumps/ (no llama a Gemini)
#   db-snapshot        guarda los vectores como migración de Flyway (R__documents_snapshot.sql). Se versiona
#                      en git: quien clone el repo los recibe al levantar la base, sin llamar a Gemini.
#                      Solo llena una tabla vacía; para actualizar una base con datos usa db-restore o ingest --force
#   db-restore [file]  restaura los datos desde un dump (por defecto, el último)
#   db-reset [--yes]   BORRA la base de datos y la recrea vacía. Pide confirmación
#
# Variables opcionales: PYTHON (intérprete para crear el venv), DB_PORT (puerto de la base).
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$PWD"

DB_USER=ondesanmarcos
DB_NAME=ondesanmarcos
DUMP_DIR=backend/db/dumps
STATE_DIR="$ROOT/.dev"
VENV="$ROOT/backend/.venv"

if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  echo "Error: se necesita Docker con el plugin 'docker compose'." >&2
  exit 1
fi

# El backend y los scripts de la base usan siempre la base de Docker publicada en localhost.
# La variable de entorno tiene prioridad sobre backend/.env.
export DATABASE_URL="postgresql://$DB_USER:$DB_USER@localhost:${DB_PORT:-5432}/$DB_NAME"

# Almacén de imágenes de los lugares (Garage, en Docker): el backend sube ahí las portadas desde el panel.
set -a
# shellcheck disable=SC1091
. infra/garage/dev.env
set +a

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
  echo "Aviso: falta VITE_MAPBOX_TOKEN en web/.env (el selector de ubicación del admin no cargará hasta definirlo)."
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

# Cuántos lugares hay en la tabla places (vacío si la base no responde).
places_in_db() {
  docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" -Atc "select count(*) from places" 2>/dev/null || true
}

# Carga los lugares del campus solo en una base nueva (places vacía), para que el mapa no salga vacío.
# Con lugares ya cargados no hace nada: respeta lo que se editó o borró desde el panel.
# Es opcional: si falla, el resto del entorno sigue arrancando.
seed_places_if_empty() {
  local count
  count="$(places_in_db)"
  if [ "$count" = "0" ]; then
    echo "Base nueva: cargando los lugares del campus..."
    (cd backend && "$VENV/bin/python" -m app.places.seed) \
      || echo "Aviso: no se pudieron cargar los lugares. Reintenta con ./scripts/dev.sh seed-places" >&2
  fi
}

# Levanta solo la base y espera a que las migraciones terminen.
# --remove-orphans limpia los contenedores de backend y web que dejó la versión anterior del script.
ensure_db() {
  docker compose up -d --remove-orphans db >/dev/null
  docker compose run --rm migrate >/dev/null
}

# Primer intérprete de Python 3.11 o superior (o el de $PYTHON).
find_python() {
  local candidate
  for candidate in "${PYTHON:-}" python3.14 python3.13 python3.12 python3.11 python3; do
    [ -n "$candidate" ] || continue
    if command -v "$candidate" >/dev/null 2>&1 \
      && "$candidate" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)' 2>/dev/null; then
      command -v "$candidate"
      return 0
    fi
  done
  echo "Error: se necesita Python 3.11 o superior (por ejemplo: brew install python@3.14, o PYTHON=/ruta/a/python)." >&2
  return 1
}

# Crea backend/.venv y instala las dependencias; solo reinstala si cambió algún requirements.
ensure_backend_deps() {
  local py files hash
  files=(backend/requirements.txt backend/requirements-llm.txt backend/requirements-pgvector.txt)
  if [ ! -x "$VENV/bin/python" ]; then
    py="$(find_python)"
    echo "Creando backend/.venv con $("$py" --version)..."
    "$py" -m venv "$VENV"
  fi
  hash="$(cat "${files[@]}" | shasum | cut -d' ' -f1)"
  if [ "$(cat "$VENV/.requirements-hash" 2>/dev/null || true)" != "$hash" ]; then
    echo "Instalando dependencias del backend..."
    "$VENV/bin/python" -m pip install --quiet --disable-pip-version-check \
      -r backend/requirements.txt -r backend/requirements-llm.txt -r backend/requirements-pgvector.txt
    echo "$hash" > "$VENV/.requirements-hash"
  fi
}

# Instala las dependencias de la web con `npm ci` solo si package-lock.json cambió
# (no modifica el lockfile del repo).
ensure_web_deps() {
  if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    echo "Error: se necesita Node.js con npm." >&2
    return 1
  fi
  if ! cmp -s web/package-lock.json web/node_modules/.lock-copy 2>/dev/null; then
    echo "Instalando dependencias de la web..."
    (cd web && npm ci --no-audit --no-fund && cp package-lock.json node_modules/.lock-copy)
  fi
}

# IP de la red local, para abrir la web desde el celular (vacía si no se detecta).
lan_ip() {
  ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null \
    || hostname -I 2>/dev/null | awk '{print $1}' || true
}

# Define LAN_API_URL y muestra las direcciones. Desde el celular «localhost» sería el propio
# celular, así que la web apunta al backend por la IP de la red local.
announce() {
  local ip
  echo "Backend: http://localhost:8000/docs   Web: http://localhost:5173   Base de datos: localhost:${DB_PORT:-5432}"
  ip="$(lan_ip)"
  if [ -n "$ip" ]; then
    export LAN_API_URL="http://$ip:8000"
    echo "Celular (misma red wifi): http://$ip:5173"
  fi
}

# --- Procesos locales (backend y web) -------------------------------------------------------

service_pid() { cat "$STATE_DIR/$1.pid" 2>/dev/null || true; }

service_running() {
  local pid
  pid="$(service_pid "$1")"
  [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null
}

# start_service <nombre> <directorio> <comando...>
# Cada servicio corre en su propio grupo de procesos (set -m), para poder detenerlo con todos
# sus hijos (uvicorn --reload y vite lanzan procesos propios). Su salida va a .dev/<nombre>.log.
start_service() {
  local name="$1" dir="$2"
  shift 2
  if service_running "$name"; then
    echo "$name ya está corriendo (pid $(service_pid "$name"))."
    return 0
  fi
  mkdir -p "$STATE_DIR"
  : > "$STATE_DIR/$name.log"
  set -m
  (cd "$dir" && exec "$@") >> "$STATE_DIR/$name.log" 2>&1 &
  echo $! > "$STATE_DIR/$name.pid"
  set +m
}

start_backend() {
  start_service backend backend "$VENV/bin/uvicorn" app.main:app --host 0.0.0.0 --port 8000 --reload --use-colors
}

start_web() {
  start_service web web env FORCE_COLOR=1 "VITE_API_URL=${LAN_API_URL:-http://localhost:8000}" \
    npm run dev -- --host 0.0.0.0 --port 5173
}

stop_service() {
  local name="$1" pid i
  pid="$(service_pid "$name")"
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    kill -TERM -- "-$pid" 2>/dev/null || true
    for i in 1 2 3 4 5 6 7 8 9 10; do
      kill -0 "$pid" 2>/dev/null || break
      sleep 0.3
    done
    kill -KILL -- "-$pid" 2>/dev/null || true
  fi
  rm -f "$STATE_DIR/$name.pid"
}

stop_services() {
  stop_service web
  stop_service backend
}

# Sigue uno o varios logs poniendo el nombre del servicio delante de cada línea.
follow_logs() {
  local name
  for name in "$@"; do
    tail -n +1 -F "$STATE_DIR/$name.log" 2>/dev/null | awk -v p="[$name] " '{ print p $0; fflush() }' &
  done
  wait
}

prepare_local() {
  ensure_db
  ensure_backend_deps
  ensure_web_deps
}

cmd="${1:-up}"
[ $# -gt 0 ] && shift

case "$cmd" in
  up)
    detach=false
    for arg in "$@"; do
      case "$arg" in
        -d | --detach) detach=true ;;
        *) echo "Opción desconocida para up: $arg" >&2; exit 1 ;;
      esac
    done
    prepare_local
    seed_places_if_empty
    # Las portadas son opcionales: si Garage falla, el resto del entorno sigue arrancando.
    ./scripts/place-images.sh || echo "Aviso: no se pudieron cargar las portadas de los lugares." >&2
    announce
    start_backend
    start_web
    if $detach; then
      echo "En segundo plano. Logs: ./scripts/dev.sh logs   Detener: ./scripts/dev.sh down"
      exit 0
    fi
    # En primer plano: Ctrl+C detiene backend y web (la base de datos sigue corriendo).
    trap 'trap - INT TERM EXIT; echo; echo "Deteniendo backend y web..."; stop_services; kill 0 2>/dev/null || true' INT TERM EXIT
    follow_logs backend web &
    while service_running backend && service_running web; do sleep 1; done
    echo "Un servicio terminó; revisa .dev/backend.log y .dev/web.log." >&2
    ;;
  down)
    stop_services
    docker compose down "$@"
    ;;
  logs)
    case "${1:-}" in
      "") follow_logs backend web ;;
      backend | web) tail -n 100 -F "$STATE_DIR/$1.log" ;;
      *) docker compose logs -f "$@" ;;
    esac
    ;;
  restart)
    stop_services
    prepare_local
    announce
    start_backend
    start_web
    echo "Reiniciados. Logs: ./scripts/dev.sh logs"
    ;;
  clean)
    # Solo se borran los contenedores, el venv y node_modules. El volumen de la base de datos
    # (db_data) NO se toca: regenerar los vectores gasta la cuota de Gemini.
    stop_services
    docker compose down
    project="${COMPOSE_PROJECT_NAME:-$(basename "$PWD" | tr '[:upper:]' '[:lower:]')}"
    docker volume rm "${project}_web_node_modules" >/dev/null 2>&1 || true
    rm -rf "$VENV" web/node_modules "$STATE_DIR"
    echo "Listo. La base de datos se conservó (usa ./scripts/dev.sh db-reset para borrarla)."
    ;;
  test)
    ensure_db
    ensure_backend_deps
    ensure_web_deps
    # El backend corre unitarias + integración (usa su propia base «_test»; no toca la de desarrollo).
    (cd backend && "$VENV/bin/python" -m pytest)
    (cd web && npm run test)
    ;;
  ingest)
    ensure_db
    ensure_backend_deps
    (cd backend && "$VENV/bin/python" -m app.rag.ingest_pgvector "$@")
    ;;
  reindex-places)
    ensure_db
    ensure_backend_deps
    (cd backend && "$VENV/bin/python" -m app.places.reindex "$@")
    ;;
  reindex-events)
    ensure_db
    ensure_backend_deps
    (cd backend && "$VENV/bin/python" -m app.events.reindex "$@")
    ;;
  seed-places)
    ensure_db
    ensure_backend_deps
    (cd backend && "$VENV/bin/python" -m app.places.seed "$@")
    ;;
  place-images)
    ensure_db
    ./scripts/place-images.sh
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
  db-snapshot)
    docker compose up -d --wait db >/dev/null
    count="$(rows_in_db)"
    if [ "${count:-0}" = "0" ]; then
      echo "La tabla documents está vacía: no se sobrescribe el snapshot. Corre ./scripts/dev.sh ingest primero." >&2
      exit 1
    fi
    snapshot="backend/db/migrations/R__documents_snapshot.sql"
    {
      echo "-- GENERADO por ./scripts/dev.sh db-snapshot ($count filas). No editar a mano."
      echo "-- Migración repetible: Flyway la vuelve a aplicar cuando cambia este archivo."
      echo "-- Solo llena la tabla si está vacía (base nueva): nunca pisa las fichas de lugar que se crean desde el panel."
      echo "-- Embeddings de gemini-embedding-001 (768 dim): ya no hace falta llamar a Gemini en otra máquina."
      docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" -At -c "select format(E'insert into documents (content, metadata, embedding, source_type, source_id)\nselect content, metadata, embedding, source_type, source_id from (values\n%s\n) as v(content, metadata, embedding, source_type, source_id)\nwhere not exists (select 1 from documents);', string_agg(format('(%L::text, %L::jsonb, %L::vector, %L::text, %L::text)', content, metadata, embedding::text, source_type, source_id), E',\n' order by id)) from documents"
    } > "$snapshot.tmp"
    mv "$snapshot.tmp" "$snapshot"
    echo "Guardado: $snapshot ($count filas, $(du -h "$snapshot" | cut -f1)). Haz commit de ese archivo."
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
    # El backend local mantiene conexiones abiertas: se detiene antes de borrar la base.
    stop_services
    docker compose rm -sf migrate db >/dev/null
    volume="$(docker volume ls -q \
      --filter "label=com.docker.compose.project=${COMPOSE_PROJECT_NAME:-$(basename "$PWD" | tr '[:upper:]' '[:lower:]')}" \
      --filter "label=com.docker.compose.volume=db_data")"
    [ -n "$volume" ] && docker volume rm "$volume" >/dev/null
    ensure_db
    echo "Base de datos recreada y vacía (migraciones aplicadas). Vuelve a levantar con ./scripts/dev.sh"
    ;;
  *)
    echo "Comando desconocido: $cmd" >&2
    awk 'NR > 1 && /^#/ { print; next } NR > 1 { exit }' "$0" >&2
    exit 1
    ;;
esac
