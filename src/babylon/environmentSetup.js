// src/babylon/environmentSetup.js
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";

// Side effect para que MeshBuilder funcione
import "@babylonjs/core/Meshes/meshBuilder.js";

export function createGroundAndWalls(scene) {
  console.log("Creando suelo y muros...");
  const groundSize = 100;
  const wallHeight = 10;
  const wallThickness = 1;

  // Suelo
  const ground = MeshBuilder.CreateGround("ground", { width: groundSize, height: groundSize }, scene);
  ground.checkCollisions = true; // El suelo es sólido

  // Helper para crear muros
  const createWall = (name, position, size) => {
    const wall = MeshBuilder.CreateBox(name, size, scene);
    wall.position = position;
    wall.position.y = wallHeight / 2;
    wall.checkCollisions = true;
    wall.isVisible = false; // Muros invisibles
  };

  // Muros
  createWall("wallN", new Vector3(0, 0, groundSize / 2), { width: groundSize, height: wallHeight, depth: wallThickness });
  createWall("wallS", new Vector3(0, 0, -groundSize / 2), { width: groundSize, height: wallHeight, depth: wallThickness });
  createWall("wallE", new Vector3(groundSize / 2, 0, 0), { width: wallThickness, height: wallHeight, depth: groundSize });
  createWall("wallW", new Vector3(-groundSize / 2, 0, 0), { width: wallThickness, height: wallHeight, depth: groundSize });

  console.log("Suelo y muros creados.");
  // No necesitamos devolver nada por ahora, a menos que necesitemos una referencia al ground.
}
