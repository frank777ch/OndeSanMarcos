// src/babylon/modelLoader.js
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js"; // Para la esfera de error

// Side effects para el cargador de GLTF y la pantalla de carga
import "@babylonjs/core/Loading/loadingScreen.js";
import "@babylonjs/loaders/glTF/2.0/glTFLoader.js";

export async function loadMainModel(scene) {
  try {
    console.log("Cargando modelo principal (crate.glb)...");
    const result = await SceneLoader.ImportMeshAsync(null, "/models/", "crate.glb", scene);

    if (result.meshes.length > 0) {
      const model = result.meshes[0];
      model.position.y = 1;
      model.scaling = new Vector3(0.5, 0.5, 0.5);
      model.checkCollisions = true; // Hacer que el modelo también sea sólido
      console.log("Modelo principal configurado:", model.name);
      return model; // Devolver la malla principal si se necesita
    } else {
      console.warn("El modelo crate.glb se cargó pero no contiene mallas.");
      return null;
    }
  } catch (e) {
    console.error("ERROR al cargar el modelo principal:", e);
    const errorSphere = MeshBuilder.CreateSphere("errorSphereFallback", { diameter: 1 }, scene);
    errorSphere.position.y = 1;
    console.log("Esfera de respaldo creada por error de carga.");
    return null; // Opcional: devolver la esfera de error o simplemente null
  }
}
