// src/babylon/sceneSetup.js
import { Engine } from "@babylonjs/core/Engines/engine.js";
import { Scene } from "@babylonjs/core/scene.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight.js";

// Side effect para el sistema de colisiones (necesario cuando scene.collisionsEnabled = true)
import "@babylonjs/core/Collisions/collisionCoordinator.js";

export function createEngine(canvas) {
  console.log("Creando Engine...");
  return new Engine(canvas, true);
}

export function createScene(engine) {
  console.log("Creando Scene...");
  const scene = new Scene(engine);

  // Configuración básica de la escena
  scene.collisionsEnabled = true; // Habilitar motor de colisiones para la escena
  scene.gravity = new Vector3(0, -0.9, 0); // Definir gravedad global

  // Luz principal
  const light = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
  light.intensity = 0.8;
  console.log("Luz principal creada.");

  return scene;
}
