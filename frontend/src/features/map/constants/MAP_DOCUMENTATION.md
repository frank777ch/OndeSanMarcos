# Guía de arquitectura y lógica del mapa

Esta guía documenta la lógica central, el manejo de la cámara, la ubicación del usuario (GPS) y los flujos de interacción implementados en el módulo de mapas (`MapScreen.tsx` y hooks asociados).

## 1. Modos de Aplicación (`appMode`)

La pantalla principal del mapa se rige por un estado interno llamado `appMode`, el cual puede tener tres valores:

- **`ninguno`**: Es el estado por defecto. El usuario puede mover el mapa libremente. También es el estado que se activa al hacer "Iniciar Ruta" (para previsualizar la ruta trazada sin bloquear la cámara al usuario). En este modo **no se muestra el Avatar 3D**, solo un punto azul indicando la ubicación física si hay señal de GPS.
- **`libre`**: Se activa desde "Modos de Seguimiento -> Modo Libre". La cámara "aterriza" (`goToFreeMode`) en un lugar seleccionado (ej. Puerta 3) y se marca dicho lugar con un punto azul estático (Punto de Exploración). Si el usuario está físicamente en el campus, su Avatar 3D se mostrará donde realmente está.
- **`guia`**: Se activa desde "Modos de Seguimiento -> Modo de Guía". Activa la suscripción al GPS en tiempo real (`watchPositionAsync`). La cámara se inclina (`goToGuideMode`) y sigue al Avatar 3D (que representa al usuario) a medida que camina físicamente por el campus.

---

## 2. Ubicación Falsa vs GPS Real

Es crucial entender la separación conceptual de marcadores en el mapa:

1. **Ubicación Real (`userLocation`)**:
   - Representa el punto del sensor GPS del dispositivo.
   - **Indicador Normal**: Un punto azul translúcido (estilo Google Maps). Se muestra cuando el usuario está en el modo `ninguno`.
   - **Avatar 3D**: Se muestra _únicamente_ cuando el usuario está físicamente dentro del campus universitario **Y** tiene activo el `appMode` en `libre` o `guia`. Está condicionado también a que NO haya una ruta previsualizándose (`!isRouteActive`).
2. **Punto de Exploración (`exploreLocation`)**:
   - Aparece únicamente en el Modo Libre. Es el punto donde el usuario ha decidido "aparecer" virtualmente en el mapa (ej. "Comedor Universitario"). Se representa con el punto azul.
   - No interfiere con el `userLocation`.

---

## 3. Flujo: Funcionalidad "Iniciar Ruta"

Esta opción se utiliza para planificar una ruta de punto A a punto B, sin necesariamente empezar a caminar.

1. **Selección**: El usuario abre `MapRouteSelectionModal` y elige el Origen y Destino. Puede usar "Mi Ubicación" si su GPS está encendido.
2. **Confirmación (`handleRouteConfirm`)**:
   - Se ejecuta el cálculo de la ruta mediante `useRouting.ts` (Pathfinder local).
   - El estado de la app se fuerza a `ninguno` (`setAppMode("ninguno")`).
   - El seguimiento de la cámara se apaga (`isFollowingUser = false`).
3. **Cámara**: Se llama a `goToRoutePreview(start)`, lo que levanta la cámara a una altura panorámica para mostrar el trazo de la ruta en el mapa.
4. **Finalización (`handleStopRoute`)**: Limpia el store, borra el trazo y mantiene la cámara libre, permitiendo seguir explorando.

_(Nota: Durante una ruta activa, el Avatar 3D se oculta para no recargar visualmente la pantalla y evitar choques visuales con la ruta trazada)._

---

## 4. Gestión de Cámara (`useMapCamera.ts`)

El control visual del mapa (`MapboxGL.Camera`) está centralizado en el hook `useMapCamera`. Nunca modifiques el mapa directamente; utiliza estas funciones:

- **`goToDefaultMode`**: Centra en la ciudad universitaria, altura media, mirando al norte.
- **`goToFreeMode(coord)`**: Hace un zoom muy cercano (`zoomLevel: 21`) e inclinado (`pitch: 80`) al lugar de interés seleccionado en Modo Libre.
- **`goToRoutePreview(startCoord)`**: Levanta la cámara a una altura táctica (`zoomLevel: 17`, `pitch: 40`) sobre el inicio de la ruta trazada, para ver el trayecto general.
- **`goToGuideMode(userCoord)`**: Fija la cámara detrás del usuario, la inclina y se prepara para recibir actualizaciones en tiempo real y girar.
- **`moveToPoint(coord)`**: Usado internamente por el `watchPositionAsync` para mover el centro de la pantalla cada vez que el GPS reporta un cambio, sin romper la animación (`duration: 1000`).

---

## 5. El Ciclo de Vida del GPS (Seguimiento Real)

En `MapScreen.tsx`, el `useEffect` principal gestiona el GPS:

1. **Montaje Inicial**: Intenta usar `getLastKnownPositionAsync` o `getCurrentPositionAsync` para setear la posición inicial sin bloquear la interfaz.
2. **Activación de Modo Guía**: Cuando `appMode` cambia a `guia`, se ejecuta la subscripción de `Location.watchPositionAsync`. Esto obliga al estado `userLocation` a actualizarse continuamente.
3. **Movimiento**: En cada "tick" del GPS, si `isFollowingUserRef.current` es verdadero, llama a `moveToPoint()` para arrastrar la cámara.
4. **Limpieza**: Si el usuario abandona el Modo Guía (ej. cancelando la ruta o pasando a Modo Libre), las subscripciones (`locSub.remove()`) se destruyen para ahorrar batería.

---

## 6. Integración con Stores (Zustand)

- **`useMapStore`**: Se utiliza para compartir el contexto de navegación a componentes hijos sin inyectar props. Contiene `activeRoute` (el array de coordenadas a dibujar) y banderas como `isRouteActive`.
- **`useRouting`**: Se encarga puramente de la lógica matemática para unir dos puntos basados en `campusPathfinder`. No modifica UI, solo calcula matrices y guarda el resultado en `useMapStore`.
