# 10. Despliegue a producción (VPS + Supabase + EAS)

Guía paso a paso para poner OndeSanMarcos en producción con costo $0: backend en
un VPS propio con Docker, Supabase (plan free) para cuentas y base vectorial, y la
app Android compilada con EAS. Reemplaza al despliegue en Render
([`08-despliegue-render.md`](./08-despliegue-render.md)), que se duerme tras 15
min sin tráfico.

> Convención: **[SECRETO]** = nunca va al repo, a un chat ni a una captura.

---

## 10.1 Arquitectura de producción

```
 App Android (APK / Play Store)
   │  registro / login ─────► Supabase (free): Auth + tabla `documents` (pgvector)
   │  POST /api/chat ───────► VPS ─ Caddy (HTTPS) ─► api (FastAPI, Docker)
   │                                                   ├─► Supabase (match_documents)
   │                                                   └─► Gemini (respuesta)
   └─ mapa ─────────────────► Mapbox
```

| Pieza | Dónde | Archivos |
|---|---|---|
| Backend | VPS, `docker compose` | `backend/Dockerfile`, `deploy/docker-compose.yml` |
| HTTPS + página pública | Caddy en el VPS (o el proxy que ya exista) | `deploy/Caddyfile`, `deploy/site/`, `deploy/proxy-existente/` |
| Keepalive de Supabase | contenedor `keepalive` (cada 12 h a `/health/db`) | `deploy/docker-compose.yml` |
| Despliegue continuo | GitHub Actions → SSH → `deploy.sh` | `.github/workflows/deploy-vps.yml` |
| Esquema BD | Supabase SQL Editor | `supabase/migrations/*.sql` |

Consumo medido del backend: **~50 MB de RAM** en reposo, imagen de ~290 MB. Un VPS
de 2 GB sobra.

---

## 10.2 Cuentas del equipo

Crear primero **`ondesanmarcos@gmail.com`** con verificación en 2 pasos activada. Con
ese correo:

| Servicio | Qué se obtiene | Notas |
|---|---|---|
| GitHub | **Organización** `ondesanmarcos` (gratis) | No una cuenta compartida: cada integrante entra con su usuario como miembro. Transferir el repo: *Settings → General → Danger zone → Transfer*. GitHub redirige la URL vieja. |
| Google AI Studio | API key de Gemini **[SECRETO]** | aistudio.google.com → *Get API key*. Con el plan gratuito, Google puede usar los datos para mejorar sus modelos. |
| Supabase | Proyecto de producción | Ver §10.3. |
| Mapbox | Token `pk.` y token `sk.` **[SECRETO]** | Ver §10.8. |
| Expo | Proyecto EAS | Ver §10.8. |
| Gmail | Contraseña de aplicación **[SECRETO]** | myaccount.google.com → *Seguridad → Contraseñas de aplicaciones*. Para el SMTP de Supabase. |
| Google Play Console | Publicación (opcional) | US$25 pago único. Ver §10.9. |

---

## 10.3 Supabase

1. **Crear proyecto** en la cuenta del equipo: región **South America (São Paulo)**
   (la más cercana a Lima). Guardar la contraseña de la BD **[SECRETO]**.
2. **Esquema** → *SQL Editor*, pegar y ejecutar, en orden:
   - `supabase/migrations/20260704000000_pgvector_schema.sql`
   - `supabase/migrations/20261015000000_documents_rls.sql` (cierra la tabla a la
     anon key; **no omitir**).
3. **Claves** → *Project Settings → API*:
   - `Project URL` → `SUPABASE_URL` (backend) y `EXPO_PUBLIC_SUPABASE_URL` (app).
   - `anon` / *publishable* → `EXPO_PUBLIC_SUPABASE_ANON_KEY` (pública).
   - `service_role` / *secret* → `SUPABASE_SERVICE_KEY` **[SECRETO]**, solo backend.
4. **Auth → URL Configuration**:
   - *Site URL*: `https://<DOMINIO>`
   - *Redirect URLs*: `ondesanmarcos://verified-email` y `ondesanmarcos://**`
5. **Auth → Emails → SMTP Settings** (obligatorio: el correo incluido de Supabase
   solo envía a los miembros del equipo del proyecto):
   - Host `smtp.gmail.com` · Puerto `587`
   - Usuario `ondesanmarcos@gmail.com` · Contraseña: la de aplicación **[SECRETO]**
   - Remitente `ondesanmarcos@gmail.com` · Nombre `OndeSanMarcos`
   - Gmail permite ~500 correos/día; de sobra para el lanzamiento.
6. **Auth → Emails → Confirm signup**: asunto *“Confirma tu cuenta de
   OndeSanMarcos”* y como cuerpo `supabase/templates/confirmar-registro.html`.
7. **Pausa por inactividad**: el plan free pausa proyectos sin actividad durante
   una semana. El contenedor `keepalive` consulta la base cada 12 h, así que no
   hace falta nada más mientras el VPS esté arriba.

---

## 10.4 Dominio

El HTTPS necesita un nombre que apunte a la IP del VPS. Opciones:

- **Gratis**: [duckdns.org](https://www.duckdns.org) → entrar con la cuenta de
  Google del equipo → crear `ondesanmarcos` → poner la IP del VPS. Queda
  `ondesanmarcos.duckdns.org`.
- **De pago**: un `.com` (~US$10/año) o `.pe`. Crear un registro **A** hacia la IP
  del VPS (por ejemplo `api.ondesanmarcos.com`).

Comprobar antes de seguir: `dig +short <DOMINIO>` debe devolver la IP del VPS.

---

## 10.5 VPS

Requisitos: Ubuntu/Debian, usuario con `sudo`, puertos 22/80/443 abiertos en el
firewall del proveedor.

```bash
# 1. Preparar el servidor (Docker, swap de 1 GB, ufw, clonar en /opt/ondesanmarcos)
curl -fsSL https://raw.githubusercontent.com/<org>/OndeSanMarcos/main/deploy/scripts/setup-vps.sh \
  | bash -s -- https://github.com/<org>/OndeSanMarcos.git
# Si te agregó al grupo docker: salir y volver a entrar por SSH.

# 2. Completar las variables
nano /opt/ondesanmarcos/deploy/.env     # DOMAIN, LLM_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY, CORS_ORIGINS

# 3. Levantar
bash /opt/ondesanmarcos/deploy/scripts/deploy.sh
```

> Si el repo es **privado**, el VPS necesita permiso de lectura: generar una llave
> en el VPS (`ssh-keygen -t ed25519`), agregar la pública en *GitHub → repo →
> Settings → Deploy keys* (solo lectura) y clonar con la URL `git@github.com:...`.

### Si el VPS ya tiene nginx o Caddy en 80/443

`setup-vps.sh` avisa si los puertos están ocupados. En ese caso:

1. En `deploy/.env` dejar **`COMPOSE_PROFILES=`** vacío (no levanta Caddy). El api
   queda en `127.0.0.1:8010` (cambiar con `API_HOST_PORT` si está ocupado).
2. Agregar el sitio al proxy existente con la plantilla que corresponda:
   - nginx: `deploy/proxy-existente/nginx.conf` (+ `certbot --nginx` para HTTPS).
   - Caddy: `deploy/proxy-existente/Caddyfile.snippet`.

---

## 10.6 Despliegue automático (GitHub Actions)

Cada push a `main` que toque `backend/` o `deploy/` corre los tests y, si pasan,
entra al VPS por SSH y ejecuta `deploy.sh`. La llave queda **restringida** a ese
único comando: aunque se filtrara, no da una shell.

```bash
# En tu PC: llave dedicada solo para el workflow
ssh-keygen -t ed25519 -f ondesanmarcos_deploy -N "" -C "github-actions-deploy"
```

En el VPS, agregar **una línea** a `~/.ssh/authorized_keys` del usuario de deploy:

```
command="/opt/ondesanmarcos/deploy/scripts/deploy.sh",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty ssh-ed25519 AAAA...contenido de ondesanmarcos_deploy.pub... github-actions-deploy
```

En GitHub → *Settings → Secrets and variables → Actions → New repository secret*:

| Secret | Valor |
|---|---|
| `VPS_HOST` | IP o dominio del VPS |
| `VPS_USER` | usuario SSH (miembro del grupo `docker`) |
| `VPS_PORT` | solo si no es 22 |
| `VPS_SSH_KEY` | contenido de `ondesanmarcos_deploy` (la privada) **[SECRETO]** |
| `VPS_KNOWN_HOSTS` | salida de `ssh-keyscan -t ed25519 <VPS_HOST>` |

Luego borrar la llave privada del PC. Mientras falte `VPS_HOST`, el workflow corre
los tests y omite el deploy.

---

## 10.7 Cargar la base de conocimiento

Con el backend arriba, desde el VPS (usa las claves de `deploy/.env`):

```bash
cd /opt/ondesanmarcos/deploy
docker compose exec api python -m app.rag.ingest_pgvector
# → "Ingeridos N fragmentos ..." (≈55)
```

Es idempotente: reemplaza el contenido de `documents`. Repetirlo cada vez que
cambie `app/knowledge/` (corpus o entradas aprobadas).

Verificar todo de punta a punta (desde cualquier máquina):

```bash
bash deploy/scripts/verify.sh https://<DOMINIO>
#   OK   HTTPS + /health
#   OK   Supabase (/health/db)
#   OK   Chat con Gemini
#   OK   Política de privacidad
```

> Si “Chat con Gemini” falla con 503, revisar `docker compose logs api`: lo más
> común es una API key inválida o que `LLM_MODEL` ya no exista (Google retira
> modelos; cambiar al Flash vigente en `deploy/.env` y `docker compose up -d`).

---

## 10.8 App móvil (EAS)

### Mapbox (cuenta del equipo)

- Token público: *Account → Tokens → Default public token* (`pk.`).
- Token de descarga: *Create a token* con el scope secreto **`DOWNLOADS:READ`** (`sk.`) **[SECRETO]**.

### Proyecto EAS

```bash
cd frontend
npx eas-cli login                 # cuenta de Expo del equipo
npx eas-cli init                  # crea el proyecto e imprime el projectId
```

Pegar el `projectId` en `EAS_PROJECT_ID` de `frontend/app.config.ts` y commitear.

### Variables de entorno de los builds

Se guardan en Expo (no en el repo). Para `preview` y `production`:

```bash
for ENV in preview production; do
  npx eas-cli env:create --environment $ENV --visibility plaintext --name EXPO_PUBLIC_API_URL           --value "https://<DOMINIO>"
  npx eas-cli env:create --environment $ENV --visibility plaintext --name EXPO_PUBLIC_SUPABASE_URL      --value "https://<ref>.supabase.co"
  npx eas-cli env:create --environment $ENV --visibility plaintext --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<anon key>"
  npx eas-cli env:create --environment $ENV --visibility plaintext --name EXPO_PUBLIC_MAPBOX_TOKEN      --value "pk...."
  npx eas-cli env:create --environment $ENV --visibility secret    --name RNMAPBOX_MAPS_DOWNLOAD_TOKEN  --value "sk...."
done
```

### Compilar

```bash
npx eas-cli build --platform android --profile preview      # APK para repartir / testers
npx eas-cli build --platform android --profile production   # AAB para Google Play
```

El APK de `preview` se instala directo desde el enlace que da EAS. Probar de punta
a punta: registro → correo → abrir el enlace en el celular → login → chat →
“Ver en mapa” → ruta.

---

## 10.9 Google Play (opcional)

- Cuenta de desarrollador: US$25 una vez.
- Las cuentas **personales nuevas** deben hacer una **prueba cerrada con al menos
  12 testers durante 14 días** antes de poder publicar. Calcular ~3 semanas.
- Datos que pide la ficha:
  - Política de privacidad: `https://<DOMINIO>/privacidad`
  - Eliminación de cuenta: `https://<DOMINIO>/eliminar-cuenta`
  - Seguridad de los datos: correo y nombre (cuenta), ubicación aproximada y precisa
    (solo en el dispositivo, no se comparte), texto del chat (enviado a Google
    Gemini, no vinculado a la cuenta).
- Play también exige poder pedir la eliminación **desde dentro de la app**:
  pendiente agregar en Perfil un enlace a `/eliminar-cuenta`.

---

## 10.10 Seguridad: tareas únicas

- [ ] **Revocar el token `sk.` de Mapbox** que estuvo en `frontend/.env.example`
  (cuenta personal de un integrante). Sigue en el historial de git: revocarlo es la
  única forma de invalidarlo.
- [ ] Revisar el proyecto Supabase antiguo (`fylkzhkppznydhyudaqf`): su tabla
  `documents` probablemente no tiene RLS. Aplicarle la migración de RLS o
  eliminarlo tras la migración.
- [ ] Usar claves nuevas de la cuenta del equipo; no reutilizar las personales.
- [ ] Apagar el servicio de Render cuando el VPS esté verificado.

---

## 10.11 Operación diaria

| Tarea | Comando (en `/opt/ondesanmarcos/deploy`) |
|---|---|
| Ver logs | `docker compose logs -f api` (`caddy`, `keepalive`) |
| Estado | `docker compose ps` |
| Redeploy manual | `bash ../deploy/scripts/deploy.sh` |
| Reiniciar tras cambiar `.env` | `docker compose up -d` |
| Volver a una versión anterior | `git checkout <commit> && docker compose up -d --build` (y luego `git checkout main`) |
| Recargar conocimiento | `docker compose exec api python -m app.rag.ingest_pgvector` |

Límites aplicados en producción: 20 consultas/min por IP a `/api/chat`
(`RATE_LIMIT_PER_MINUTE`), cuerpos de hasta 16 KB, 512 MB de RAM para el api.

---

## 10.12 Costos

| Concepto | Costo |
|---|---|
| VPS (ya existente) | $0 adicional |
| Supabase free (500 MB BD, 50k usuarios activos/mes) | $0 |
| Gemini Flash (plan gratuito con límite diario) | $0 |
| Mapbox (25k usuarios activos/mes en móvil) | $0 |
| Expo EAS (builds gratuitos con cola) | $0 |
| Dominio | $0 (DuckDNS) o ~US$10/año |
| Google Play | US$25 una vez (opcional) |
