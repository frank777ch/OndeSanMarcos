# HU-10 · Lugares y filtros

- **Estado:** Implementada (escenarios 1–5 con el mapa real pendientes de verificar a mano: requieren token de Mapbox)
- **Historia:** ver `../../histories.md#hu-10`
- **Depende de:** HU-09 (mapa del campus)
- **Archivos hermanos:** [plan.md](plan.md) · [task.md](task.md)

## 1. Contexto y objetivo
El mapa del campus está vacío. El visitante necesita ver los lugares de la UNMSM (facultades, puertas, cafeterías, auditorios, campos deportivos) y poder quedarse solo con un tipo para encontrar lo que busca.

## 2. Alcance
**Dentro:**
- Datos de los 40 lugares con coordenadas y categoría.
- Capa de puntos con nombre sobre el mapa.
- Barra de filtros por categoría (una activa a la vez, o ninguna).
- Estado del filtro compartido (se conserva al ir al Asistente y volver).

**Fuera (y dónde se hace):**
- Tocar un lugar para ver su ficha → HU-12.
- Buscar por nombre → HU-11.
- Descripción, horarios y teléfonos de los lugares → HU-12.
- Íconos propios por categoría dentro del mapa (se usan círculos de color) → mejora futura.
- Diseño móvil de la barra de filtros → HU-21.

## 3. Requisitos

| ID | Requisito |
|---|---|
| RF-10.1 | Los lugares se definen en un único módulo de datos. Cada lugar tiene `id` único, `name`, `category` y `coordinates` `[lng, lat]`. Hay 40 lugares. |
| RF-10.2 | Existen exactamente 5 categorías: Facultades, Puertas, Cafeterías, Auditorios y Campos deportivos. Cada una tiene `id`, etiqueta en español, color e ícono. Todo lugar pertenece a una categoría existente. |
| RF-10.3 | Cuando se abre `/mapa`, el sistema debe mostrar todos los lugares como un círculo con su nombre debajo. |
| RF-10.4 | El círculo de cada lugar debe tener el color de su categoría, con borde blanco. |
| RF-10.5 | El sistema debe mostrar sobre el mapa una barra con un chip por categoría, en el orden: Facultades, Cafeterías, Auditorios, Campos deportivos, Puertas. Cada chip tiene ícono y etiqueta, y es un botón con `aria-pressed`. |
| RF-10.6 | Cuando el usuario activa un chip, el mapa debe mostrar solo los lugares de esa categoría. |
| RF-10.7 | Cuando el usuario pulsa el chip que ya está activo, el sistema debe desactivarlo y volver a mostrar todos los lugares. |
| RF-10.8 | Solo puede haber una categoría activa a la vez: activar otro chip reemplaza al anterior. |
| RF-10.9 | El filtro activo debe conservarse mientras la página no se recargue, incluso si el usuario va al Asistente y vuelve al Mapa. No se guarda en `localStorage`. |
| RF-10.10 | La barra de filtros debe poder usarse con teclado y tener foco visible. |

## 4. Escenarios de aceptación
**Escenario 1: ver todo** (RF-10.3, RF-10.4)
- **Dado** que abro `/mapa` con el token de Mapbox configurado
- **Cuando** el mapa termina de cargar
- **Entonces** veo 40 puntos con su nombre, coloreados por categoría, y ningún chip está activo.

**Escenario 2: filtrar** (RF-10.6)
- **Dado** que veo todos los lugares
- **Cuando** pulso «Cafeterías»
- **Entonces** solo quedan 3 puntos y el chip aparece resaltado.

**Escenario 3: quitar el filtro** (RF-10.7)
- **Dado** que «Cafeterías» está activo
- **Cuando** vuelvo a pulsarlo
- **Entonces** reaparecen los 40 puntos y el chip deja de estar resaltado.

**Escenario 4: cambiar de filtro** (RF-10.8)
- **Dado** que «Cafeterías» está activo
- **Cuando** pulso «Puertas»
- **Entonces** solo veo las 8 puertas y «Cafeterías» ya no está activo.

**Escenario 5: conservar el filtro** (RF-10.9)
- **Dado** que «Auditorios» está activo
- **Cuando** voy a «Asistente» y vuelvo a «Mapa»
- **Entonces** «Auditorios» sigue activo y se ven 2 puntos.

## 5. Preguntas abiertas
- Ninguna.

## 6. Historial
- 2026-10-23 · Borrador creado y aprobado.
- 2026-10-23 · Implementada. Se añadió `@types/geojson` como dependencia de desarrollo para tipar el GeoJSON.
- 2026-10-23 · Se separó en `spec.md`, `plan.md` y `task.md`.
