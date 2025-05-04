<script setup>
import { ref, onMounted, onUnmounted } from 'vue'; 
import { Engine } from "@babylonjs/core/Engines/engine.js";
import { Scene } from "@babylonjs/core/scene.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight.js";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera.js";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";

import "@babylonjs/core/Loading/loadingScreen.js";
import "@babylonjs/loaders/glTF/2.0/glTFLoader.js";
import "@babylonjs/core/Helpers/sceneHelpers.js";
import "@babylonjs/core/Meshes/meshBuilder.js";

const canvasElement = ref(null);

let babylonEngine = null;
let babylonScene = null;

const initializeBabylon = async () => {
  if (canvasElement.value) {
    babylonEngine = new Engine(canvasElement.value, true);

    babylonScene = new Scene(babylonEngine);

    const camera = new ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 2.5,
      10,                  
      Vector3.Zero(),
      babylonScene
    );
    camera.attachControl(canvasElement.value, true);

    const light = new HemisphericLight(
      "hemiLight",
      new Vector3(0, 1, 0),
      babylonScene
    );
    light.intensity = 0.8;

    const ground = MeshBuilder.CreateGround("ground", {width: 10, height: 10}, babylonScene);

    try {
      console.log("Cargando modelo 3D...");
     
      const result = await SceneLoader.ImportMeshAsync(null, "/models/", "crate.glb", babylonScene);
      console.log("¡Modelo cargado! Número de mallas:", result.meshes.length);

      if (result.meshes.length > 0) {
        const model = result.meshes[0];
        model.position.y = 1;
        model.scaling = new Vector3(0.5, 0.5, 0.5);
        console.log("Modelo escalado y posicionado.");
      }
    } catch (e) {
      console.error("ERROR al cargar el modelo:", e);
      const errorSphere = MeshBuilder.CreateSphere("errorSphere", {diameter: 1}, babylonScene);
      errorSphere.position.y = 1;
    }

    babylonEngine.runRenderLoop(() => {
      if (babylonScene) {
        babylonScene.render(); 
      }
    });

    window.addEventListener('resize', handleWindowResize);

    console.log("Babylon.js inicializado correctamente.");

  } else {
    console.error("Error: El elemento canvas no está disponible al inicializar Babylon.");
  }
};

const cleanupBabylon = () => {
  console.log("Limpiando recursos de Babylon.js...");
  window.removeEventListener('resize', handleWindowResize);
  if (babylonEngine) {
    babylonEngine.dispose();
    babylonEngine = null;
    babylonScene = null;
    console.log("Recursos de Babylon liberados.");
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