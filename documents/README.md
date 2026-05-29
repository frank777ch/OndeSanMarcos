# 📚 Documentación técnica — OndeSanMarcos

> **OndeSanMarcos** es una aplicación móvil de **geolocalización 3D** y **asistencia inteligente (RAG)** para el campus de la **Universidad Nacional Mayor de San Marcos (UNMSM)**.
> Su objetivo es eliminar la desorientación dentro del campus y democratizar el acceso a información institucional confiable.

Esta carpeta contiene la documentación de arquitectura, modelo de datos y flujos del proyecto. Todos los diagramas están escritos en **Mermaid**, por lo que se renderizan automáticamente al verlos en GitHub.

---

## 🗂️ Índice de la documentación

| # | Documento | Contenido |
|---|-----------|-----------|
| 0 | [Planning Document (Informe del proyecto)](./00-planning-document.md) | Documento rector: problema, visión, objetivos, alcance, metodología, equipo y mapa de entregables. |
| 1 | [Arquitectura general](./01-arquitectura-general.md) | Visión de alto nivel, conexión Frontend ↔ Backend, servicios de cada lado, despliegue. |
| 2 | [Frontend](./02-frontend.md) | Estructura feature-based, capas, navegación, gestión de estado (Zustand), componentes. |
| 3 | [Backend y RAG](./03-backend-rag.md) | API FastAPI, pipeline RAG (ingesta + consulta), Supabase pgvector, guardrails, contrato `/api/chat`. |
| 4 | [Modelo de datos](./04-modelo-de-datos.md) | Diagramas de clases de dominio, stores y entidades de base de datos. |
| 5 | [Flujos](./05-flujos.md) | Diagramas de flujo y secuencia: arranque, autenticación, chat, chat→mapa, RAG, rutas. |
| 6 | [Backlog y roadmap](./06-backlog-y-roadmap.md) | Épicas, historias de usuario, estado actual vs. planificado, cronograma. |
| 7 | [Avance del backend RAG](./07-avance-backend.md) | Guía viva de lo construido en el backend: pipeline de ingesta, proveedores, contrato y cómo correrlo. |
| 8 | [Despliegue en Render](./08-despliegue-render.md) | Cómo desplegar el backend (subcarpeta `backend/`) en Render, variables, verificación y consumo del front. |
| 📸 | [Capturas](./screenshots/) | Imágenes para la sustentación: estándar de nombres + checklist de capturas. |

---

## 🧱 Stack tecnológico

| Capa | Tecnología | Rol |
|------|-----------|-----|
| **Frontend** | React Native `0.81` + Expo SDK `54` + TypeScript `5.9` | App móvil multiplataforma (Android / iOS). |
| Navegación | React Navigation (native-stack + bottom-tabs) | Ruteo entre pantallas y pestañas. |
| Mapas | `@rnmapbox/maps` (Mapbox nativo) | Render 3D del campus, POIs y rutas. |
| Estado | Zustand `5` | Stores de auth, chat y mapa. |
| Sensores | `expo-location`, `expo-sensors` | GPS y brújula (magnetómetro) para el avatar. |
| **Backend** | FastAPI + Uvicorn (Python) | API del asistente IA. *(funcional en modo mock)* |
| RAG | LlamaIndex / pgvector | Orquestación de recuperación + generación. *(motor mock listo; proveedores reales en curso)* |
| **Datos / BaaS** | Supabase (Postgres + `pgvector` + Auth) | Autenticación, base de conocimiento y embeddings. |
| Servicios externos | Mapbox, proveedor LLM | Teselas/render de mapas y modelo de lenguaje. |

---

## 🚦 Estado del proyecto

> Snapshot a **29/05/2026** (Sprint 2 — "El Cerebro", en cierre). Ver detalle en [Backlog y roadmap](./06-backlog-y-roadmap.md).

| Módulo | Estado | Notas |
|--------|--------|-------|
| Mapa 3D base (Mapbox) | ✅ Implementado | Vista 3D, edificios extruidos, POIs con filtro por categoría, modos cámara. |
| Autenticación (Supabase) | ✅ Implementado | Registro con verificación por correo, login, modo invitado. |
| UI del Asistente (Chat) | ✅ Implementado | Estados idle/asking/answered, historial persistido, respuestas **mock**. |
| Integración Chat → Mapa | 🟡 Parcial | El chat fija el destino (`focusTarget`); falta que el mapa lo consuma. |
| Backend / API del chat | 🟡 Parcial | `POST /api/chat` funcional en modo mock; ver [07-avance-backend](./07-avance-backend.md). |
| Motor RAG (LlamaIndex) | 🟡 Parcial | Motor + ingesta listos en mock; LLM real implementado, pgvector pendiente. |
| Motor de rutas / GPS real | 🟠 Planificado | `src/features/routing/` aún vacío. |

**Leyenda:** ✅ Implementado · 🟡 Parcial · 🟠 Planificado

---

## 🧭 Cómo leer esta documentación

- Si quieres **entender el sistema completo**, empieza por [Arquitectura general](./01-arquitectura-general.md).
- Si vas a **trabajar en la app móvil**, ve a [Frontend](./02-frontend.md).
- Si vas a **construir el asistente IA**, ve a [Backend y RAG](./03-backend-rag.md).
- Si necesitas **el detalle de tipos y entidades**, ve a [Modelo de datos](./04-modelo-de-datos.md).

> 💡 Los diagramas Mermaid no se ven en algunos editores de texto plano. Para visualizarlos, abre los archivos en **GitHub** o en un editor con soporte Mermaid (VS Code + extensión *Markdown Preview Mermaid Support*).
