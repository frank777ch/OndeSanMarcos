import { describe, expect, it } from 'vitest'

// RF-28.6 y RF-28.15: la web no guarda su propia lista de lugares; la única fuente es la API.
const sources = import.meta.glob<string>('../**/*.{ts,tsx}', { eager: true, query: '?raw', import: 'default' })
const files = import.meta.glob('../**/*', { eager: false })

describe('sin copia local de los lugares (HU-28)', () => {
  it('RF-28.6: no existe data/places.ts', () => {
    expect(Object.keys(files).filter((f) => /features\/map\/data\/places\.tsx?$/.test(f))).toEqual([])
  })

  it('RF-28.6: ningún archivo importa data/places', () => {
    const offenders = Object.entries(sources)
      .filter(([file]) => !file.endsWith('noLocalPlaces.test.ts'))
      .filter(([, code]) => /from\s+['"][^'"]*data\/places['"]/.test(code))
      .map(([file]) => file)
    expect(offenders).toEqual([])
  })

  it('RF-28.6: nadie define PLACES ni PLACE_CATEGORIES como constante del código de la web', () => {
    const offenders = Object.entries(sources)
      .filter(([file]) => !file.includes('fixtures/') && !file.endsWith('noLocalPlaces.test.ts'))
      .filter(([, code]) => /export\s+const\s+(PLACES|PLACE_CATEGORIES)\b/.test(code))
      .map(([file]) => file)
    expect(offenders).toEqual([])
  })
})
