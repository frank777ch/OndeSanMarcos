# Análisis de Desempeño — Sprint 2

## 1. Resumen ejecutivo del sprint

- **Nombre:** Sprint 2: El Cerebro
- **Enfoque Principal:** Implementación de la IA RAG y estructuración del Motor de Rutas.
- **Periodo:** 18/05/2026 – 07/06/2026
- **Estado Global:** 100% Completado (Realizado)

---

## 2. Logros técnicos y entregables

### Cerebro y RAG (HU-2.2 / 2.4)

Se implementó el pipeline de arquitectura RAG (Retrieval-Augmented Generation) integrando **LlamaIndex** y las capacidades de recuperación semántica con pgvector.
Se establecieron **Guardrails** mediante _system prompts_ fuertemente definidos para asegurar que:

- Las respuestas del asistente inteligente estén enmarcadas estrictamente dentro del dominio de la UNMSM.
- Se eviten "alucinaciones" del modelo.
- Se mantenga una postura institucional en el tono y formato de la información entregada al estudiante.

### Motor de Rutas (HU-3.1)

Se sentaron las bases funcionales de navegación visual en el mapa de Mapbox mediante el trazado de rutas.

- Se habilitó la lógica de enrutamiento a nivel de frontend poblando el directorio `features/routing/` con hooks personalizados.
- Se implementó el uso de `LineLayer` nativo de Mapbox, permitiendo dibujar dinámicamente trayectorias poligonales (polylines) en formato GeoJSON directamente sobre el mapa 3D de la universidad.

---

## 3. Retos Resueltos en el sprint

- **Refinamiento de prompts (Guardrails):** Uno de los mayores desafíos técnicos fue evitar que el LLM evadiera el contexto institucional ante preguntas capciosas (jailbreak) o fuera de contexto. Esto se resolvió iterando los prompts del sistema hasta lograr una tasa de contención óptima sin perder la naturalidad de la respuesta.
- **Precisión geométrica en enrutamiento:** El cálculo manual de distancias (algoritmo Haversine) y la traducción de nodos GeoJSON a vectores interpretables por Mapbox requirió pruebas para garantizar que las líneas dibujadas sobre las calles del campus coincidieran perfectamente con las capas topológicas visuales, evitando que las rutas atraviesen edificios o zonas bloqueadas.

---

## 4. Próximos pasos (Sprint 3: Integración)

Con las capacidades individuales operativas, el esfuerzo principal del próximo sprint se centra en la convergencia total de los sistemas:

- **HU-2.3 (Enrutamiento Automático Chat-Mapa):** Lograr que el mapa intercepte el JSON devuelto por el backend (`draw_route: true`) y use el estado global (`useMapStore.setFocusTarget`) para trazar de manera autónoma la ruta recomendada por el asistente sin que el usuario tenga que interactuar manualmente con el mapa.
- **HU-1.2 (Sensores y Rotación del Avatar):** Integrar el paquete `expo-sensors` (magnetómetro) y desarrollar algoritmos de suavizado de ruido (_anti-jitter_) para que el avatar del estudiante rote y siga la brújula del dispositivo móvil en tiempo real.
- **Demo Completa E2E (End-to-End):** Consolidar la experiencia de usuario ejecutando pruebas de integración que demuestren una sesión fluida y continua: solicitar indicaciones mediante lenguaje natural al asistente y ser guiado paso a paso por el mapa 3D.
