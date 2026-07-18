# Análisis de Desempeño — Sprint 3

## 1. Resumen ejecutivo del sprint

- **Nombre:** Sprint 3: Integración
- **Enfoque Principal:** Navegación Inteligente y Pulido Final
- **Periodo:** 08/06/2026 – 21/06/2026
- **Estado Global:** 100% Completado (Realizado)

---

## 2. Logros técnicos y entregables

### Conexión automática Chat-Mapa (HU-2.3)

Se culminó la integración inteligente del front-end. Ahora la aplicación es capaz de:

- Parsear dinámicamente las respuestas JSON emitidas por el backend FastAPI.
- Detectar la presencia del _flag_ `draw_route: true` y extraer las coordenadas de destino recomendadas por la IA.
- Actualizar el estado global mediante Zustand (`useMapStore.setFocusTarget`) forzando a _React Navigation_ a cambiar automáticamente de la pestaña de chat a la del mapa, centrando la cámara y trazando la ruta sin requerir clics adicionales del usuario.

### Sensores y Rotación Real (HU-1.2)

- Se integró el paquete `expo-sensors` para leer los datos del magnetómetro del dispositivo.
- En combinación con `expo-location`, el avatar (indicador de ubicación) en el mapa ahora rota físicamente en la pantalla, apuntando en la dirección en la que el estudiante está mirando.
- Se implementaron algoritmos de suavizado (_anti-jitter_) para promediar los vectores recibidos, impidiendo temblores visuales en la interfaz.

---

## 3. Retos resueltos en el sprint

- **Sincronización de Estados (Zustand y React Navigation):** Controlar la transición veloz entre pantallas mientras, de manera asíncrona, se inicializaba la instancia de `@rnmapbox/maps` para mover la cámara hacia nuevas coordenadas provocaba _race conditions_. Esto se resolvió delegando la escucha a un `useEffect` que verifica pasivamente el estado global de `focusTarget`, asegurando que el renderizado de la UI preceda al cálculo geoespacial de la cámara.
- **Suavizado del Magnetómetro:** Los sensores magnéticos en la mayoría de smartphones modernos contienen ruido y son susceptibles a interferencia electromagnética (EDM). El equipo mitigó este problema construyendo un filtro matemático de paso bajo, priorizando una experiencia visual estable para el avatar por encima de una reactividad brusca.

---

## 4. Lecciones aprendidas del proyecto

Lista de lecciones aprendidas:

### Infraestructura Mobile (Expo y Nativos)

La transición de probar la aplicación en _Expo Go_ a construir _Development Builds_ (EAS), ya que `@rnmapbox/maps` utiliza componentes nativos que _Expo Go_ no soporta, el equipo tuvo que adoptar un flujo continuo de generación de archivos `.apk` y perfiles de aprovisionamiento en la nube de EAS (Expo Application Services).

### Gestión de Estado de Alta Frecuencia

Actualizar las coordenadas GPS a una tasa de 1 Hz (un hercio) mediante el Contexto nativo de React habría generado una cascada de re-renders masivos perjudiciales para la batería y la fluidez gráfica. El uso de **Zustand** facilitó suscripciones granulares (donde solo el componente del Avatar se actualiza, dejando el resto de la interfaz quieta), siendo una decisión arquitectónica clave.

### Ingeniería de Prompts y Seguridad (RAG)

Se aprendió que configurar bases de datos vectoriales (`pgvector`) no es suficiente; el verdadero desafío es la orquestación del _system prompt_. Delimitar al LLM (LlamaIndex + Gemini) de modo que sus respuestas siempre proyecten seriedad y se nieguen amablemente a contestar sobre temas ajenos a la UNMSM.

### Despliegue y Limitaciones Serverless (Render)

Al desplegar nuestro backend FastAPI en el ecosistema gratuito/económico de Render, nos topamos con el fenómeno de _cold starts_ (arranques en frío). Esto generaba latencias de hasta 30 segundos en la primera interacción del chat, entorpeciendo la experiencia de usuario. La lección principal de cara a escalabilidad futura es garantizar la persistencia en memoria de la API y mitigar los tiempos de espera a nivel UX (añadiendo animaciones envolventes de "procesamiento").

### UX/UI en Aplicaciones Geoespaciales

Separar un mapa y un chat en pestañas distintas obliga al usuario a dividir su atención. La interfaz de chat debe "ordenar" a la interfaz del mapa, por lo que la automatización de navegación construida en la HU-2.3 demostró que una app con múltiples facetas debe sentirse siempre como una sola entidad conectada.

### Documentación "Feature-Based"

Organizar la arquitectura por funcionalidades (`features/auth`, `features/map`, `features/chat`) en vez de por tipo de archivos (`screens/`, `components/`) facilitó enormemente la redacción técnica. Mantener la documentación sincronizada con el código minimizó los conflictos y permitió aislamiento rápido de bugs sin ensuciar otras áreas.
