<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Engine } from "@babylonjs/core/Engines/engine.js";
import { Scene } from "@babylonjs/core/scene.js";
import { Vector3, Vector2 } from "@babylonjs/core/Maths/math.vector.js"; // Añadido Vector2 para reset de cámara
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight.js";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera.js";

import "@babylonjs/core/Loading/loadingScreen.js";
import "@babylonjs/loaders/glTF/2.0/glTFLoader.js";
import "@babylonjs/core/Helpers/sceneHelpers.js";
import "@babylonjs/core/Meshes/meshBuilder.js";
import "@babylonjs/core/Collisions/collisionCoordinator.js";

const canvasElement = ref(null);

let babylonEngine = null;
let babylonScene = null;
let camera = null; // Guardamos referencia a la cámara para el reset de caída

const initializeBabylon = async () => {
  if (canvasElement.value) {
    babylonEngine = new Engine(canvasElement.value, true);
    babylonScene = new Scene(babylonEngine);

    camera = new FreeCamera(
      "camera",
      new Vector3(0, 1.7, -15),
      babylonScene
    );
    camera.setTarget(Vector3.Zero());

    camera.keysUp.push(87);
    camera.keysDown.push(83);
    camera.keysLeft.push(65);
    camera.keysRight.push(68);

    camera.speed = 0.5;
    camera.angularSensibility = 4000;

    camera.attachControl(canvasElement.value, true);

    const light = new HemisphericLight(
      "hemiLight",
      new Vector3(0, 1, 0),
      babylonScene
    );
    light.intensity = 0.8;

    const groundSize = 100;
    const ground = MeshBuilder.CreateGround("ground", {width: groundSize, height: groundSize}, babylonScene);
    ground.checkCollisions = true;

    const wallHeight = 10;
    const wallThickness = 1;

    const wallN = MeshBuilder.CreateBox("wallN", {width: groundSize, height: wallHeight, depth: wallThickness}, babylonScene);
    wallN.position.z = groundSize / 2;
    wallN.position.y = wallHeight / 2;
    wallN.checkCollisions = true;
    wallN.isVisible = false;

    const wallS = MeshBuilder.CreateBox("wallS", {width: groundSize, height: wallHeight, depth: wallThickness}, babylonScene);
    wallS.position.z = -groundSize / 2;
    wallS.position.y = wallHeight / 2;
    wallS.checkCollisions = true;
    wallS.isVisible = false;

    const wallE = MeshBuilder.CreateBox("wallE", {width: wallThickness, height: wallHeight, depth: groundSize}, babylonScene);
    wallE.position.x = groundSize / 2;
    wallE.position.y = wallHeight / 2;
    wallE.checkCollisions = true;
    wallE.isVisible = false;

    const wallW = MeshBuilder.CreateBox("wallW", {width: wallThickness, height: wallHeight, depth: groundSize}, babylonScene);
    wallW.position.x = -groundSize / 2;
    wallW.position.y = wallHeight / 2;
    wallW.checkCollisions = true;
    wallW.isVisible = false;

    babylonScene.collisionsEnabled = true;
    babylonScene.gravity = new Vector3(0, -0.9, 0);

    camera.ellipsoid = new Vector3(0.5, 0.9, 0.5);
    camera.checkCollisions = true;
    camera.applyGravity = true;

    try {
      const result = await SceneLoader.ImportMeshAsync(null, "/models/", "crate.glb", babylonScene);
      if (result.meshes.length > 0) {
        const model = result.meshes[0];
        model.position.y = 1;
        model.scaling = new Vector3(0.5, 0.5, 0.5);
        model.checkCollisions = true;
      }
    } catch (e) {
      console.error("ERROR al cargar el modelo:", e);
      const errorSphere = MeshBuilder.CreateSphere("errorSphere", {diameter: 1}, babylonScene);
      errorSphere.position.y = 1;
    }

    babylonEngine.runRenderLoop(() => {
      if (babylonScene && camera) { // Añadido chequeo de cámara por si acaso
        // --- Opcional: Reset si cae muy bajo (Alternativa a muros) ---
        // if (camera.position.y < -10) {
        //     camera.position = new Vector3(0, 1.7, -15);
        //     camera.cameraDirection = new Vector3(0, 0, 0);
        //     // camera.cameraRotation = new Vector2(0, 0); // Deprecated, no necesario normalmente
        // }
        // -----------------------------------------------------
        babylonScene.render();
      }
    });

    window.addEventListener('resize', handleWindowResize);
  } else {
    console.error("Error: El elemento canvas no está disponible al inicializar Babylon.");
  }
};

const cleanupBabylon = () => {
  window.removeEventListener('resize', handleWindowResize);
  if (babylonEngine) {
    babylonEngine.dispose();
    babylonEngine = null;
    babylonScene = null;
    camera = null; // Limpiar referencia
  }
};

const handleWindowResize = () => {
  if (babylonEngine) {
    babylonEngine.resize();
  }
};

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
