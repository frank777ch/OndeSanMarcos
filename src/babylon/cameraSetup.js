// src/babylon/cameraSetup.js
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera.js";

export function createPlayerCamera(scene, canvas) {
  console.log("Creando PlayerCamera...");
  const camera = new FreeCamera(
    "playerCamera",
    new Vector3(0, 1.7, -15), // Posición inicial
    scene
  );
  camera.setTarget(Vector3.Zero()); // Mirar al origen

  // Controles de teclado
  camera.keysUp.push(87);    // W
  camera.keysDown.push(83);  // S
  camera.keysLeft.push(65);  // A
  camera.keysRight.push(68); // D

  // Sensibilidad y velocidad
  camera.speed = 0.5;
  camera.angularSensibility = 4000;

  // Configuración de colisiones para la cámara
  camera.ellipsoid = new Vector3(0.5, 0.9, 0.5); // "Hitbox" de la cámara
  camera.checkCollisions = true;               // Activar detección de colisiones para la cámara
  camera.applyGravity = true;                  // La cámara es afectada por la gravedad

  // Adjuntar control al canvas (para mouse y teclado)
  camera.attachControl(canvas, true);
  console.log("PlayerCamera creada y configurada.");
  return camera;
}
