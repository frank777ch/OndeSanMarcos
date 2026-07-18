# Presentación final · OndeSanMarcos

Deck de la exposición final, **escrito en JavaScript y compilado a `.pptx`** con
[PptxGenJS](https://gitbrent.github.io/PptxGenJS/). Diseño de fondo negro limpio,
diagramas de arquitectura y de clases, secciones separadas de frontend y backend.

## Generar el `.pptx`

```bash
cd presentation
npm install
npm run build          # → OndeSanMarcos.pptx
```

El archivo generado (`OndeSanMarcos.pptx`) se versiona en el repo para tenerlo
a mano; se puede regenerar en cualquier momento con el comando anterior.

## Estructura (41 slides)

| Bloque | Slides |
|--------|--------|
| Portada e integrantes | 1–2 |
| Contexto, solución y objetivos | 3–6 |
| **Vista general** (arquitectura completa, servicios, flujos, despliegue) | 7–13 |
| **Frontend** (Expo/RN: estructura, estado, navegación, features, pantallas) | 14–25 |
| **Backend** (FastAPI RAG: capas, clases, pipeline, embeddings, pgvector, API) | 26–37 |
| **DEMO** | 38 |
| Conclusiones y trabajo futuro | 39–41 |

## Placeholders de capturas

Algunos slides reservan un espacio (marco de navegador o de teléfono, con borde
punteado) para pegar capturas reales que no se pueden generar por código:

- **Slide 25** — pantallas de la app (mapa, chat, ruta, login).
- **Slide 32** — dashboard de **Supabase** (tabla `documents` + `match_documents`).
- **Slide 36** — dashboard de **Render** (estado *Live*, logs, variables de entorno).

Cada placeholder incluye una descripción de la captura que va en ese lugar.

## Editar

Todo el contenido y el diseño viven en [`build.js`](./build.js): un tema central
(colores, tipografía), helpers de layout reutilizables (encabezados, tarjetas,
clases UML, flujos, placeholders) y una función por slide. Tras editar, corre
`npm run build` de nuevo.

> Verificación visual: se puede exportar a PDF/imágenes con LibreOffice
> (`libreoffice --headless --convert-to pdf OndeSanMarcos.pptx`) para revisar
> el posicionamiento antes de presentar.
