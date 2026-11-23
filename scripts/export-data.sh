#!/usr/bin/env bash
# Exporta los datos de TU base y de TU Garage locales para llevarlos a producción: lugares, categorías,
# eventos, vectores del asistente y las portadas (incluidas las subidas desde el panel).
# No incluye admin_users: el administrador de producción lo crea el backend con ADMIN_USERNAME/ADMIN_PASSWORD.
#
# Requisitos: ./scripts/dev.sh up -d (base y Garage encendidos) y backend/.venv (lo crea dev.sh).
# Uso: ./scripts/export-data.sh
# Resultado: .dev/export/<fecha>/ con data.dump, images/ (+ manifest.tsv) y counts.txt.
# Luego: scp -r .dev/export/<fecha> mi-vps:deploys/imports/ondesanmarcos/ y, en el VPS,
#        ./scripts/deploy.sh restore ~/deploys/imports/ondesanmarcos/<fecha>
set -euo pipefail

cd "$(dirname "$0")/.."

DB_USER=ondesanmarcos
DB_NAME=ondesanmarcos
VENV="$PWD/backend/.venv"
OUT=".dev/export/$(date +%Y%m%d-%H%M%S)"

set -a
# shellcheck disable=SC1091
. infra/garage/dev.env
set +a

if ! docker compose exec -T db pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
  echo "Error: la base local no responde. Levanta el entorno con ./scripts/dev.sh up -d" >&2
  exit 1
fi
[ -x "$VENV/bin/python" ] || { echo "Error: falta backend/.venv. Corre ./scripts/dev.sh up una vez." >&2; exit 1; }
"$VENV/bin/python" -c "import boto3" 2>/dev/null || { echo "Error: boto3 no está en backend/.venv." >&2; exit 1; }

mkdir -p "$OUT/images"

echo "Exportando la base..."
docker compose exec -T db pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc --data-only \
  --exclude-table=flyway_schema_history --exclude-table=admin_users > "$OUT/data.dump"

echo "Exportando las imágenes de Garage..."
S3_ENDPOINT="http://127.0.0.1:${GARAGE_S3_PORT:-3900}" OUT="$OUT" "$VENV/bin/python" -I - <<'PY'
import os
from pathlib import Path

import boto3
from botocore.config import Config

out = Path(os.environ["OUT"]) / "images"
client = boto3.client(
    "s3",
    endpoint_url=os.environ["S3_ENDPOINT"],
    aws_access_key_id=os.environ["S3_ACCESS_KEY"],
    aws_secret_access_key=os.environ["S3_SECRET_KEY"],
    region_name=os.environ["S3_REGION"],
    config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
)
bucket = os.environ["S3_BUCKET"]
rows = []
for page in client.get_paginator("list_objects_v2").paginate(Bucket=bucket):
    for obj in page.get("Contents", []):
        key = obj["Key"]
        target = (out / key).resolve()
        if out.resolve() not in target.parents:
            raise SystemExit(f"Clave sospechosa: {key}")
        target.parent.mkdir(parents=True, exist_ok=True)
        res = client.get_object(Bucket=bucket, Key=key)
        target.write_bytes(res["Body"].read())
        rows.append(f"{key}\t{res.get('ContentType', 'application/octet-stream')}")
(out / "manifest.tsv").write_text("\n".join(rows) + ("\n" if rows else ""), encoding="utf-8")
print(f"{len(rows)} imágenes")
PY

{
  for t in place_categories places events documents; do
    echo "$t $(docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" -Atc "select count(*) from $t")"
  done
  echo "images $(wc -l < "$OUT/images/manifest.tsv" | tr -d ' ')"
} > "$OUT/counts.txt"

echo
echo "Listo: $OUT"
cat "$OUT/counts.txt"
