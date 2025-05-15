<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// Importar nuestras funciones modularizadas de Babylon
import { createEngine, createScene } from '../babylon/sceneSetup.js';
import { createPlayerCamera } from '../babylon/cameraSetup.js';
import { createGroundAndWalls } from '../babylon/environmentSetup.js';
import { loadMainModel } from '../babylon/modelLoader.js';

const canvasElement = ref(null);

// Guardamos referencias a las instancias principales de Babylon
let babylonEngine = null;
let currentScene = null; // Renombrado para claridad
let playerCamera = null; // Podemos guardar la cámara si necesitamos acceder a ella
// let mainModelInstance = null; // Si necesitaramos referencia al modelo cargado

const initializeBabylon = async () => {
  if (!canvasElement.value) {
    console.error("Error: El elemento canvas no está disponible al inicializar.");
    return; // Salir temprano si no hay canvas
  }

  console.log("Inicializando Babylon.js (versión modularizada)...");

  // 1. Crear Engine y Scene
  babylonEngine = createEngine(canvasElement.value);
  currentScene = createScene(babylonEngine);

  // 2. Crear y configurar la Cámara del Jugador
  // Pasamos 'currentScene' y 'canvasElement.value' porque la cámara los necesita
  playerCamera = createPlayerCamera(currentScene, canvasElement.value);

  // 3. Crear el Entorno (Suelo y Muros)
  createGroundAndWalls(currentScene); // Solo necesita la escena

  // 4. Cargar el Modelo Principal
  // Es asíncrono, así que usamos await
  /* mainModelInstance = */ await loadMainModel(currentScene); // Solo necesita la escena
  // Descomentar la asignación si necesitas la referencia al modelo

  // 5. Iniciar el Bucle de Renderizado
  babylonEngine.runRenderLoop(() => {
    if (currentScene) { // Siempre buena idea chequear
      currentScene.render();
    }
  });

  // 6. Manejar Redimensionado de Ventana
  window.addEventListener('resize', handleWindowResize);

  console.log("Babylon.js (modularizado) inicializado y corriendo.");
};

const cleanupBabylon = () => {
  console.log("Limpiando recursos de Babylon.js (modularizado)...");
  window.removeEventListener('resize', handleWindowResize);
  if (babylonEngine) {
    babylonEngine.dispose(); // Esto también dispone la escena y sus contenidos
    babylonEngine = null;
    currentScene = null;
    playerCamera = null; // Limpiar referencias
    // mainModelInstance = null;
    console.log("Recursos de Babylon (modularizado) liberados.");
  }
};

const handleWindowResize = () => {
  if (babylonEngine) {
    babylonEngine.resize();
  }
};

// Ciclo de Vida de Vue
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
