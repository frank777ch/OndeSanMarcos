# 10. Despliegue en un VPS de Hetzner con Traefik

Guía para desplegar **todo el sistema** (web, backend RAG y Postgres con
pgvector) en **un solo VPS de [Hetzner Cloud](https://www.hetzner.com/cloud)**,
con **Docker Compose** y **[Traefik](https://traefik.io)** como proxy inverso
que emite y renueva los certificados HTTPS (Let's Encrypt) automáticamente.

Reemplaza el esquema de [08-despliegue-render](./08-despliegue-render.md) (que
usaba Render + Supabase): desde HU-23 la base es **Postgres propio con
pgvector** (ver [09-pgvector-supabase](./09-pgvector-supabase.md)), así que la
base de datos también vive en el VPS.

---

## 10.1 Arquitectura

```
                    Internet
                       │  :80 / :443
                ┌──────▼───────┐
                │   Traefik    │  TLS (Let's Encrypt), redirección 80→443
                └───┬──────┬───┘
   app.tudominio.com│      │api.tudominio.com
              ┌─────▼──┐ ┌─▼────────┐      red interna `internal`
              │  web   │ │ backend  │──────────────┐
              │ nginx  │ │ FastAPI  │              │
              └────────┘ └──────────┘        ┌─────▼─────┐
                                             │    db     │ Postgres + pgvector
                                             │ (volumen) │ (sin puertos públicos)
                                             └───────────┘
```

- **Solo Traefik publica puertos** (80 y 443). La base de datos y los
  contenedores no son accesibles desde fuera.
- Dos redes Docker: `proxy` (Traefik ↔ web/backend) e `internal` (backend ↔ db).
- `web` es el build estático de Vite servido por nginx (no el servidor de
  desarrollo del `docker-compose.yml` local).
- `migrate` (Flyway) corre una vez en cada despliegue, antes del backend.

---

## 10.2 Requisitos previos

1. Cuenta en Hetzner Cloud.
2. Un **dominio** con acceso a su DNS (dos subdominios; usamos como ejemplo
   `app.tudominio.com` para la web y `api.tudominio.com` para el backend).
3. Llave de **Gemini** (`LLM_API_KEY`) y token **público** de Mapbox (`pk.…`).
4. Una llave SSH en tu máquina (`ssh-keygen -t ed25519` si no tienes).

---

## 10.3 Crear el servidor

En la consola de Hetzner: **Servers → Add Server**.

| Ajuste | Valor recomendado |
|--------|-------------------|
| Imagen | Ubuntu 24.04 |
| Tipo | 2 vCPU / 4 GB RAM / 40 GB (sobra para esta carga; el LLM y los embeddings son externos) |
| Red | IPv4 + IPv6 |
| SSH key | la tuya (desactiva el acceso por contraseña) |
| Firewall | crea uno: entrada **22** (tu IP si es fija), **80** y **443** |
| Backups | opcional, pero recomendado (cubre el volumen de Postgres) |

Anota la **IP pública** del servidor.

### DNS

En el panel de tu dominio crea dos registros apuntando al VPS:

| Tipo | Nombre | Valor |
|------|--------|-------|
| `A` | `app` | IPv4 del VPS |
| `A` | `api` | IPv4 del VPS |
| `AAAA` | `app`, `api` | IPv6 del VPS (opcional) |

Verifica que propagó antes de seguir (Let's Encrypt falla si el DNS no resuelve):

```bash
dig +short app.tudominio.com
dig +short api.tudominio.com
```

---

## 10.4 Preparar el servidor

```bash
ssh root@IP_DEL_VPS

# Usuario no-root con sudo
adduser deploy && usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# Endurecer SSH: sin root ni contraseñas
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh

# Firewall local (además del de Hetzner)
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable

# Docker + plugin compose
curl -fsSL https://get.docker.com | sh
usermod -aG docker deploy
apt-get install -y fail2ban unattended-upgrades
```

Abre **otra terminal** y comprueba `ssh deploy@IP_DEL_VPS` antes de cerrar la
sesión de root. Desde aquí, todo con el usuario `deploy`.

> **Ojo con Docker y UFW:** los puertos que publica Docker saltan las reglas de
> UFW. Por eso la regla de oro de esta guía es **no publicar `ports:` en ningún
> servicio salvo Traefik**.

---

## 10.5 Traefik (una sola vez)

Traefik vive en su propia carpeta y su propio compose, así puedes agregar más
apps al mismo VPS sin tocarlo.

```bash
sudo mkdir -p /opt/traefik && sudo chown deploy: /opt/traefik && cd /opt/traefik
docker network create proxy

# Almacén de certificados: Traefik exige permisos 600
touch acme.json && chmod 600 acme.json
```

`/opt/traefik/docker-compose.yml`:

```yaml
services:
  traefik:
    image: traefik:v3.1
    restart: unless-stopped
    command:
      - --providers.docker=true
      - --providers.docker.exposedByDefault=false   # solo lo que tenga traefik.enable=true
      - --providers.docker.network=proxy
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      # HTTP -> HTTPS global
      - --entrypoints.web.http.redirections.entryPoint.to=websecure
      - --entrypoints.web.http.redirections.entryPoint.scheme=https
      # Let's Encrypt (desafío HTTP-01)
      - --certificatesresolvers.le.acme.email=${ACME_EMAIL}
      - --certificatesresolvers.le.acme.storage=/acme.json
      - --certificatesresolvers.le.acme.httpchallenge.entrypoint=web
      - --log.level=INFO
      - --accesslog=true
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./acme.json:/acme.json
    networks: [proxy]

networks:
  proxy:
    external: true
```

`/opt/traefik/.env`:

```env
ACME_EMAIL=tu-correo@tudominio.com
```

```bash
docker compose up -d
docker compose logs -f traefik   # no debe haber errores
```

> **Pruebas sin riesgo:** Let's Encrypt limita los intentos fallidos. Mientras
> ajustas, agrega temporalmente
> `--certificatesresolvers.le.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory`
> (certificado no confiable pero sin límites), y quítalo + borra `acme.json`
> cuando todo funcione.

---

## 10.6 Archivos nuevos en el repositorio

El `docker-compose.yml` actual es de **desarrollo** (`--reload`, código montado,
Vite dev server, credenciales de juguete). Para producción se añaden tres
archivos; **hay que crearlos y commitearlos** (esta guía solo los documenta).

### `web/Dockerfile`

Las variables `VITE_*` se **incrustan en el build** (no se leen en runtime), por
eso entran como `ARG`.

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG VITE_API_URL
ARG VITE_MAPBOX_TOKEN
ARG VITE_USE_MOCK_CHAT=false
ARG VITE_ENABLE_DEV_LOGS=false
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

### `web/nginx.conf`

La web usa `react-router-dom`: cualquier ruta debe caer en `index.html`.

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  location / {
    try_files $uri /index.html;
  }
}
```

### `docker-compose.prod.yml` (raíz del repo)

```yaml
services:
  db:
    image: pgvector/pgvector:pg16
    restart: unless-stopped
    environment:
      POSTGRES_USER: ondesanmarcos
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ondesanmarcos
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ondesanmarcos -d ondesanmarcos"]
      interval: 5s
      timeout: 3s
      retries: 20
    networks: [internal]          # sin `ports:` -> inaccesible desde fuera

  migrate:
    image: flyway/flyway:11
    command: migrate
    environment:
      FLYWAY_URL: jdbc:postgresql://db:5432/ondesanmarcos
      FLYWAY_USER: ondesanmarcos
      FLYWAY_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - ./backend/db/migrations:/flyway/sql:ro
    depends_on:
      db:
        condition: service_healthy
    networks: [internal]

  backend:
    build: ./backend
    restart: unless-stopped
    # Sin --reload; detrás de Traefik, así que confía en X-Forwarded-*
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips='*'
    environment:
      APP_ENV: production
      CORS_ORIGINS: https://${WEB_DOMAIN}
      RAG_USE_MOCK: "false"
      RAG_SCORE_THRESHOLD: "0.55"
      LLM_PROVIDER: gemini
      LLM_MODEL: gemini-2.5-flash
      LLM_API_KEY: ${LLM_API_KEY}
      DATABASE_URL: postgresql://ondesanmarcos:${POSTGRES_PASSWORD}@db:5432/ondesanmarcos
    depends_on:
      db:
        condition: service_healthy
      migrate:
        condition: service_completed_successfully
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request as u; u.urlopen('http://localhost:8000/health')"]
      interval: 10s
      timeout: 3s
      retries: 10
    labels:
      - traefik.enable=true
      - traefik.docker.network=proxy
      # Router general de la API (límite holgado)
      - traefik.http.routers.osm-api.rule=Host(`${API_DOMAIN}`)
      - traefik.http.routers.osm-api.entrypoints=websecure
      - traefik.http.routers.osm-api.tls.certresolver=le
      - traefik.http.routers.osm-api.middlewares=osm-rl-api
      - traefik.http.services.osm-api.loadbalancer.server.port=8000
      # Router de /api/chat (límite estricto: cada consulta gasta cuota de Gemini)
      - traefik.http.routers.osm-chat.rule=Host(`${API_DOMAIN}`) && PathPrefix(`/api/chat`)
      - traefik.http.routers.osm-chat.priority=100
      - traefik.http.routers.osm-chat.entrypoints=websecure
      - traefik.http.routers.osm-chat.tls.certresolver=le
      - traefik.http.routers.osm-chat.middlewares=osm-rl-chat
      - traefik.http.routers.osm-chat.service=osm-api
      # Middlewares de rate limit (ver §10.7)
      - traefik.http.middlewares.osm-rl-api.ratelimit.average=60
      - traefik.http.middlewares.osm-rl-api.ratelimit.period=1m
      - traefik.http.middlewares.osm-rl-api.ratelimit.burst=20
      - traefik.http.middlewares.osm-rl-chat.ratelimit.average=10
      - traefik.http.middlewares.osm-rl-chat.ratelimit.period=1m
      - traefik.http.middlewares.osm-rl-chat.ratelimit.burst=5
    networks: [proxy, internal]

  web:
    build:
      context: ./web
      args:
        VITE_API_URL: https://${API_DOMAIN}
        VITE_MAPBOX_TOKEN: ${VITE_MAPBOX_TOKEN}
    restart: unless-stopped
    labels:
      - traefik.enable=true
      - traefik.docker.network=proxy
      - traefik.http.routers.osm-web.rule=Host(`${WEB_DOMAIN}`)
      - traefik.http.routers.osm-web.entrypoints=websecure
      - traefik.http.routers.osm-web.tls.certresolver=le
      - traefik.http.routers.osm-web.middlewares=osm-rl-web
      - traefik.http.middlewares.osm-rl-web.ratelimit.average=120
      - traefik.http.middlewares.osm-rl-web.ratelimit.period=1m
      - traefik.http.middlewares.osm-rl-web.ratelimit.burst=60
      - traefik.http.services.osm-web.loadbalancer.server.port=80
    networks: [proxy]

networks:
  proxy:
    external: true
  internal:

volumes:
  db_data:
```

### `.env` de producción (solo en el servidor, nunca en git)

```env
WEB_DOMAIN=app.tudominio.com
API_DOMAIN=api.tudominio.com
POSTGRES_PASSWORD=<genera una: openssl rand -base64 32>
LLM_API_KEY=<llave de Gemini>
VITE_MAPBOX_TOKEN=pk.<token público de Mapbox>
```

> Docker Compose lee este `.env` de la raíz del proyecto para interpolar
> `${…}`. Confirma que `.env` está en `.gitignore`.
>
> `CORS_ORIGINS` queda restringido a la web (a diferencia del `*` de dev). Si
> más adelante la app móvil consume la API, no necesita CORS (es nativa).

---

## 10.7 Rate limiting en Traefik

Traefik limita las peticiones **por IP de origen** con el middleware
`ratelimit` (algoritmo *token bucket*): `average` peticiones por `period`, con
una ráfaga extra de `burst`. Al excederlo responde **429 Too Many Requests**
sin llegar al contenedor.

| Middleware | Aplica a | Límite | Ráfaga | Por qué |
|------------|----------|--------|--------|---------|
| `osm-rl-chat` | `POST /api/chat` | 10 / min | 5 | Cada consulta llama a Gemini (cuota y costo); es el blanco natural de abuso. |
| `osm-rl-api` | resto de la API (`/health`, `/docs`…) | 60 / min | 20 | Protección general. |
| `osm-rl-web` | la web estática | 120 / min | 60 | Una carga de la SPA son varias peticiones (JS, CSS, mapas); más holgado. |

Notas:

- El router de `/api/chat` tiene `priority=100` para ganarle al router general
  de la API, y declara `service=osm-api` para reutilizar el mismo backend.
- **Ajusta los números** a tu uso real. 10/min por IP es razonable para una
  persona conversando, pero **varias personas detrás de la misma red** (p. ej.
  el campus o una sustentación en vivo) comparten IP y se limitan entre sí.
  Súbelo antes de una demo.
- **Detrás de otro proxy/CDN** (p. ej. Cloudflare) la IP que ve Traefik sería la
  del proxy y limitaría a todos juntos. Ahí hay que leer la IP real del
  encabezado con `ratelimit.sourcecriterion.requestheadername=CF-Connecting-IP`
  (o `ipstrategy.depth` para `X-Forwarded-For`). Con el despliegue de esta guía
  (Traefik expuesto directo a Internet) no hace falta.
- Una respuesta 429 generada por Traefik **no lleva cabeceras CORS**, así que en
  el navegador puede verse como un error de CORS en vez de un 429. Compruébalo
  con `curl` (ver §10.9).
- Es un límite por IP y por instancia de Traefik: frena abuso básico, no
  sustituye a un WAF ni a un tope de gasto en la cuenta de Google AI.

---

## 10.8 Primer despliegue

```bash
# En el VPS, como `deploy`
cd ~ && git clone https://github.com/<tu-usuario>/OndeSanMarcos.git
cd OndeSanMarcos
nano .env                       # pega las variables de §10.6
chmod 600 .env

docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

Para no repetir `-f` en cada comando:

```bash
echo 'export COMPOSE_FILE=docker-compose.prod.yml' >> ~/.bashrc && source ~/.bashrc
```

### Cargar la base de conocimiento

La base nace vacía (Flyway solo crea el esquema). Tienes dos opciones:

**A. Restaurar el dump del repo (recomendado: no gasta cuota de Gemini).**
Es la misma estrategia que `./script/dev.sh db-restore`:

```bash
docker compose exec -T db pg_restore -U ondesanmarcos -d ondesanmarcos \
  --data-only < backend/db/dumps/documents-latest.dump
```

**B. Re-ingerir el corpus** (llama a Gemini para generar los embeddings):

```bash
docker compose run --rm --no-deps backend python -m app.rag.ingest_pgvector
```

---

## 10.9 Verificar

```bash
curl https://api.tudominio.com/health
# -> {"status":"ok","service":"OndeSanMarcos RAG API","version":"..."}

curl -X POST https://api.tudominio.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "horario de la biblioteca"}'
```

Probar el rate limit (los primeros ~15 pasan y luego aparecen `429`):

```bash
for i in $(seq 1 20); do
  curl -s -o /dev/null -w "%{http_code} " -X POST https://api.tudominio.com/api/chat \
    -H "Content-Type: application/json" -d '{"query": "hola"}'
done; echo
# -> 200 200 ... 429 429 429
```

- Web: `https://app.tudominio.com` (candado válido; pregunta algo al asistente).
- Docs de la API: `https://api.tudominio.com/docs`.
- Si `/api/chat` responde **503**: falta `LLM_API_KEY` o la base no se alcanza
  (revisa `docker compose logs backend`).

---

## 10.10 Actualizar (redeploy)

```bash
cd ~/OndeSanMarcos
git pull
docker compose up -d --build        # reconstruye solo lo que cambió
docker image prune -f               # libera disco de imágenes viejas
```

Flyway aplica migraciones nuevas automáticamente en cada `up`. Si quieres
automatizarlo, un workflow de GitHub Actions puede hacer `ssh deploy@VPS
'cd OndeSanMarcos && git pull && docker compose up -d --build'` en cada push a
`main`, usando una llave SSH dedicada guardada como *secret*.

---

## 10.11 Respaldos

El único estado es el volumen `db_data`.

```bash
# Dump lógico de la tabla de conocimiento (mismo formato que dev.sh db-dump)
docker compose exec -T db pg_dump -U ondesanmarcos -d ondesanmarcos \
  --data-only --table=documents -Fc > ~/documents-$(date +%Y%m%d).dump
```

Combínalo con los **backups de Hetzner** (snapshot del servidor completo) y,
si quieres, un `cron` diario que copie el dump fuera del VPS.

---

## 10.12 Problemas frecuentes

| Síntoma | Causa probable |
|---------|----------------|
| Navegador muestra certificado de Traefik "default" / no confiable | Let's Encrypt aún no emitió: DNS sin propagar o puertos 80/443 cerrados en el firewall de Hetzner. Mira `docker compose logs traefik` en `/opt/traefik`. |
| `404 page not found` de Traefik | Faltan labels, `traefik.enable=true`, o el servicio no está en la red `proxy`. |
| `Gateway Timeout` | Traefik elige la red equivocada: confirma `traefik.docker.network=proxy` y el `server.port` correcto (8000 backend, 80 web). |
| Error de CORS en el navegador | `CORS_ORIGINS` no coincide con `https://${WEB_DOMAIN}` (sin barra final). |
| La web llama a `localhost:8000` | Las `VITE_*` se fijan al **build**: reconstruye con `up -d --build web`. |
| `429 Too Many Requests` (o "CORS error" sin otra causa) | Rate limit de Traefik (§10.7). Espera un minuto o sube `average`/`burst` del middleware y redespliega. |
| `acme.json` permissions too open | `chmod 600 /opt/traefik/acme.json`. |
| `/api/chat` 503 | `LLM_API_KEY` vacío o base sin datos (§10.8). |

---

## 10.13 Checklist de seguridad

- [ ] SSH solo con llave, sin root, `fail2ban` activo.
- [ ] Firewall de Hetzner: solo 22/80/443.
- [ ] Ningún servicio salvo Traefik con `ports:`.
- [ ] `.env` con `chmod 600`, fuera de git; contraseña de Postgres generada, no la de dev.
- [ ] `CORS_ORIGINS` restringido al dominio de la web.
- [ ] Rate limit activo en Traefik (estricto en `/api/chat`) y tope de gasto/cuota en la cuenta de Google AI.
- [ ] Token de Mapbox **público** (`pk.`) y con restricción por URL a tu dominio.
- [ ] Backups de Hetzner activados.
- [ ] `unattended-upgrades` activo para parches del SO.
