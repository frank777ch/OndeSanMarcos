// src/babylon/environmentSetup.js

import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js"; // Para dar color al suelo
import { Color3 } from "@babylonjs/core/Maths/math.color.js";         // Para los colores del material

// Importar el side effect para que MeshBuilder funcione correctamente.
// Esto registra los métodos CreateGround, CreateBox, etc., con el motor.
import "@babylonjs/core/Meshes/meshBuilder.js";

/**
 * Crea el suelo y los muros invisibles para delimitar el área de juego.
 * @param {Scene} scene La instancia de la escena de Babylon.js donde se crearán los objetos.
 */
export function createGroundAndWalls(scene) {
  console.log("environmentSetup.js: Creando suelo y muros...");

  // --- Dimensiones del Entorno ---
  const groundSize = 100;   // Ancho y largo del suelo
  const wallHeight = 20;    // Altura de los muros invisibles (suficiente para que el jugador no salte por encima)
  const wallThickness = 2;  // Grosor de los muros (no muy importante si son invisibles, pero deben tener volumen)

  // --- Crear el Suelo ---
  const ground = MeshBuilder.CreateGround(
    "mainGround", // Nombre para el suelo
    { width: groundSize, height: groundSize, subdivisions: 4 }, // Opcional: subdivisiones para mejor iluminación o texturizado
    scene
  );
  ground.checkCollisions = true; // ¡Muy importante! El suelo debe ser sólido.

  // Asignar un material al suelo para hacerlo visible y darle color
  const groundMaterial = new StandardMaterial("groundMaterial", scene);
  groundMaterial.diffuseColor = new Color3(0.6, 0.6, 0.6); // Un color gris medio
  // groundMaterial.specularColor = new Color3(0, 0, 0); // Opcional: quitar reflejos especulares para un look más mate
  ground.material = groundMaterial;
  console.log("environmentSetup.js: Suelo creado con material.");

  // --- Crear Muros Invisibles ---
  // Helper para reducir la repetición al crear muros
  const createInvisibleWall = (name, position, size) => {
    const wall = MeshBuilder.CreateBox(name, size, scene);
    wall.position = position;
    // Los muros ya se posicionan verticalmente con position.y en la llamada
    wall.checkCollisions = true; // Los muros también deben ser sólidos
    wall.isVisible = false;      // Hacerlos invisibles
    return wall;
  };

  // Posiciones y tamaños de los muros
  // Muro Norte (+Z)
  createInvisibleWall(
    "wallNorth",
    new Vector3(0, wallHeight / 2, groundSize / 2 + wallThickness / 2),
    { width: groundSize + (wallThickness * 2), height: wallHeight, depth: wallThickness } // Un poco más ancho para cubrir esquinas
  );
  // Muro Sur (-Z)
  createInvisibleWall(
    "wallSouth",
    new Vector3(0, wallHeight / 2, -groundSize / 2 - wallThickness / 2),
    { width: groundSize + (wallThickness * 2), height: wallHeight, depth: wallThickness }
  );
  // Muro Este (+X)
  createInvisibleWall(
    "wallEast",
    new Vector3(groundSize / 2 + wallThickness / 2, wallHeight / 2, 0),
    { width: wallThickness, height: wallHeight, depth: groundSize } // No necesita ser más profundo
  );
  // Muro Oeste (-X)
  createInvisibleWall(
    "wallWest",
    new Vector3(-groundSize / 2 - wallThickness / 2, wallHeight / 2, 0),
    { width: wallThickness, height: wallHeight, depth: groundSize }
  );

  console.log("environmentSetup.js: Muros invisibles creados.");

  // No es estrictamente necesario devolver nada aquí, a menos que necesites
  // una referencia específica al suelo o a los muros más adelante.
  // Por ahora, se crean y configuran dentro de la escena.
}
