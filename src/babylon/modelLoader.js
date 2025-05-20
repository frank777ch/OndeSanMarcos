// src/babylon/modelLoader.js
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js"; // Para la esfera de error

// Importar los side effects necesarios para el cargador de GLTF y la pantalla de carga
import "@babylonjs/core/Loading/loadingScreen.js";
import "@babylonjs/loaders/glTF/2.0/glTFLoader.js";

// --- Función para cargar el Personaje (prueba1.glb) ---
export async function loadCharacter(scene) {
  try {
    console.log("modelLoader.js: Cargando modelo de personaje (prueba1.glb)...");
    const result = await SceneLoader.ImportMeshAsync(
      null,           // Cargar todas las mallas del archivo
      "/models/",     // Ruta a la carpeta de modelos en 'public/'
      "prueba1.glb",  // Nombre del archivo del personaje
      scene           // Escena donde se cargará
    );

    if (result.meshes.length > 0) {
      const characterMesh = result.meshes[0]; // Asumimos que la primera malla es el nodo raíz del personaje
      characterMesh.name = "playerCharacter"; // Nombre para identificarlo fácilmente

      // --- Ajustes del Personaje (¡EXPERIMENTA CON ESTOS VALORES!) ---
      characterMesh.position = new Vector3(0, 0, -5); // Posición inicial (X, Y, Z)
                                                      // Ajusta Y para que los pies estén en el suelo (ej. 0 si el pivote está en los pies)
      characterMesh.scaling = new Vector3(1, 1, 1);   // Escala (1,1,1) es tamaño original. Ej: (0.5,0.5,0.5) para la mitad.

      // Colisiones del personaje
      characterMesh.checkCollisions = true;
      // Elipsoide de colisión: (radioX, alturaMedia, radioZ) - Define la "hitbox"
      characterMesh.ellipsoid = new Vector3(0.5, 0.9, 0.5);
      // Desplazamiento del elipsoide si el pivote del modelo no está en la base de los pies.
      // Si el pivote está en el centro del personaje, y su altura es ~1.8, el offset Y sería 0.9.
      characterMesh.ellipsoidOffset = new Vector3(0, 0.9, 0);

      console.log("modelLoader.js: Personaje cargado:", characterMesh.name);
      console.log("modelLoader.js: Animaciones del personaje encontradas:", result.animationGroups.map(ag => ag.name));

      // Devolver la malla principal y los grupos de animación
      return {
        mesh: characterMesh,
        animationGroups: result.animationGroups
      };
    } else {
      console.warn("modelLoader.js: El modelo prueba1.glb se cargó pero no contiene mallas.");
      return null;
    }
  } catch (e) {
    console.error("modelLoader.js: ERROR al cargar el modelo de personaje (prueba1.glb):", e);
    // Opcional: Crear un objeto de respaldo si falla la carga
    const errorSphere = MeshBuilder.CreateSphere("errorCharacterFallback", { diameter: 1 }, scene);
    errorSphere.position = new Vector3(0, 1, -5); // Posición similar a la del personaje
    console.log("modelLoader.js: Esfera de respaldo para personaje creada.");
    return null; // Indicar que la carga falló
  }
}

// --- Función para cargar la Caja (crate.glb) ---
export async function loadCrate(scene) {
  try {
    console.log("modelLoader.js: Cargando modelo de caja (crate.glb)...");
    const result = await SceneLoader.ImportMeshAsync(
      null,
      "/models/",
      "crate.glb", // Nombre del archivo de la caja
      scene
    );

    if (result.meshes.length > 0) {
      const crateMesh = result.meshes[0];
      crateMesh.name = "crateObject";

      // --- Ajustes de la Caja ---
      crateMesh.position = new Vector3(5, 0.5, 5); // Posición diferente para la caja
                                                   // (Y=0.5 si la caja tiene altura 1 y su pivote está en la base)
      crateMesh.scaling = new Vector3(1, 1, 1); // Ajusta la escala si quieres que sea más pequeña/grande que el original

      crateMesh.checkCollisions = true; // La caja también será un objeto sólido

      console.log("modelLoader.js: Caja cargada:", crateMesh.name);
      return crateMesh; // Solo devolvemos la malla principal aquí
    } else {
      console.warn("modelLoader.js: El modelo crate.glb se cargó pero no contiene mallas.");
      return null;
    }
  } catch (e) {
    console.error("modelLoader.js: ERROR al cargar el modelo de caja (crate.glb):", e);
    const errorCube = MeshBuilder.CreateBox("errorCrateFallback", { size: 1 }, scene);
    errorCube.position = new Vector3(5, 0.5, 5);
    console.log("modelLoader.js: Cubo de respaldo para caja creado.");
    return null;
  }
}
