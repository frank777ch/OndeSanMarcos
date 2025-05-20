<script setup>
// --- Importaciones de Vue ---
import { ref, onMounted, onUnmounted, reactive } from 'vue';

// --- Importaciones de Babylon.js (Clases principales si se usan directamente aquí) ---
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { KeyboardEventTypes } from '@babylonjs/core/Events/keyboardEvents.js';

// --- Importar nuestros Módulos de Lógica de Babylon ---
import { createEngine, createScene } from '../babylon/sceneSetup.js';
import { createPlayerCamera, switchToFirstPerson, switchToThirdPerson } from '../babylon/cameraSetup.js';
import { createGroundAndWalls } from '../babylon/environmentSetup.js';
import { loadCharacter, loadCrate } from '../babylon/modelLoader.js';

// --- Referencia al Elemento Canvas del Template ---
const canvasElement = ref(null);

// --- Variables Globales del Módulo para Babylon (accesibles dentro del setup) ---
let babylonEngine = null;
let currentScene = null;
let camera = null;

// --- Variables del Personaje y Otros Objetos ---
let playerCharacter = null;
let playerAnimations = { // La clave para la animación de reposo sigue siendo 'idle'
  idle: null,
  walk: null,
};
let crateObject = null;

// --- Estado Reactivo del Jugador ---
const playerState = reactive({
  isWalking: false,
  isFirstPerson: false,
  speed: 0.05,
  rotationSpeed: 0.05
});

// --- Mapa de Teclas Presionadas ---
const inputMap = {};

// --- FUNCIÓN PRINCIPAL DE INICIALIZACIÓN DE BABYLON ---
const initializeBabylon = async () => {
  if (!canvasElement.value) {
    console.error("BabylonScene.vue: El elemento canvas no está disponible.");
    return;
  }
  console.log("BabylonScene.vue: Iniciando inicialización de Babylon.js...");

  babylonEngine = createEngine(canvasElement.value);
  currentScene = createScene(babylonEngine);

  const characterData = await loadCharacter(currentScene);
  if (characterData && characterData.mesh) {
    playerCharacter = characterData.mesh;
    // Mapear animaciones
    playerAnimations.idle = characterData.animationGroups.find(ag => ag.name.toLowerCase().includes("ldle")); // <--- CAMBIO AQUÍ: buscar "ldle"
    playerAnimations.walk = characterData.animationGroups.find(ag => ag.name.toLowerCase().includes("walk") || ag.name.toLowerCase().includes("walking"));

    if (playerAnimations.idle) { // Se accede con la clave 'idle'
      playerAnimations.idle.start(true, 1.0, playerAnimations.idle.from, playerAnimations.idle.to, false);
      console.log("BabylonScene.vue: Animación 'ldle' (mapeada a 'idle') del personaje iniciada.");
    } else {
      console.warn("BabylonScene.vue: Animación 'ldle' (buscada como ldle) del personaje NO encontrada.");
    }
  } else {
    console.error("BabylonScene.vue: Falla al cargar el personaje principal.");
  }

  crateObject = await loadCrate(currentScene);
  if (!crateObject) {
      console.warn("BabylonScene.vue: No se pudo cargar la caja (crate.glb).");
  }

  camera = createPlayerCamera(currentScene, canvasElement.value, playerCharacter, playerState.isFirstPerson);
  createGroundAndWalls(currentScene);

  currentScene.onKeyboardObservable.add((kbInfo) => {
    switch (kbInfo.type) {
      case KeyboardEventTypes.KEYDOWN:
        inputMap[kbInfo.event.key.toLowerCase()] = true;
        if (kbInfo.event.key.toLowerCase() === "c" && playerCharacter && camera) {
          toggleCameraView();
        }
        break;
      case KeyboardEventTypes.KEYUP:
        inputMap[kbInfo.event.key.toLowerCase()] = false;
        break;
    }
  });

  currentScene.onBeforeRenderObservable.add(() => {
    if (playerCharacter) {
      updatePlayerMovementAndAnimation();
    }
  });

  babylonEngine.runRenderLoop(() => {
    if (currentScene) {
      currentScene.render();
    }
  });

  window.addEventListener('resize', handleWindowResize);
  console.log("BabylonScene.vue: Inicialización de Babylon.js completada y corriendo.");
};

// --- LÓGICA DE MOVIMIENTO Y ANIMACIÓN DEL PERSONAJE ---
function updatePlayerMovementAndAnimation() {
  if (!playerCharacter || !currentScene) return;

  let isCurrentlyMovingOrRotating = false;
  const moveDirection = Vector3.Zero();

  if (inputMap["w"]) {
    const forward = new Vector3(Math.sin(playerCharacter.rotation.y), 0, Math.cos(playerCharacter.rotation.y));
    moveDirection.addInPlace(forward);
    isCurrentlyMovingOrRotating = true;
  }
  if (inputMap["s"]) {
    const backward = new Vector3(-Math.sin(playerCharacter.rotation.y), 0, -Math.cos(playerCharacter.rotation.y));
    moveDirection.addInPlace(backward);
    isCurrentlyMovingOrRotating = true;
  }

  if (inputMap["a"]) {
    playerCharacter.rotation.y -= playerState.rotationSpeed;
    isCurrentlyMovingOrRotating = true;
  }
  if (inputMap["d"]) {
    playerCharacter.rotation.y += playerState.rotationSpeed;
    isCurrentlyMovingOrRotating = true;
  }

  if (moveDirection.lengthSquared() > 0) {
    moveDirection.normalize();
    playerCharacter.moveWithCollisions(moveDirection.scaleInPlace(playerState.speed));
  }

  if (isCurrentlyMovingOrRotating !== playerState.isWalking) {
    playerState.isWalking = isCurrentlyMovingOrRotating;
    if (playerState.isWalking) {
      if (playerAnimations.walk) {
        playerAnimations.idle?.stop(); // Se usa la clave 'idle'
        playerAnimations.walk.start(true, 1.0, playerAnimations.walk.from, playerAnimations.walk.to, false);
      } else { console.warn("BabylonScene.vue: Animación 'walk' no disponible para iniciar."); }
    } else {
      if (playerAnimations.idle) { // Se usa la clave 'idle'
        playerAnimations.walk?.stop();
        playerAnimations.idle.start(true, 1.0, playerAnimations.idle.from, playerAnimations.idle.to, false);
      } else { console.warn("BabylonScene.vue: Animación 'ldle' (mapeada a 'idle') no disponible para iniciar."); }
    }
  }
}

// --- LÓGICA PARA CAMBIAR LA VISTA DE CÁMARA ---
function toggleCameraView() {
  if (!camera || !playerCharacter) return;
  playerState.isFirstPerson = !playerState.isFirstPerson;

  if (playerState.isFirstPerson) {
    switchToFirstPerson(camera, playerCharacter);
    console.log("BabylonScene.vue: Vista cambiada a Primera Persona.");
  } else {
    switchToThirdPerson(camera, playerCharacter);
    console.log("BabylonScene.vue: Vista cambiada a Tercera Persona.");
  }
}

// --- LIMPIEZA DE RECURSOS DE BABYLON AL DESMONTAR EL COMPONENTE ---
const cleanupBabylon = () => {
  console.log("BabylonScene.vue: Limpiando recursos de Babylon.js...");
  window.removeEventListener('resize', handleWindowResize);
  currentScene?.onKeyboardObservable.clear();
  currentScene?.onBeforeRenderObservable.clear();

  if (babylonEngine) {
    babylonEngine.dispose();
  }
  babylonEngine = null;
  currentScene = null;
  camera = null;
  playerCharacter = null;
  crateObject = null;
  playerAnimations = { idle: null, walk: null }; // Se resetea con la clave 'idle'
  console.log("BabylonScene.vue: Recursos de Babylon liberados.");
};

// --- MANEJADOR DE REDIMENSIONADO DE VENTANA ---
const handleWindowResize = () => {
  if (babylonEngine) {
    babylonEngine.resize();
  }
};

// --- HOOKS DEL CICLO DE VIDA DE VUE ---
onMounted(() => {
  initializeBabylon();
});

onUnmounted(() => {
  cleanupBabylon();
});
</script>

<template>
  <canvas ref="canvasElement" class="render-canvas"></canvas>
</template>

<style scoped>
.render-canvas {
  width: 100vw;
  height: 100vh;
  display: block;
  outline: none;
  touch-action: none;
}
</style>
