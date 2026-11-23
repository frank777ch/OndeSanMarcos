#!/usr/bin/env bash
# Despliegue en el VPS (se corre ahí, dentro del clon del repo: ~/deploys/ondesanmarcos).
# Levanta db, migraciones, Garage, backend y web con docker-compose.prod.yml, detrás del Traefik del servidor.
#
# Uso: ./scripts/deploy.sh [comando] [args]
#   up [--no-pull]     (por defecto) git pull, build, levanta todo y deja listo Garage. En una base nueva
#                      (places vacía) también carga los lugares y portadas de la semilla del repo
#   init               primera vez: crea .env.prod con secretos aleatorios y revisa backend/.env y web/.env
#   restore <carpeta> [--yes]
#                      carga en producción los datos exportados con ./scripts/export-data.sh (lugares,
#                      categorías, eventos, vectores e imágenes). REEMPLAZA esas tablas
#   backup             guarda un dump de la base y una copia de las imágenes en ~/deploys/backups/ondesanmarcos/
#   status             estado de los contenedores
#   logs [servicio]    sigue los logs (db | migrate | garage | backend | web)
#   psql               consola SQL de la base
#   down               detiene y elimina los contenedores (los datos se conservan en volúmenes)
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$PWD"

DB_USER=ondesanmarcos
DB_NAME=ondesanmarcos
IMG_HOST=img.ondesanmarcos.site
BACKUP_DIR="${BACKUP_DIR:-$HOME/deploys/backups/ondesanmarcos}"
IMPORT_DIR="${IMPORT_DIR:-$HOME/deploys/imports/ondesanmarcos}"
BACKUPS_TO_KEEP=14

# Con estas dos variables todos los `docker compose` de este script (y los de place-images.sh) usan producción.
export COMPOSE_FILE=docker-compose.prod.yml
export COMPOSE_ENV_FILES=.env.prod

die() { echo "Error: $*" >&2; exit 1; }
warn() { echo "Aviso: $*" >&2; }

command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1 \
  || die "se necesita Docker con el plugin 'docker compose'."

# Valor de una variable de un archivo KEY=VALUE (sin comillas ni espacios sobrantes).
env_get() {
  local value
  value="$(grep -E "^$2=" "$1" 2>/dev/null | tail -n1 | cut -d= -f2- || true)"
  value="${value%\"}"; value="${value#\"}"; value="${value%\'}"; value="${value#\'}"
  printf '%s' "$value"
}

# Escribe KEY=VALUE en un archivo (reemplaza la línea si ya existía).
env_set() {
  local file="$1" key="$2" value="$3" tmp
  tmp="$(mktemp)"
  grep -v "^$key=" "$file" > "$tmp" || true
  printf '%s=%s\n' "$key" "$value" >> "$tmp"
  cat "$tmp" > "$file"
  rm -f "$tmp"
}

psql_db() { docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 "$@"; }

places_in_db() { psql_db -Atc "select count(*) from places" 2>/dev/null || true; }

# Variables que necesitan los scripts que hablan con Garage (place-images.sh, restore).
load_prod_env() {
  [ -f .env.prod ] || die "falta .env.prod. Corre ./scripts/deploy.sh init"
  set -a
  # shellcheck disable=SC1091
  . ./.env.prod
  set +a
  export GARAGE_ENV_FILE=.env.prod
  export PLACE_IMAGES_ALIAS="$IMG_HOST"
  export GARAGE_S3_PORT="${GARAGE_S3_PORT:-3910}"
  export GARAGE_CAPACITY="${GARAGE_CAPACITY:-20G}"
}

# Revisa backend/.env y web/.env. Faltar un archivo es error; lo demás son avisos.
check_env_files() {
  [ -f backend/.env ] || die "falta backend/.env (copia el de desarrollo)."
  [ -f web/.env ] || die "falta web/.env (copia el de desarrollo)."
  [ "$(env_get backend/.env RAG_USE_MOCK)" = "false" ] \
    || warn "RAG_USE_MOCK no es false en backend/.env: el asistente responderá con el mock, no con Gemini."
  if [ "$(env_get backend/.env RAG_USE_MOCK)" = "false" ]; then
    [ -n "$(env_get backend/.env LLM_API_KEY)" ] || warn "RAG_USE_MOCK=false pero LLM_API_KEY está vacía."
  fi
  [ "$(printf '%s' "$(env_get backend/.env JWT_SECRET)" | wc -c)" -ge 32 ] \
    || die "JWT_SECRET en backend/.env debe tener al menos 32 caracteres (si no, el backend no arranca)."
  [ -n "$(env_get backend/.env ADMIN_PASSWORD)" ] || warn "ADMIN_PASSWORD vacía: no se creará el administrador."
  [ "$(env_get backend/.env ADMIN_PASSWORD)" != "cambia-esta-clave" ] \
    || warn "ADMIN_PASSWORD sigue siendo la de ejemplo. Cámbiala."
  case "$(env_get web/.env VITE_MAPBOX_TOKEN)" in
    pk.*REEMPLAZAR*|"") warn "VITE_MAPBOX_TOKEN no está definido en web/.env: el mapa no cargará." ;;
    pk.*) ;;
    *) warn "VITE_MAPBOX_TOKEN en web/.env no parece un token público (pk.)." ;;
  esac
}

# Deja Garage listo (layout, llave, bucket y alias) sin subir portadas.
garage_setup() {
  local empty
  empty="$(mktemp -d)"
  PLACE_IMAGES_DIR="$empty" ./scripts/place-images.sh
  rmdir "$empty"
}

wait_backend() {
  local id status
  echo "Esperando al backend..."
  for _ in $(seq 1 90); do
    id="$(docker compose ps -q backend)"
    status="$([ -n "$id" ] && docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$id" || true)"
    [ "$status" = "healthy" ] && return 0
    sleep 2
  done
  docker compose logs --tail 40 backend >&2 || true
  die "el backend no quedó healthy. Revisa: ./scripts/deploy.sh logs backend"
}

confirm() {
  [ "${2:-}" = "--yes" ] && return 0
  read -r -p "$1 ¿Continuar? [s/N] " answer
  [ "$answer" = "s" ] || [ "$answer" = "S" ]
}

cmd="${1:-up}"
[ $# -gt 0 ] && shift

case "$cmd" in
  init)
    if [ -f .env.prod ]; then
      echo ".env.prod ya existe: no se toca."
    else
      cp .env.prod.example .env.prod
      chmod 600 .env.prod
      env_set .env.prod POSTGRES_PASSWORD "$(openssl rand -hex 24)"
      env_set .env.prod GARAGE_RPC_SECRET "$(openssl rand -hex 32)"
      env_set .env.prod GARAGE_ADMIN_TOKEN "$(openssl rand -hex 24)"
      env_set .env.prod S3_ACCESS_KEY "GK$(openssl rand -hex 12)"
      env_set .env.prod S3_SECRET_KEY "$(openssl rand -hex 32)"
      echo "Creado .env.prod con secretos aleatorios."
    fi
    docker network inspect proxy >/dev/null 2>&1 \
      || die "no existe la red de Docker 'proxy' (la del Traefik del servidor)."
    mkdir -p "$BACKUP_DIR" "$IMPORT_DIR"
    check_env_files
    echo "Listo. Siguiente: ./scripts/deploy.sh up"
    ;;

  up)
    pull=1
    [ "${1:-}" = "--no-pull" ] && pull=0
    load_prod_env
    check_env_files
    docker network inspect proxy >/dev/null 2>&1 || die "no existe la red de Docker 'proxy'."
    if [ "$pull" = 1 ]; then
      git pull --ff-only
    fi
    docker compose build
    docker compose up -d
    wait_backend
    garage_setup
    count="$(places_in_db)"
    if [ "${count:-0}" = "0" ]; then
      echo "Base nueva: cargando los lugares y portadas de la semilla del repo..."
      docker compose exec -T backend python -m app.places.seed
      PLACE_IMAGES_BASE_URL="https://$IMG_HOST" ./scripts/place-images.sh
      echo "Si tienes datos locales, súbelos con: ./scripts/deploy.sh restore <carpeta>"
    fi
    docker compose ps
    echo
    echo "Web: https://ondesanmarcos.site · API: https://api.ondesanmarcos.site/health · Imágenes: https://$IMG_HOST"
    ;;

  restore)
    dir="${1:-}"
    [ -n "$dir" ] || die "uso: ./scripts/deploy.sh restore <carpeta exportada> [--yes]"
    dir="${dir%/}"
    for f in data.dump counts.txt images/manifest.tsv; do
      [ -f "$dir/$f" ] || die "no es una exportación válida: falta $dir/$f"
    done
    load_prod_env
    docker compose ps -q db | grep -q . || die "la base no está levantada. Corre ./scripts/deploy.sh up primero."
    confirm "Se REEMPLAZARÁN lugares, categorías, eventos y vectores de producción por los de $dir." "${2:-}" \
      || { echo "Cancelado."; exit 0; }

    echo "Deteniendo el backend..."
    docker compose stop backend
    echo "Restaurando la base..."
    psql_db -c "truncate place_categories, places, events, documents restart identity cascade"
    docker compose exec -T db pg_restore -U "$DB_USER" -d "$DB_NAME" --data-only --disable-triggers \
      --exit-on-error < "$dir/data.dump"

    echo "Subiendo las imágenes a Garage..."
    garage_setup
    n=0
    while IFS=$'\t' read -r key ctype; do
      [ -n "$key" ] || continue
      [[ "$key" =~ ^[A-Za-z0-9._-]+(/[A-Za-z0-9._-]+)*$ && "$key" != *..* ]] || die "nombre de imagen no válido: $key"
      curl --silent --show-error --fail --output /dev/null \
        --aws-sigv4 "aws:amz:garage:s3" --user "$S3_ACCESS_KEY:$S3_SECRET_KEY" \
        -H "Content-Type: $ctype" -H "Cache-Control: public, max-age=86400" \
        -T "$dir/images/$key" "http://127.0.0.1:$GARAGE_S3_PORT/$S3_BUCKET/$key"
      n=$((n + 1))
    done < "$dir/images/manifest.tsv"
    echo "$n imágenes subidas."

    echo "Apuntando las imágenes al dominio público..."
    psql_db -c "update places set image_url = replace(image_url, 'http://localhost:3902', 'https://$IMG_HOST') where image_url like 'http://localhost:3902%'"
    psql_db -c "update events set image_url = replace(image_url, 'http://localhost:3902', 'https://$IMG_HOST') where image_url like 'http://localhost:3902%'"
    stray="$(psql_db -Atc "select (select count(*) from places where image_url like 'http://%') + (select count(*) from events where image_url like 'http://%')")"
    [ "$stray" = "0" ] || warn "$stray registros conservan una imagen con http:// (no es $IMG_HOST). Revísalos con psql."

    docker compose start backend
    wait_backend

    echo "Comparando con lo exportado:"
    ok=1
    while read -r table expected; do
      [ "$table" = "images" ] && { actual="$n"; } || actual="$(psql_db -Atc "select count(*) from $table")"
      if [ "$actual" = "$expected" ]; then echo "  OK    $table: $actual"; else echo "  DIFF  $table: esperado $expected, hay $actual"; ok=0; fi
    done < "$dir/counts.txt"
    [ "$ok" = 1 ] || die "los conteos no coinciden."
    echo "Restauración completa. Puedes borrar $dir del VPS."
    ;;

  backup)
    load_prod_env
    mkdir -p "$BACKUP_DIR"
    ts="$(date +%Y%m%d-%H%M%S)"
    docker compose exec -T db pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc > "$BACKUP_DIR/db-$ts.dump"
    echo "Base: $BACKUP_DIR/db-$ts.dump"
    docker compose exec -T backend python - > "$BACKUP_DIR/images-$ts.tar" <<'PY'
import io
import sys
import tarfile

from app.config import get_settings
from app.storage import S3ImageStorage

s = get_settings()
client = S3ImageStorage(s)._client
with tarfile.open(fileobj=sys.stdout.buffer, mode="w|") as tar:
    for page in client.get_paginator("list_objects_v2").paginate(Bucket=s.s3_bucket):
        for obj in page.get("Contents", []):
            data = client.get_object(Bucket=s.s3_bucket, Key=obj["Key"])["Body"].read()
            info = tarfile.TarInfo(obj["Key"])
            info.size = len(data)
            tar.addfile(info, io.BytesIO(data))
PY
    echo "Imágenes: $BACKUP_DIR/images-$ts.tar"
    for prefix in db images; do
      # shellcheck disable=SC2012
      ls -t "$BACKUP_DIR/$prefix-"* 2>/dev/null | tail -n +"$((BACKUPS_TO_KEEP + 1))" | xargs -r rm --
    done
    ;;

  status) load_prod_env; docker compose ps ;;
  logs) load_prod_env; docker compose logs -f --tail 100 "$@" ;;
  psql) load_prod_env; docker compose exec db psql -U "$DB_USER" -d "$DB_NAME" "$@" ;;
  down) load_prod_env; docker compose down ;;

  help|-h|--help) awk 'NR > 1 && /^#/ { print; next } NR > 1 { exit }' "$0" ;;

  *)
    echo "Comando desconocido: $cmd" >&2
    awk 'NR > 1 && /^#/ { print; next } NR > 1 { exit }' "$0" >&2
    exit 1
    ;;
esac
