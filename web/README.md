# OndeSanMarcos Web

Web responsive (Vite + React + TypeScript) para orientarse en el campus de la UNMSM. Sin login ni registro.

## Requisitos
- Node 20+
- Backend FastAPI corriendo (ver `../backend/README.md`) o `VITE_USE_MOCK_CHAT=true`

## Todo con Docker (recomendado)
Desde la raíz del repo:
```bash
./script/dev.sh          # backend :8000 + web :5173 (Ctrl+C detiene)
./script/dev.sh up -d    # en segundo plano
./script/dev.sh logs web # logs de un servicio
./script/dev.sh test     # tests de backend y web
./script/dev.sh down     # detener (clean = también borra volúmenes)
```
Crea `backend/.env` y `web/.env` desde sus `.env.example` si faltan. El backend arranca en modo mock (sin llaves). Completa `VITE_MAPBOX_TOKEN` en `web/.env` para ver el mapa.

## Sin Docker
```bash
cp .env.example .env   # y completa VITE_MAPBOX_TOKEN
npm install
npm run dev            # http://localhost:5173
```

## Scripts
| Comando | Qué hace |
|---|---|
| `npm run dev` | servidor de desarrollo |
| `npm run build` | revisa tipos y genera `dist/` |
| `npm run test` | corre los tests (Vitest) |
| `npm run lint` | oxlint |

El alias `@/` apunta a `src/`.

## Administración de lugares

El área `/admin` (solo con sesión de administrador; se entra por la dirección `/admin/login`) tiene tres pestañas:

- **Perfil**: por ahora vacía.
- **Lugares** (`/admin/lugares`): tabla con todos los lugares, también los ocultos, con búsqueda (sin tildes ni mayúsculas) y filtros por categoría, estado y verificación; 20 por página. Cada fila permite **editar**, **despublicar/publicar** (despublicar pide confirmación) y **marcar o quitar la verificación**. «Nuevo lugar» y «Editar» abren un diálogo sobre toda la pantalla, con el fondo difuminado, título, X y Esc, con todos los campos de la ficha. La ubicación se elige en un **mapa 2D** de Mapbox (clic o arrastrar el marcador; también se pueden escribir latitud y longitud) y solo se aceptan puntos dentro del área del campus. La categoría y el lugar contenedor son selectores con búsqueda que solo admiten valores existentes. Los errores de validación del servidor salen junto a cada campo.
- **Categorías** (`/admin/categorias`): crear, editar y borrar (solo las vacías).

Todo se guarda con la API de administración del backend (`/api/admin/...`, ver `backend/README.md`) a través de `src/services/api/adminClient.ts`, el único punto que envía el token. Tras guardar, el mapa público de la misma sesión se actualiza sin recargar. Si el asistente no pudo actualizarse (`rag_sync: failed`), aparece un aviso con «Reintentar».

El mapa del formulario se descarga solo al abrir el diálogo (un chunk aparte). Sin `VITE_MAPBOX_TOKEN` el formulario sigue funcionando escribiendo las coordenadas.

## Perfil del administrador

La pestaña **Perfil** (`/admin`) muestra el usuario, la fecha de alta y cuándo vence la sesión. «Cambiar contraseña» abre un diálogo (actual, nueva y confirmación; la nueva: 8 o más caracteres con letras y números). Si la actual es incorrecta el error sale junto a ese campo; tras 5 errores seguidos hay que esperar unos minutos. La sesión sigue abierta tras el cambio.

## Estilos
Tailwind CSS v4. Los tokens (colores, fuentes, radios, sombras) están en `@theme` dentro de `src/index.css`; el tema oscuro los redefine con `data-theme="dark"`.
