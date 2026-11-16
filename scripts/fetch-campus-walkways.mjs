#!/usr/bin/env node
// Descarga de OpenStreetMap (Overpass) todas las vías (`highway=*`) DENTRO de la Ciudad Universitaria y las guarda en
// web/src/features/routing/data/osm-walkways.json. Con ese archivo se dibujan los caminos del mapa y se calculan las rutas.
// Datos © colaboradores de OpenStreetMap, licencia ODbL.
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RELATION_ID = 6252388 // Ciudad Universitaria de la UNMSM
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../web/src/features/routing/data/osm-walkways.json')
const ENDPOINTS = ['https://overpass.kumi.systems/api/interpreter', 'https://overpass-api.de/api/interpreter']

const query = `[out:json][timeout:120];
area(id:${3600000000 + RELATION_ID})->.a;
way["highway"](area.a);
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
const data = await overpass()

const ways = data.elements
  .filter((el) => el.type === 'way' && el.geometry?.length > 1)
  .map((el) => {
    const t = el.tags ?? {}
    return {
      id: el.id,
      highway: t.highway,
      ...(t.footway ? { footway: t.footway } : {}),
      ...(t.access ? { access: t.access } : {}),
      ...(t.name ? { name: t.name } : {}),
      line: el.geometry.map((g) => [round6(g.lon), round6(g.lat)]),
    }
  })

writeFileSync(
  OUT,
  JSON.stringify({ source: 'OpenStreetMap (Overpass)', license: 'ODbL', fetchedAt: new Date().toISOString().slice(0, 10), ways }),
)
const count = {}
for (const w of ways) count[w.highway] = (count[w.highway] ?? 0) + 1
console.log(`${ways.length} vías dentro del campus:`, count)
