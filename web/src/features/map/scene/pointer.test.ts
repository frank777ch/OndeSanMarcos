import { hitsRoute, isCoarsePointer, setCursor } from './pointer'

describe('pointer', () => {
  it('RF-40.12: la ruta tiene prioridad si está entre los objetos tocados', () => {
    expect(hitsRoute([{ object: { userData: {} } }, { object: { userData: { routeHit: true } } }])).toBe(true)
    expect(hitsRoute([{ object: { userData: {} } }])).toBe(false)
    expect(hitsRoute([])).toBe(false)
  })

  it('setCursor cambia el cursor del lienzo', () => {
    const el = document.createElement('canvas')
    setCursor(el, 'pointer')
    expect(el.style.cursor).toBe('pointer')
    setCursor(el, '')
    expect(el.style.cursor).toBe('')
  })

  it('isCoarsePointer es falso en jsdom (sin matchMedia)', () => {
    expect(isCoarsePointer()).toBe(false)
  })
})
