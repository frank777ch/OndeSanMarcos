#!/usr/bin/env node
// Descarga de OpenStreetMap (Overpass) el contorno, los edificios y las áreas verdes de la Ciudad Universitaria
// y los guarda en web/src/features/map/data/campus-osm.json (HU-40). Se ejecuta a mano; el resultado se commitea.
// Datos © colaboradores de OpenStreetMap, licencia ODbL.
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RELATION_ID = 6252388 // Ciudad Universitaria de la UNMSM (amenity=university)
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../web/src/features/map/data/campus-osm.json')
const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']
/** Las avenidas y calles que rodean al campus se conservan hasta esta distancia (m) del contorno. */
const ROAD_REACH = 160
const ROAD_INSIDE = 12
const ROAD_KINDS = 'motorway|trunk|primary|secondary|tertiary|residential|unclassified|living_street'
const DEFAULT_HEIGHT = 9
const METERS_PER_LEVEL = 3

/** Caja (sur,oeste,norte,este) = contorno del campus + ~240 m, para pedir las vías. */
const ROAD_BOX = '-12.0634,-77.0906,-12.0496,-77.0770'

const query = `[out:json][timeout:120];
area(id:${3600000000 + RELATION_ID})->.a;
rel(${RELATION_ID});
out geom;
(
  way["building"](area.a);
  rel["building"](area.a);
);
out geom tags;
(
  way["leisure"~"^(pitch|park|garden|playground|track|stadium)$"](area.a);
  way["landuse"~"^(grass|recreation_ground|meadow|village_green)$"](area.a);
  way["natural"~"^(grassland|scrub|wood|water)$"](area.a);
  way["water"](area.a);
  rel["leisure"~"^(pitch|park|garden)$"](area.a);
  rel["landuse"~"^(grass|recreation_ground|meadow)$"](area.a);
);
out geom tags;
(
  way["highway"~"^(${ROAD_KINDS})$"](${ROAD_BOX});
);
out geom tags;`

async function overpass() {
  for (let round = 0; round < 3; round++) {
    for (const url of ENDPOINTS) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'User-Agent': 'campus-map-fetch/1.0', 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ data: query }),
        })
        if (res.ok) return await res.json()
        console.error(`${url}: ${res.status}`)
      } catch (e) {
        console.error(`${url}: ${e.message}`)
      }
    }
    await new Promise((r) => setTimeout(r, 5000 * (round + 1)))
  }
  throw new Error('Overpass no respondió')
}

const round6 = (n) => Math.round(n * 1e6) / 1e6
const pt = (g) => [round6(g.lon), round6(g.lat)]
const same = (a, b) => a[0] === b[0] && a[1] === b[1]

/** Une tramos de líneas (extremo con extremo) en anillos cerrados. */
function stitch(segments) {
  const rings = []
  const pool = segments.filter((s) => s.length > 1).map((s) => [...s])
  while (pool.length) {
    let ring = pool.pop()
    let grew = true
    while (grew && !same(ring[0], ring[ring.length - 1])) {
      grew = false
      for (let i = 0; i < pool.length; i++) {
        const s = pool[i]
        const head = ring[0]
        const tail = ring[ring.length - 1]
        if (same(tail, s[0])) ring = ring.concat(s.slice(1))
        else if (same(tail, s[s.length - 1])) ring = ring.concat([...s].reverse().slice(1))
        else if (same(head, s[s.length - 1])) ring = s.concat(ring.slice(1))
        else if (same(head, s[0])) ring = [...s].reverse().concat(ring.slice(1))
        else continue
        pool.splice(i, 1)
        grew = true
        break
      }
    }
    if (same(ring[0], ring[ring.length - 1]) && ring.length >= 4) rings.push(ring)
  }
  return rings
}

const area = (ring) => {
  let a = 0
  for (let i = 0; i < ring.length - 1; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
  return a / 2
}

const inside = (p, ring) => {
  let c = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}

/** Elemento OSM → lista de polígonos `[anilloExterior, ...huecos]`. */
function polygons(el) {
  if (el.type === 'way') {
    const ring = (el.geometry ?? []).map(pt)
    if (ring.length < 4 || !same(ring[0], ring[ring.length - 1])) return []
    return [[ring]]
  }
  const members = (el.members ?? []).filter((m) => m.geometry)
  const outers = stitch(members.filter((m) => m.role !== 'inner').map((m) => m.geometry.map(pt)))
  const inners = stitch(members.filter((m) => m.role === 'inner').map((m) => m.geometry.map(pt)))
  return outers.map((outer) => [outer, ...inners.filter((h) => inside(h[0], outer))])
}

function heightOf(tags) {
  const h = parseFloat(String(tags.height ?? '').replace(',', '.'))
  if (h > 0) return { height: h, source: 'height' }
  const levels = parseFloat(tags['building:levels'])
  if (levels > 0) return { height: levels * METERS_PER_LEVEL, source: 'levels' }
  return { height: DEFAULT_HEIGHT, source: 'default' }
}

function greenKind(t) {
  if (t.leisure === 'pitch' || t.leisure === 'track' || t.leisure === 'stadium') return 'pitch'
  if (t.leisure === 'park' || t.leisure === 'garden' || t.leisure === 'playground') return 'park'
  if (t.natural === 'water' || t.water) return 'water'
  return 'grass'
}

/** Metros por grado en lng/lat (equirectangular; basta para ~1 km). */
const M_LAT = 111320
const M_LNG = M_LAT * Math.cos((-12.056 * Math.PI) / 180)

/** Distancia (m) de un punto al contorno del campus; negativa si está dentro. */
function distToBoundary(p, rings) {
  const within = rings.some((r) => inside(p, r))
  let best = Infinity
  for (const ring of rings) {
    for (let i = 0; i < ring.length - 1; i++) {
      const ax = (ring[i][0] - p[0]) * M_LNG
      const ay = (ring[i][1] - p[1]) * M_LAT
      const bx = (ring[i + 1][0] - p[0]) * M_LNG
      const by = (ring[i + 1][1] - p[1]) * M_LAT
      const dx = bx - ax
      const dy = by - ay
      const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)))
      best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy))
    }
  }
  return within ? -best : best
}

/** Reparte los puntos de una vía cada ≤ `step` metros. */
function densify(line, step = 8) {
  const out = [line[0]]
  for (let i = 1; i < line.length; i++) {
    const [ax, ay] = line[i - 1]
    const [bx, by] = line[i]
    const n = Math.ceil(Math.hypot((bx - ax) * M_LNG, (by - ay) * M_LAT) / step)
    for (let k = 1; k <= n; k++) out.push([round6(ax + ((bx - ax) * k) / n), round6(ay + ((by - ay) * k) / n)])
  }
  return out
}

/** Tramos de la vía que quedan fuera del campus o en su borde (hasta ROAD_INSIDE m adentro) y a ≤ ROAD_REACH m. Dentro del campus se dibujan sus propios caminos. */
function clipToReach(line, rings) {
  const runs = []
  let run = []
  for (const p of densify(line)) {
    const d = distToBoundary(p, rings)
    if (d <= ROAD_REACH && d >= -ROAD_INSIDE) run.push(p)
    else {
      if (run.length > 1) runs.push(run)
      run = []
    }
  }
  if (run.length > 1) runs.push(run)
  return runs
}

const data = await overpass()
const boundary = []
const buildings = []
const green = []
const rawRoads = []
const stats = { height: 0, levels: 0, default: 0 }

for (const el of data.elements) {
  const tags = el.tags ?? {}
  if (el.type === 'relation' && el.id === RELATION_ID) {
    boundary.push(...polygons(el))
  } else if (tags.highway && el.type === 'way') {
    rawRoads.push({ kind: tags.highway, line: (el.geometry ?? []).map(pt) })
  } else if (tags.building) {
    const { height, source } = heightOf(tags)
    for (const footprint of polygons(el)) {
      buildings.push({ footprint, height, ...(tags.name ? { name: tags.name } : {}) })
      stats[source]++
    }
  } else {
    for (const polygon of polygons(el)) green.push({ polygon, kind: greenKind(tags) })
  }
}

if (!boundary.length) throw new Error('No se obtuvo el contorno del campus')
boundary.sort((a, b) => Math.abs(area(b[0])) - Math.abs(area(a[0])))

const outer = boundary.map((p) => p[0])
const roads = rawRoads.flatMap(({ kind, line }) =>
  line.length > 1 ? clipToReach(line, outer).map((l) => ({ kind, line: l })) : [],
)

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(
  OUT,
  JSON.stringify({
    source: 'OpenStreetMap (Overpass)',
    license: 'ODbL',
    fetchedAt: new Date().toISOString().slice(0, 10),
    relation: RELATION_ID,
    boundary,
    buildings,
    green,
    roads,
  }),
)
console.log(
  `contorno: ${boundary.length} polígono(s) · edificios: ${buildings.length} ` +
    `(altura propia ${stats.height}, por pisos ${stats.levels}, por defecto ${stats.default}) · verde: ${green.length} · vías: ${roads.length} tramos`,
)
