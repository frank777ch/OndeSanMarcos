#!/usr/bin/env bash
# Prepara el VPS para OndeSanMarcos (se corre UNA vez, con un usuario con sudo).
#
#   curl -fsSL https://raw.githubusercontent.com/<org>/OndeSanMarcos/main/deploy/scripts/setup-vps.sh | bash -s -- <repo-url>
#   # o, con el repo ya clonado:
#   bash deploy/scripts/setup-vps.sh <repo-url>
#
# Idempotente: se puede volver a correr sin romper nada.
set -euo pipefail

REPO_URL="${1:-https://github.com/frank777ch/OndeSanMarcos.git}"
APP_DIR="${APP_DIR:-/opt/ondesanmarcos}"

log() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m[!] %s\033[0m\n' "$*"; }

log "Puertos 80/443"
if sudo ss -ltnH '( sport = :80 or sport = :443 )' | grep -q .; then
  warn "Algo ya escucha en 80/443 (¿nginx/apache u otro Caddy?):"
  sudo ss -ltnp '( sport = :80 or sport = :443 )'
  warn "Usa el modo sin Caddy: en deploy/.env deja COMPOSE_PROFILES= vacío y apunta"
  warn "ese proxy a 127.0.0.1:8010 (documents/10-despliegue-vps.md §10.5)."
fi

log "Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
fi
if ! id -nG "$USER" | grep -qw docker; then
  sudo usermod -aG docker "$USER"
  warn "Se agregó $USER al grupo docker: cierra la sesión SSH y vuelve a entrar."
fi
docker compose version >/dev/null 2>&1 || warn "Falta el plugin 'docker compose'."

log "Swap (ayuda a compilar en un VPS de 2 GB)"
if [ "$(swapon --noheadings | wc -l)" -eq 0 ]; then
  sudo fallocate -l 1G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile >/dev/null
  sudo swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
  echo "Swap de 1 GB creado."
else
  echo "Ya hay swap; no se toca."
fi

log "Firewall"
if command -v ufw >/dev/null 2>&1; then
  sudo ufw allow OpenSSH >/dev/null
  sudo ufw allow 80/tcp >/dev/null
  sudo ufw allow 443/tcp >/dev/null
  sudo ufw allow 443/udp >/dev/null
  sudo ufw status | head -n 1
else
  echo "ufw no está instalado; revisa el firewall del proveedor (puertos 22, 80, 443)."
fi

log "Código en $APP_DIR"
if [ ! -d "$APP_DIR/.git" ]; then
  sudo mkdir -p "$APP_DIR"
  sudo chown "$USER":"$USER" "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
else
  echo "Ya clonado."
fi

log "Variables de producción"
if [ ! -f "$APP_DIR/deploy/.env" ]; then
  cp "$APP_DIR/deploy/.env.example" "$APP_DIR/deploy/.env"
  chmod 600 "$APP_DIR/deploy/.env"
  warn "Completa $APP_DIR/deploy/.env (DOMAIN, LLM_API_KEY, SUPABASE_*) y luego corre:"
  echo "    bash $APP_DIR/deploy/scripts/deploy.sh"
else
  echo "deploy/.env ya existe; no se toca."
fi
