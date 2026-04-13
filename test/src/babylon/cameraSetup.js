// src/babylon/cameraSetup.js

import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera.js";
// Si en el futuro quieres una cámara de tercera persona más orbital clásica:
// import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera.js";

// --- Constantes de Configuración de Cámara ---
const THIRD_PERSON_DISTANCE = 4;
const THIRD_PERSON_HEIGHT_OFFSET = 1.5;
const FIRST_PERSON_OFFSET = new Vector3(0, 0.7, 0.15); // X, Y(altura ojos relativo al pivote), Z(adelante)
const CAMERA_LERP_FACTOR = 0.15; // Suavizado del movimiento de cámara TPS (0-1, más bajo es más suave)
let thirdPersonTargetYOffset = 1.0; // A qué altura del personaje (desde su pivote) mira la cámara en TPS

/**
 * Crea y configura la cámara principal del jugador.
 * @param {Scene} scene La instancia de la escena de Babylon.js.
 * @param {HTMLCanvasElement} canvas El elemento canvas para adjuntar controles.
 * @param {Nullable<AbstractMesh>} targetCharacterMesh La malla del personaje a seguir.
 * @param {boolean} initialIsFirstPerson Si la cámara debe iniciar en modo primera persona.
 * @returns {FreeCamera} La instancia de la cámara creada.
 */
export function createPlayerCamera(scene, canvas, targetCharacterMesh = null, initialIsFirstPerson = false) {
  console.log("cameraSetup.js: Creando PlayerCamera...");

  const camera = new FreeCamera("playerCamera", Vector3.Zero(), scene);

  // --- Configuración Común de la Cámara ---
  camera.angularSensibility = 4000; // Sensibilidad del mouse para rotar. Ajusta si es necesario.

  // CLAVE: Adjuntar control del mouse. El segundo argumento 'true' llama a preventDefault.
  // Esto a menudo es necesario para que la cámara reciba correctamente los eventos del mouse
  // cuando el cursor está sobre el canvas.
  camera.attachControl(canvas, true); // Probamos con 'true'

  // La cámara NO gestionará su propia gravedad ni colisiones directamente,
  // ya que seguirá o estará emparentada a un personaje que sí las tiene.
  camera.applyGravity = false;
  camera.checkCollisions = false;

  // Desactivar los controles de teclado por defecto de la FreeCamera,
  // ya que el movimiento WASD lo controlará el personaje.
  // Esto evita que la cámara y el personaje intenten moverse con las mismas teclas.
  if (camera.inputs.attached.keyboard) {
    camera.inputs.remove(camera.inputs.attached.keyboard);
  }
  // Podrías ser más específico si solo quieres quitar el movimiento WASD:
  // camera.inputs.removeByType("FreeCameraKeyboardMoveInput");


  // Inicializar la vista de la cámara
  if (targetCharacterMesh) {
    if (initialIsFirstPerson) {
      switchToFirstPerson(camera, targetCharacterMesh);
    } else {
      switchToThirdPerson(camera, targetCharacterMesh);
    }
  } else {
    camera.position = new Vector3(0, 5, -10);
    camera.setTarget(Vector3.Zero());
    console.warn("cameraSetup.js: No se proporcionó personaje target, cámara en posición por defecto.");
  }

  // --- Lógica de Seguimiento en Tercera Persona ---
  let currentCameraTargetPosition = targetCharacterMesh ? targetCharacterMesh.position.clone().add(new Vector3(0, thirdPersonTargetYOffset, 0)) : Vector3.Zero();

  // Guardamos la referencia al observable para poder quitarlo en cleanup si es necesario
  // aunque al cambiar de modo FPS/TPS o al disponer la cámara, los observables de la cámara se limpian.
  // El observable de la escena es más persistente.
  const tpsObserver = scene.onBeforeRenderObservable.add(() => {
    if (targetCharacterMesh && camera && !camera.metadata?.isFirstPerson) {
      const desiredTargetPosition = targetCharacterMesh.position.clone().add(new Vector3(0, thirdPersonTargetYOffset, 0));
      currentCameraTargetPosition = Vector3.Lerp(currentCameraTargetPosition, desiredTargetPosition, CAMERA_LERP_FACTOR * 2);

      const backwardDirection = new Vector3(
        Math.sin(targetCharacterMesh.rotation.y),
        0,
        Math.cos(targetCharacterMesh.rotation.y)
      );

      const desiredCameraPosition = targetCharacterMesh.position.clone()
        .add(new Vector3(0, THIRD_PERSON_HEIGHT_OFFSET, 0))
        .subtract(backwardDirection.scale(THIRD_PERSON_DISTANCE));

      camera.position = Vector3.Lerp(camera.position, desiredCameraPosition, CAMERA_LERP_FACTOR);
      camera.setTarget(currentCameraTargetPosition);
    }
  });
  // Podrías guardar tpsObserver en camera.metadata para quitarlo si cambias a FPS y no quieres que siga corriendo,
  // aunque en este caso, la condición `!camera.metadata?.isFirstPerson` ya lo detiene.

  console.log("cameraSetup.js: PlayerCamera creada. Modo inicial:", initialIsFirstPerson ? "Primera Persona" : "Tercera Persona");
  return camera;
}

/**
 * Cambia la cámara a modo Primera Persona.
 */
export function switchToFirstPerson(camera, targetCharacterMesh) {
  if (!camera || !targetCharacterMesh) return;
  console.log("cameraSetup.js: Cambiando a vista en Primera Persona...");

  camera.parent = targetCharacterMesh;
  camera.position = FIRST_PERSON_OFFSET.clone();

  // En primera persona, el target de la cámara no necesita actualizarse dinámicamente
  // si está emparentada y bien posicionada. El mouse rotará la vista local de la cámara.
  // Se podría añadir un target lejano para asegurar que mira "hacia adelante" respecto al personaje:
  // const forwardLocal = new Vector3(0,0,1); // Dirección local "adelante"
  // const targetGlobal = Vector3.TransformCoordinates(forwardLocal, targetCharacterMesh.getWorldMatrix());
  // camera.setTarget(targetGlobal);
  // O más simple, para mirar horizontalmente desde la posición de la cámara:
  camera.setTarget(camera.position.add(new Vector3(Math.sin(camera.rotation.y),0,Math.cos(camera.rotation.y)).scaleInPlace(10)));


  if (!camera.metadata) camera.metadata = {};
  camera.metadata.isFirstPerson = true;

  // Reactivar el input del mouse si se hubiera desactivado (aunque no debería ser el caso aquí)
  // if (!camera.inputs.attached.mouse) {
  //   camera.inputs.addMouse();
  // }
}

/**
 * Cambia la cámara a modo Tercera Persona.
 */
export function switchToThirdPerson(camera, targetCharacterMesh) {
  if (!camera || !targetCharacterMesh) return;
  console.log("cameraSetup.js: Cambiando a vista en Tercera Persona...");

  camera.parent = null; // Desemparentar

  // Forzar una actualización inicial de la posición TPS para evitar saltos.
  // La lógica en onBeforeRenderObservable se encargará del seguimiento continuo.
  const targetPositionForLook = targetCharacterMesh.position.clone().add(new Vector3(0, thirdPersonTargetYOffset, 0));
  const backwardDirection = new Vector3(
    Math.sin(targetCharacterMesh.rotation.y),
    0,
    Math.cos(targetCharacterMesh.rotation.y)
  );
  const desiredCameraPosition = targetCharacterMesh.position.clone()
    .add(new Vector3(0, THIRD_PERSON_HEIGHT_OFFSET, 0))
    .subtract(backwardDirection.scale(THIRD_PERSON_DISTANCE));

  camera.position = desiredCameraPosition;
  camera.setTarget(targetPositionForLook);

  if (!camera.metadata) camera.metadata = {};
  camera.metadata.isFirstPerson = false;

  // Asegurar que el input del mouse esté activo
  // if (!camera.inputs.attached.mouse) {
  //   camera.inputs.addMouse(); // Por si se hubiera quitado
  // }
}
