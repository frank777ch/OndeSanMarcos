import geojsonData from "./rutas-caminos-completo.json";

export type Coord = [number, number]; // [longitude, latitude]

interface Node {
  id: string;
  coord: Coord;
}

interface Edge {
  to: string;
  weight: number;
}

// Funciones auxiliares matemáticas
export function haversineDistance(c1: Coord, c2: Coord): number {
  const R = 6371e3; // radio de la tierra en metros
  const lat1 = (c1[1] * Math.PI) / 180;
  const lat2 = (c2[1] * Math.PI) / 180;
  const deltaLat = ((c2[1] - c1[1]) * Math.PI) / 180;
  const deltaLng = ((c2[0] - c1[0]) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // en metros
}

// Construcción del Grafo
class Pathfinder {
  private nodes = new Map<string, Node>();
  private adjacencyList = new Map<string, Edge[]>();

  constructor(geojson: any) {
    this.buildGraph(geojson);
  }

  private buildGraph(geojson: any) {
    const features = geojson.features || [];

    features.forEach((feature: any) => {
      if (feature.geometry && feature.geometry.type === "LineString") {
        const coords: Coord[] = feature.geometry.coordinates;
        this.processLineString(coords);
      } else if (
        feature.geometry &&
        feature.geometry.type === "MultiLineString"
      ) {
        const lines: Coord[][] = feature.geometry.coordinates;
        lines.forEach((line) => this.processLineString(line));
      }
    });
  }

  private processLineString(coords: Coord[]) {
    let prevNodeId: string | null = null;

    for (let i = 0; i < coords.length; i++) {
      const coord = coords[i];
      const nodeId = this.getOrAddNode(coord);

      if (prevNodeId !== null && prevNodeId !== nodeId) {
        // Añadir arista bidireccional
        const weight = haversineDistance(
          this.nodes.get(prevNodeId)!.coord,
          this.nodes.get(nodeId)!.coord,
        );
        this.addEdge(prevNodeId, nodeId, weight);
        this.addEdge(nodeId, prevNodeId, weight);
      }

      prevNodeId = nodeId;
    }
  }

  private getOrAddNode(coord: Coord): string {
    // 1. Buscar si hay algún nodo muy cerca (<= 5 metros) para "unir" intersecciones
    for (const [id, node] of this.nodes.entries()) {
      const dist = haversineDistance(node.coord, coord);
      if (dist <= 5) {
        // Tolerancia de 5 metros
        return id;
      }
    }

    // 2. Si no hay nodo cercano, creamos uno nuevo
    const newId = `${coord[0]},${coord[1]}`;
    this.nodes.set(newId, { id: newId, coord });
    this.adjacencyList.set(newId, []);
    return newId;
  }

  private addEdge(from: string, to: string, weight: number) {
    const edges = this.adjacencyList.get(from)!;
    // Evitar duplicados
    if (!edges.some((e) => e.to === to)) {
      edges.push({ to, weight });
    }
  }

  // Encontrar el nodo más cercano a un punto arbitrario
  public getClosestNode(point: Coord): string | null {
    let closestId: string | null = null;
    let minDistance = Infinity;

    for (const [id, node] of this.nodes.entries()) {
      const dist = haversineDistance(point, node.coord);
      if (dist < minDistance) {
        minDistance = dist;
        closestId = id;
      }
    }

    return closestId;
  }

  // Algoritmo de Dijkstra
  public findShortestPath(startPoint: Coord, endPoint: Coord): Coord[] {
    const startNodeId = this.getClosestNode(startPoint);
    const endNodeId = this.getClosestNode(endPoint);

    if (!startNodeId || !endNodeId) {
      console.warn("No se encontraron nodos cercanos");
      return [];
    }

    const distances = new Map<string, number>();
    const previous = new Map<string, string>();
    const unvisited = new Set<string>();

    for (const id of this.nodes.keys()) {
      distances.set(id, Infinity);
      unvisited.add(id);
    }
    distances.set(startNodeId, 0);

    while (unvisited.size > 0) {
      // Obtener el nodo no visitado con menor distancia (optimizable con PriorityQueue, pero para ~400 nodos un array es super rápido)
      let currentId: string | null = null;
      let minDistance = Infinity;

      for (const id of unvisited) {
        const d = distances.get(id)!;
        if (d < minDistance) {
          minDistance = d;
          currentId = id;
        }
      }

      if (currentId === null || minDistance === Infinity) {
        break; // Todos los nodos restantes son inalcanzables
      }

      if (currentId === endNodeId) {
        break; // Llegamos al destino
      }

      unvisited.delete(currentId);

      const neighbors = this.adjacencyList.get(currentId) || [];
      for (const neighbor of neighbors) {
        if (!unvisited.has(neighbor.to)) continue;

        const newDist = distances.get(currentId)! + neighbor.weight;
        if (newDist < distances.get(neighbor.to)!) {
          distances.set(neighbor.to, newDist);
          previous.set(neighbor.to, currentId);
        }
      }
    }

    // Reconstruir camino
    const pathIds: string[] = [];
    let current: string | undefined = endNodeId;

    while (current) {
      pathIds.unshift(current);
      if (current === startNodeId) break;
      current = previous.get(current);
    }

    if (pathIds[0] !== startNodeId) {
      // No hay camino válido
      console.warn("No hay ruta directa");
      // Fallback: trazamos una línea recta directa
      return [startPoint, endPoint];
    }

    const pathCoords = pathIds.map((id) => this.nodes.get(id)!.coord);

    // Para mayor precisión visual, añadimos el punto exacto de inicio y fin si está muy lejos
    if (haversineDistance(startPoint, pathCoords[0]) > 2) {
      pathCoords.unshift(startPoint);
    }
    if (haversineDistance(endPoint, pathCoords[pathCoords.length - 1]) > 2) {
      pathCoords.push(endPoint);
    }

    return pathCoords;
  }
}

// Inicializar la instancia única del Pathfinder
export const campusPathfinder = new Pathfinder(geojsonData);
