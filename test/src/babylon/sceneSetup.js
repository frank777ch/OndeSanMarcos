// src/babylon/sceneSetup.js

import { Engine } from "@babylonjs/core/Engines/engine.js";
import { Scene } from "@babylonjs/core/scene.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { Color4 } from "@babylonjs/core/Maths/math.color.js"; // Para el color de fondo
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight.js";

// Importar el side effect para el sistema de colisiones.
// Es crucial cuando habilitas 'scene.collisionsEnabled = true'.
import "@babylonjs/core/Collisions/collisionCoordinator.js";

/**
 * Crea y devuelve una instancia del motor de Babylon.js.
 * @param {HTMLCanvasElement} canvas El elemento canvas donde se renderizará la escena.
 * @returns {Engine} La instancia del motor de Babylon.js.
 */
export function createEngine(canvas) {
  console.log("sceneSetup.js: Creando Engine...");
  const engine = new Engine(canvas, true, { // El 'true' habilita antialiasing
    preserveDrawingBuffer: true, // Útil si necesitas tomar capturas de pantalla del canvas
    stencil: true,             // Necesario para algunos efectos avanzados (como el GlowLayer)
    disableWebGL2Support: false // Asegura que se intente usar WebGL2 si está disponible
  });
  return engine;
}

/**
 * Crea y devuelve una instancia de la escena de Babylon.js, configurada con
 * elementos básicos como luz, gravedad y color de fondo.
 * @param {Engine} engine La instancia del motor de Babylon.js.
 * @returns {Scene} La instancia de la escena.
 */
export function createScene(engine) {
  console.log("sceneSetup.js: Creando Scene...");
  const scene = new Scene(engine);

  // --- Configuración General de la Escena ---

  // Color de fondo de la escena (RGBA)
  // El color morado que tenías (puedes cambiarlo al color que prefieras)
  // new Color4(R, G, B, Alpha) -> Valores de 0 a 1
  scene.clearColor = new Color4(0.2, 0.2, 0.3, 1.0); // Un azul oscuro/morado

  // Habilitar el sistema de colisiones para esta escena
  scene.collisionsEnabled = true;
  console.log("sceneSetup.js: Sistema de colisiones habilitado para la escena.");

  // Definir la gravedad global de la escena (vector apuntando hacia abajo en Y)
  scene.gravity = new Vector3(0, -0.981, 0); // -0.981 es una aproximación más realista
                                           // Antes teníamos -0.9, puedes ajustar este valor
  console.log("sceneSetup.js: Gravedad de la escena establecida a:", scene.gravity);

  // --- Luz Principal ---
  // Una HemisphericLight es buena para iluminación ambiental general.
  const light = new HemisphericLight(
    "mainLight",          // Nombre de la luz
    new Vector3(0, 1, 0), // Dirección de la luz (0,1,0 es desde arriba)
    scene                 // La escena a la que pertenece
  );
  light.intensity = 0.8;  // Brillo de la luz (0 a 1 es un buen rango)
  // Opcional: puedes cambiar los colores de la luz del cielo (diffuse) y del suelo (groundColor)
  // light.diffuse = new Color3(1, 1, 1); // Luz blanca desde arriba
  // light.groundColor = new Color3(0.5, 0.5, 0.5); // Luz grisácea reflejada desde abajo
  console.log("sceneSetup.js: Luz principal (HemisphericLight) creada.");

  return scene;
}
