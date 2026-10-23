import { useMapStore } from './useMapStore'

describe('useMapStore', () => {
  beforeEach(() => useMapStore.setState({ activeCategory: null }))

  it('RF-10.3: al inicio no hay categoría activa', () => {
    expect(useMapStore.getState().activeCategory).toBeNull()
  })

  it('RF-10.6: toggleCategory activa una categoría', () => {
    useMapStore.getState().toggleCategory('cafeterias')
    expect(useMapStore.getState().activeCategory).toBe('cafeterias')
  })

  it('RF-10.7: pulsar la categoría activa la desactiva', () => {
    useMapStore.getState().toggleCategory('cafeterias')
    useMapStore.getState().toggleCategory('cafeterias')
    expect(useMapStore.getState().activeCategory).toBeNull()
  })

  it('RF-10.8: activar otra categoría reemplaza a la anterior', () => {
    useMapStore.getState().toggleCategory('cafeterias')
    useMapStore.getState().toggleCategory('puertas')
    expect(useMapStore.getState().activeCategory).toBe('puertas')
  })

  it('RF-10.9: el estado vive en el store, no en un componente', () => {
    useMapStore.getState().toggleCategory('auditorios')
    // Un componente nuevo (p. ej. al volver de /asistente) lee el mismo valor.
    expect(useMapStore.getState().activeCategory).toBe('auditorios')
    expect(localStorage.length).toBe(0)
  })
})
