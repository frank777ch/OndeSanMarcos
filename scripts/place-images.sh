#!/usr/bin/env bash
# Sube las portadas de los lugares (backend/db/seed/place-images/<slug>.jpg) a Garage, el almacén
# S3 de desarrollo (docker-compose.yml), y apunta `image_url` de cada lugar a su portada.
#
# Es idempotente: se puede ejecutar las veces que haga falta. No pisa un `image_url` que ya
# tenga el lugar (p. ej. uno puesto desde el panel de administración).
#
# Uso: ./scripts/place-images.sh
# También deja listo el bucket y la llave que usa el backend para la subida desde el panel
# (credenciales de desarrollo en infra/garage/dev.env).
# Variables opcionales:
#   PLACE_IMAGES_BASE_URL  base pública de las portadas (por defecto PLACE_IMAGES_PUBLIC_URL de dev.env)
#   GARAGE_S3_PORT         puerto de la API S3 en tu máquina (por defecto 3900)
#   GARAGE_ENV_FILE        archivo KEY=VALUE con las credenciales S3 (por defecto infra/garage/dev.env;
#                          en producción lo pasa scripts/deploy.sh con .env.prod)
#   PLACE_IMAGES_ALIAS     dominio con el que se sirve el bucket (por defecto localhost; en producción
#                          img.ondesanmarcos.site)
#   PLACE_IMAGES_DIR       carpeta con las portadas (por defecto backend/db/seed/place-images). Una carpeta
#                          vacía solo deja listo Garage (layout, llave, bucket y alias), sin subir nada
#   GARAGE_CAPACITY        capacidad del nodo al crear el layout (por defecto 1G)
#   COMPOSE_FILE / COMPOSE_ENV_FILES  hacen que `docker compose` use otro compose (producción)
#
# Limitación: Garage sirve el bucket según el nombre del host y no admite una IP como nombre,
# así que `localhost` funciona en tu máquina pero no desde el celular por la IP de la red local.
# Ahí la ficha simplemente no muestra la portada.
set -euo pipefail

cd "$(dirname "$0")/.."

# Credenciales y bucket de desarrollo, compartidos con el backend.
set -a
# shellcheck disable=SC1091
. "${GARAGE_ENV_FILE:-infra/garage/dev.env}"
set +a

BUCKET="$S3_BUCKET"
KEY_NAME=ondesanmarcos-app
ALIAS="${PLACE_IMAGES_ALIAS:-localhost}"
IMAGES_DIR="${PLACE_IMAGES_DIR:-backend/db/seed/place-images}"
S3_URL="http://127.0.0.1:${GARAGE_S3_PORT:-3900}"
BASE_URL="${PLACE_IMAGES_BASE_URL:-$PLACE_IMAGES_PUBLIC_URL}"
BASE_URL="${BASE_URL%/}"
DB_USER=ondesanmarcos
DB_NAME=ondesanmarcos

if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  echo "Error: se necesita Docker con el plugin 'docker compose'." >&2
  exit 1
fi

shopt -s nullglob
files=("$IMAGES_DIR"/*.jpg)

# -T: sin TTY, para poder capturar la salida. RUST_LOG=error silencia el ruido de la CLI.
garage() { docker compose exec -T -e RUST_LOG=error garage /garage "$@"; }

docker compose up -d db garage >/dev/null

echo "Esperando a Garage..."
for _ in $(seq 1 30); do
  garage status >/dev/null 2>&1 && break
  sleep 1
done
if ! garage status >/dev/null 2>&1; then
  echo "Error: Garage no responde. Revisa: docker compose logs garage" >&2
  exit 1
fi

# Un nodo nuevo no tiene rol: sin él Garage no guarda datos.
if garage status 2>/dev/null | grep -q "NO ROLE ASSIGNED"; then
  node="$(garage status 2>/dev/null | awk '/^[0-9a-f]{16}/{print $1; exit}')"
  garage layout assign -z dc1 -c "${GARAGE_CAPACITY:-1G}" "$node" >/dev/null
  garage layout apply --version 1 >/dev/null
fi

# Llave fija (la misma que usa el backend): se importa una sola vez.
garage key info "$S3_ACCESS_KEY" >/dev/null 2>&1 \
  || garage key import --yes -n "$KEY_NAME" "$S3_ACCESS_KEY" "$S3_SECRET_KEY" >/dev/null
garage bucket info "$BUCKET" >/dev/null 2>&1 || garage bucket create "$BUCKET" >/dev/null
garage bucket allow --read --write --owner "$BUCKET" --key "$S3_ACCESS_KEY" >/dev/null
# «website» abre la lectura pública sin credenciales: es lo que usa el navegador.
garage bucket website --allow "$BUCKET" >/dev/null
# El alias (localhost en desarrollo) hace que las peticiones con ese Host lleguen a este bucket.
garage bucket info "$BUCKET" 2>/dev/null | grep -Fqw "$ALIAS" || garage bucket alias "$BUCKET" "$ALIAS" >/dev/null

if [ ${#files[@]} -eq 0 ]; then
  echo "Garage listo. No hay portadas en $IMAGES_DIR: nada que subir."
  exit 0
fi

echo "Subiendo ${#files[@]} portadas a $BUCKET..."
slugs=()
for file in "${files[@]}"; do
  slug="$(basename "$file" .jpg)"
  if [[ ! "$slug" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
    echo "Error: nombre de archivo no válido (debe ser el slug del lugar): $file" >&2
    exit 1
  fi
  curl --silent --show-error --fail --output /dev/null \
    --aws-sigv4 "aws:amz:garage:s3" --user "$S3_ACCESS_KEY:$S3_SECRET_KEY" \
    -H "Content-Type: image/jpeg" -H "Cache-Control: public, max-age=86400" \
    -T "$file" "$S3_URL/$BUCKET/$slug.jpg"
  slugs+=("$slug")
done

# Los slugs ya están validados arriba, así que es seguro interpolarlos en la consulta.
in_list="$(printf "'%s'," "${slugs[@]}")"
in_list="${in_list%,}"
updated="$(docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -tA \
  -v base="$BASE_URL" <<SQL
with u as (
  update places
  set image_url = :'base' || '/' || slug || '.jpg'
  where slug in ($in_list) and image_url is null
  returning 1
)
select count(*) from u;
SQL
)"
total="$(docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" -tA \
  -c "select count(*) from places")"

echo "Listo: ${#slugs[@]} portadas en Garage; $updated lugares actualizados ($total lugares en la base)."
if [ "$total" = "0" ]; then
  echo "Aviso: la base no tiene lugares. Cárgalos con ./scripts/dev.sh seed-places y vuelve a ejecutar esto."
fi
