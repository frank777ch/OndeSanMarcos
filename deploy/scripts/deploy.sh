#!/usr/bin/env bash
# Actualiza el código desde GitHub y reinicia los contenedores.
# Lo corre GitHub Actions (vía SSH) en cada push a main, o tú a mano en el VPS.
set -euo pipefail

cd "$(dirname "$0")/../.."
BRANCH="${DEPLOY_BRANCH:-main}"

if [ ! -f deploy/.env ]; then
  echo "Falta deploy/.env (ver deploy/.env.example)." >&2
  exit 1
fi

echo "==> Código ($BRANCH)"
git fetch --quiet origin "$BRANCH"
git checkout --quiet "$BRANCH"
# Solo avance rápido: si alguien editó archivos versionados en el VPS, falla
# en vez de pisarlos.
git merge --ff-only --quiet "origin/$BRANCH"
git log -1 --format='    %h %s (%an)'

echo "==> Contenedores"
cd deploy
docker compose up -d --build --remove-orphans
docker image prune -f >/dev/null

DOMAIN="$(grep -E '^DOMAIN=' .env | cut -d= -f2- | tr -d '"' | tr -d "'")"
echo "==> Esperando https://$DOMAIN/health"
for _ in $(seq 1 30); do
  if curl -fsS --max-time 5 "https://$DOMAIN/health" >/dev/null 2>&1; then
    echo "    OK"
    exit 0
  fi
  sleep 3
done

echo "El backend no respondió en 90 s. Últimos logs:" >&2
docker compose logs --tail=50 api caddy >&2
exit 1
