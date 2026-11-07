#!/usr/bin/env bash
# Prueba de humo del despliegue (desde cualquier máquina):
#   bash deploy/scripts/verify.sh https://ondesanmarcos.duckdns.org
set -uo pipefail

BASE="${1:?Uso: verify.sh https://<dominio>}"
BASE="${BASE%/}"
fail=0

check() {
  local name="$1" expected="$2"; shift 2
  local body
  if body="$(curl -fsS --max-time 30 "$@")" && grep -q "$expected" <<<"$body"; then
    printf '  \033[32mOK\033[0m   %s\n' "$name"
  else
    printf '  \033[31mFALLO\033[0m %s\n         %s\n' "$name" "${body:-sin respuesta}"
    fail=1
  fi
}

echo "Verificando $BASE"
check "HTTPS + /health"           '"status":"ok"'      "$BASE/health"
check "Supabase (/health/db)"     '"documents"'        "$BASE/health/db"
check "Chat con Gemini"           '"biblioteca-central"' \
  -X POST "$BASE/api/chat" -H 'Content-Type: application/json' \
  -d '{"query":"¿Cuál es el horario de la Biblioteca Central?"}'
check "Política de privacidad"    'Política de privacidad' "$BASE/privacidad"

exit "$fail"
