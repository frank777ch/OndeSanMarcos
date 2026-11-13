import { sidebarWidth, viewPadding } from './viewPadding'

describe('viewPadding', () => {
  it('suma el ancho de la barra lateral al relleno izquierdo', () => {
    const el = document.createElement('div')
    el.style.setProperty('--sidebar-w', '200px')
    document.body.append(el)
    expect(sidebarWidth(el)).toBe(200)
    expect(viewPadding(el).left).toBe(viewPadding(null).left + 200)
    el.remove()
  })

  it('sin barra (móvil) el relleno izquierdo es el mínimo', () => {
    expect(sidebarWidth(document.createElement('div'))).toBe(0)
  })
})
