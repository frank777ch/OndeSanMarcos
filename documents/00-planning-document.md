# 0. Planning Document (Informe del proyecto)

Documento rector de **OndeSanMarcos**: consolida el problema, la visión, los
objetivos, el alcance, la metodología, el equipo y los entregables. Es el punto
de entrada a la documentación; el detalle técnico vive en los documentos 01–08.

> **Nota:** los datos marcados como _(completar)_ deben rellenarse con la
> información real del equipo/curso antes de la entrega.

---

## 0.1 Información general

| Campo | Valor |
|-------|-------|
| Producto | **OndeSanMarcos** |
| Descripción | App móvil de navegación 3D e inducción inteligente (RAG) para el campus de la UNMSM. |
| Institución | Universidad Nacional Mayor de San Marcos (UNMSM) |
| Curso / Asignatura | _(completar)_ |
| Docente | _(completar)_ |
| Periodo | 18/04/2026 – 28/06/2026 |
| Repositorio | _(URL del repo)_ |

---

## 0.2 Problema y justificación

El campus de la UNMSM es **extenso y confuso**, especialmente para ingresantes,
visitantes y postulantes:

- La información institucional (horarios, oficinas, trámites) está **dispersa**
  en PDFs, redes sociales y carteles, y suele estar desactualizada.
- Los mapas 2D estáticos no representan bien el campus y herramientas como Google
  Maps no conocen su interior.
- No existe una **fuente única y confiable** de consulta rápida.

Esto genera desorientación y pérdida de tiempo. OndeSanMarcos ataca el problema
combinando un **mapa 3D navegable** con un **asistente conversacional anclado a
información oficial**.

---

## 0.3 Visión del producto

> **Transformar la experiencia de navegación e inducción dentro del campus**,
> dotando a los estudiantes de una herramienta inteligente y autónoma que elimine
> la desorientación y democratice el acceso rápido a la información institucional.

Detalle del *Product Vision Board* en
[06-backlog-y-roadmap §6.1](./06-backlog-y-roadmap.md#61-visión-del-producto).

| | |
|---|---|
| **Público objetivo** | Ingresantes, estudiantes de pre/posgrado, personal administrativo, visitantes y postulantes. |
| **Producto** | Mapa 3D (Mapbox) con avatar en tiempo real, rutas A→B y chatbot IA anclado a documentos oficiales (RAG). App React Native (Android/iOS) + backend propio. |
| **Valor** | Reducir el tiempo perdido buscando aulas/oficinas; arquitectura ampliable agregando documentos a la base de conocimiento. |

---

## 0.4 Objetivos

**General:** construir una aplicación móvil que integre un mapa 3D del campus con
un asistente IA confiable, para eliminar la desorientación dentro de la UNMSM.

**Específicos:**

1. Visualizar el campus en **3D** con la ubicación del usuario y puntos de interés.
2. Responder consultas institucionales **sin alucinar**, mediante **RAG** y
   **guardrails** de alcance (HU-2.2, HU-2.4).
3. Conectar **chat y mapa**: que el asistente trace rutas automáticamente (HU-2.3).
4. Mantener una **arquitectura ampliable**: sumar documentos a la base de
   conocimiento amplía el alcance sin reescribir la app.

---

## 0.5 Alcance del MVP

**Dentro del alcance:**

- Mapa 3D del campus con POIs, filtros de categoría y modos de cámara.
- Autenticación (registro con verificación por correo, login, modo invitado).
- Asistente de chat con respuestas ancladas a una base de conocimiento.
- Backend RAG con contrato `POST /api/chat` y enrutamiento (`draw_route`).

**Fuera del alcance (esta entrega):**

- Recuperación vectorial real con pgvector y embeddings neuronales (planificado).
- LLM real en producción (el diseño lo soporta; hoy corre en modo mock).
- Rutas paso a paso con instrucciones de voz y modo guía en tiempo real.

El estado actual por historia se detalla en
[06-backlog-y-roadmap §6.3](./06-backlog-y-roadmap.md#63-historias-de-usuario-y-estado)
y el avance del backend en [07-avance-backend](./07-avance-backend.md).

---

## 0.6 Metodología

Se aplica **Scrum** con 3 sprints, más un hito de planificación inicial y un
cierre de QA/sustentación. Cada sprint cierra con *review* y *retrospectiva*.

| Sprint | Tema | Periodo | Foco |
|--------|------|---------|------|
| Sprint 1 | Cimientos | 25/04 – 17/05 | Mapa 3D base + autenticación |
| Sprint 2 | El Cerebro | 19/05 – 31/05 | Backend RAG + guardrails (HU-2.2/2.4) |
| Sprint 3 | Integración | 09/06 – 21/06 | Chat→Mapa (HU-2.3) + sensores del avatar |

Cronograma completo (Gantt) en
[06-backlog-y-roadmap §6.4](./06-backlog-y-roadmap.md#64-cronograma-scrum).

---

## 0.7 Equipo y roles

_(Completar con los nombres reales del equipo.)_

| Integrante | Rol / Foco principal |
|------------|----------------------|
| _Pedro_ | Backend · Motor RAG · API · Despliegue |
| _(completar)_ | Mapa 3D · avatar · cámara |
| _(completar)_ | Autenticación (Supabase) · onboarding |
| _(completar)_ | UI del chat · perfil |
| _(completar)_ | Diseño · documentación |

---

## 0.8 Stack tecnológico (resumen)

| Capa | Tecnología |
|------|------------|
| App móvil | React Native + Expo + TypeScript |
| Mapas | Mapbox (`@rnmapbox/maps`, 3D nativo) |
| Estado | Zustand |
| Backend | FastAPI + Uvicorn (Python 3.11) |
| RAG | Motor propio (mock) → LlamaIndex / pgvector (objetivo) |
| Datos / Auth | Supabase (Postgres + pgvector + Auth) |
| LLM | OpenAI / Anthropic (proveedor enchufable) |
| Despliegue | Render (backend) · EAS Build (app) |

Detalle en [01-arquitectura-general](./01-arquitectura-general.md) y
[02-frontend](./02-frontend.md).

---

## 0.9 Entregables y artefactos

Mapa de los entregables de gestión y dónde encontrarlos en este repositorio:

| Artefacto | Ubicación |
|-----------|-----------|
| **Planning Document** (este informe) | `documents/00-planning-document.md` |
| **Product Backlog** | [06-backlog-y-roadmap §6.2](./06-backlog-y-roadmap.md#62-épicas) |
| **User Stories** | [06-backlog-y-roadmap §6.3](./06-backlog-y-roadmap.md#63-historias-de-usuario-y-estado) |
| **Product Roadmap / Cronograma** | [06-backlog-y-roadmap §6.4](./06-backlog-y-roadmap.md#64-cronograma-scrum) |
| Documentación técnica | `documents/01`–`08` (arquitectura, frontend, backend, datos, flujos, avance, despliegue) |
| Capturas para la sustentación | `documents/screenshots/` |

---

## 0.10 Riesgos y supuestos

| Riesgo / Supuesto | Mitigación |
|-------------------|------------|
| Dependencia de llaves de LLM y de Supabase pgvector (aún no disponibles). | Diseño **mock-first**: el sistema funciona y se demuestra sin servicios externos; pasar a real es cambiar configuración, no reescribir. |
| `@rnmapbox/maps` no corre en Expo Go (requiere build nativo). | Compilación con **EAS Build** (APK/IPA). |
| Cold-start del backend en el plan gratis de Render. | Despertar el servicio antes de la demo; alternativa Railway si molesta. |
| Alcance amplio para el tiempo disponible. | Priorización por épicas y entrega incremental por sprint (MVP primero). |

---

## 0.11 Cómo navegar la documentación

Empieza por este informe (visión global) y continúa según tu interés:
[01 Arquitectura general](./01-arquitectura-general.md) ·
[02 Frontend](./02-frontend.md) ·
[03 Backend y RAG](./03-backend-rag.md) ·
[04 Modelo de datos](./04-modelo-de-datos.md) ·
[05 Flujos](./05-flujos.md) ·
[06 Backlog y roadmap](./06-backlog-y-roadmap.md) ·
[07 Avance del backend](./07-avance-backend.md) ·
[08 Despliegue en Render](./08-despliegue-render.md).
