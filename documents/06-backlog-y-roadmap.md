# 6. Backlog y roadmap

Consolida la visión del producto, el backlog (épicas e historias de usuario) y el cronograma. Este documento refleja el **estado final y completado** del proyecto OndeSanMarcos.

> Fuente: *Product Vision Board v1.0* y *Product Backlog v1.1* del equipo. Todas las épicas e historias de usuario han sido **implementadas**.

---

## 6.1 Visión del producto

> **Transformar la experiencia de navegación e inducción dentro del campus**, dotando a los estudiantes de una herramienta inteligente y autónoma que elimine la desorientación y democratice el acceso rápido a la información institucional.

| | |
|---|---|
| **Público** | Ingresantes, estudiantes de pre/posgrado, personal administrativo, visitantes y postulantes. |
| **Problema** | Campus grande y confuso; horarios dispersos en PDFs/redes; mapas 2D estáticos; Google Maps desactualizado. |
| **Producto** | Mapa 3D (Mapbox) con avatar en tiempo real, rutas óptimas A→B, y chatbot IA anclado a documentos oficiales (RAG). React Native (Android/iOS) + backend de alto rendimiento. |
| **Valor** | Reducir el tiempo perdido buscando aulas/oficinas; demostrar IA generativa en móvil; arquitectura ampliable agregando documentos a la base vectorial. |

---

## 6.2 Épicas

```mermaid
graph LR
    P["OndeSanMarcos"] --> E1["EPIC01<br/>Navegación y Mapa 3D<br/>🔴 Alta"]
    P --> E2["EPIC02<br/>Asistente IA (RAG)<br/>🟡 Media"]
    P --> E3["EPIC03<br/>Motor de Rutas y GPS<br/>🟡 Media"]
    P --> E4["EPIC04<br/>Perfil y Gestión<br/>🟢 Baja"]
```

| Código | Épica | Descripción | Prioridad |
|--------|-------|-------------|-----------|
| EPIC01 | Navegación y Mapa 3D | SDK Mapbox, entorno virtual y avatares. | Alta |
| EPIC02 | Asistente IA (RAG) | Motor conversacional + base vectorial. | Media |
| EPIC03 | Motor de Rutas y GPS | Algoritmos de ruta y geolocalización. | Media |
| EPIC04 | Perfil y Gestión Institucional | Auth, preferencias y base de conocimiento. | Baja |

---

## 6.3 Historias de usuario y estado

**Leyenda:** ✅ Implementado

### EPIC01 — Navegación y Mapa 3D

| HU | Nombre | Prioridad | Est. | Estado | Evidencia en código |
|----|--------|-----------|------|--------|---------------------|
| HU-1.1 | Permisos y Visualización Base | Alta | 5 | ✅ | `MapScreen` carga centrado en UNMSM; pide permiso; avatar si se concede. |
| HU-1.2 | Avatar con Rotación Real | Media | 8 | ✅ | `Location.watchHeadingAsync` implementado con orientación de la cámara e indicador visual de brújula. |
| HU-1.3 | Búsqueda de ubicaciones | Media | 5 | ✅ | `MapSearchBar` con lógica implementada; el mapa se centra automáticamente. |
| HU-1.4 | Indicador de ubicación actual | Media | 5 | ✅ | `MapLocationButton` integrado para mover y seguir la cámara en tiempo real. |
| HU-1.5 | Modo libre (street view) | Media | 8 | ✅ | `useMapCamera.goToFreeMode` + `MapSpawnModal`. |
| HU-1.6 | Modo guía | Alta | 8 | ✅ | `useMapCamera.goToGuideMode` activo y renderizado para seguir al usuario paso a paso en el mapa. |

### EPIC02 — Asistente IA (RAG)

| HU | Nombre | Prioridad | Est. | Estado | Evidencia en código |
|----|--------|-----------|------|--------|---------------------|
| HU-2.1 | Interfaz de Chat Dedicada | Alta | 5 | ✅ | Pestaña "Asistente", `ChatScreen`, burbujas, input. |
| HU-2.2 | Consultas RAG (Base de Conocimiento) | Alta | 13 | ✅ | Backend `/api/chat` desplegado con **LLM real (Gemini)** sobre **corpus oficial** y **recuperación semántica con pgvector**. |
| HU-2.3 | Enrutamiento Automático (Chat-Mapa) | Alta | 8 | ✅ | El mapa consume `focusTarget` (establecido desde `ChatScreen`) y genera/dibuja la ruta automáticamente. |
| HU-2.4 | Filtro de Contexto (Guardrails) | Alta | 3 | ✅ | Guardrails de alcance implementados con system prompts sólidos en el modelo Gemini en backend. |
| HU-2.5 | Sugerencias de preguntas | Media | 3 | ✅ | `SuggestionChips` en `ChatScreen`. |
| HU-2.6 | Respuestas enriquecidas | Media | 5 | ✅ | `LocationCard` con botón "Ver en mapa". |

### EPIC03 — Motor de Rutas y GPS

| HU | Nombre | Prioridad | Est. | Estado | Evidencia en código |
|----|--------|-----------|------|--------|---------------------|
| HU-3.1 | Trazado de Ruta (A→B) | Alta | 8 | ✅ | Enrutamiento manejado en `features/routing/` (hooks y pathfinder util) renderizado con `LineLayer` en Mapbox. |
| HU-3.2 | Instrucciones paso a paso | Alta | 8 | ✅ | Renderizado en `MapRouteInfoCard` y visualizado dinámicamente con progreso en el mapa. |
| HU-3.3 | Selección rápida de destino frecuente | Media | 5 | ✅ | Selector `MapRouteSelectionModal` implementado. |

### EPIC04 — Perfil y Gestión Institucional

| HU | Nombre | Prioridad | Est. | Estado | Evidencia en código |
|----|--------|-----------|------|--------|---------------------|
| HU-4.1 | Ingreso como Invitado | Alta | 3 | ✅ | `isGuest` en `useAuthStore` + gating. |
| HU-4.2 | Registro y Activación | Alta | 8 | ✅ | `authService.signUp` + deep link de verificación. |
| HU-4.3 | Inicio de sesión | Alta | 5 | ✅ | `authService.signIn` + `LoginScreen`. |
| HU-4.4 | Preferencias del usuario | Media | 5 | ✅ | `ProfileScreen` integrado y tematización global persistida a través de `useThemeStore`. |

---

## 6.4 Cronograma (Scrum)

Enfoque **SCRUM**, 3 sprints. Inicio **18/04/2026** — Fin **28/06/2026**.

```mermaid
gantt
    title OndeSanMarcos — Cronograma
    dateFormat YYYY-MM-DD
    axisFormat %d/%m

    section Hito 0 · Planificación
    Backlog, PVB y setup (done)        :done, h0, 2026-04-18, 2026-04-25

    section Sprint 1 · Cimientos
    HU-1.1 Mapa base 3D (done)         :done, s11, 2026-04-25, 2026-05-16
    HU-4.1 / 4.2 Auth e invitado (done):done, s12, 2026-04-25, 2026-05-16
    Review + Retro 1                   :s13, 2026-05-16, 2026-05-17

    section Sprint 2 · El Cerebro
    HU-2.2 / 2.4 RAG + Guardrails      :done, s21, 2026-05-19, 2026-05-31
    HU-3.1 Trazado de ruta             :done, s22, 2026-06-01, 2026-06-04
    Review + Retro 2                   :done, s23, 2026-06-05, 2026-06-07

    section Sprint 3 · Integración
    HU-2.3 Chat-Mapa (JSON)            :done, s31, 2026-06-09, 2026-06-14
    HU-1.2 Sensores y rotación         :done, s32, 2026-06-15, 2026-06-18
    Review final + Retro 3             :done, s33, 2026-06-19, 2026-06-21

    section Cierre
    QA + Documentación final           :done, c1, 2026-06-22, 2026-06-26
    Sustentación final                 :done, c2, 2026-06-27, 2026-06-28
```

| Hito | Periodo | Estado |
|------|---------|--------|
| Hito 0 — Planificación | 18/04 – 25/04 | ✅ Realizado |
| Hito 1 — Fin Sprint 1 | 25/04 – 17/05 | ✅ Realizado |
| Hito 2 — Fin Sprint 2 | 18/05 – 07/06 | ✅ Realizado |
| Hito 3 — Fin Sprint 3 | 08/06 – 21/06 | ✅ Realizado |
| Hito 4 — Proyecto Final | 22/06 – 28/06 | ✅ Realizado |

---

## 6.5 Mantenimiento y escalabilidad futura

Con el producto inicial (MVP) finalizado y entregado satisfactoriamente, el equipo recomienda el siguiente enfoque de cara a futuras iteraciones:

1. **Ampliación constante del corpus documental:** Ingresar manuales de usuario y reglamentos actualizados en la base de datos de embeddings (`pgvector`) para mantener al asistente de IA con la información más reciente.
2. **Monitorización del uso:** Estudiar analíticas y las consultas más repetidas en el backend para refinar los System Prompts.
3. **Escalabilidad del servidor:** Preparar un balanceador de carga si la base de estudiantes activos excede el cupo gratuito de las plataformas de hosting de prueba actuales.
