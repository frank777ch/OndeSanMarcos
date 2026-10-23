import { useMapStore } from './useMapStore'

describe('useMapStore', () => {
  beforeEach(() => useMapStore.setState({ activeCategory: null, selectedPlaceId: null }))

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

  describe('selectPlace', () => {
    it('RF-11.13: guarda el lugar elegido', () => {
      useMapStore.getState().selectPlace('3')
      expect(useMapStore.getState().selectedPlaceId).toBe('3')
    })

    it('RF-11.15: quita el filtro si oculta el lugar (Puerta 3 con filtro Cafeterías)', () => {
      useMapStore.getState().toggleCategory('cafeterias')
      useMapStore.getState().selectPlace('3')
      expect(useMapStore.getState().activeCategory).toBeNull()
      expect(useMapStore.getState().selectedPlaceId).toBe('3')
    })

    it('RF-11.15: conserva el filtro si ya incluye el lugar (Puerta 3 con filtro Puertas)', () => {
      useMapStore.getState().toggleCategory('puertas')
      useMapStore.getState().selectPlace('3')
      expect(useMapStore.getState().activeCategory).toBe('puertas')
    })

    it('RF-11.13: ignora un id que no existe', () => {
      useMapStore.getState().toggleCategory('puertas')
      useMapStore.getState().selectPlace('no-existe')
      expect(useMapStore.getState().selectedPlaceId).toBeNull()
      expect(useMapStore.getState().activeCategory).toBe('puertas')
    })

    it('RF-11.14: elegir otro lugar reemplaza al anterior', () => {
      useMapStore.getState().selectPlace('3')
      useMapStore.getState().selectPlace('8')
      expect(useMapStore.getState().selectedPlaceId).toBe('8')
    })
  })

  it('RF-11.16: clearSelection quita la selección', () => {
    useMapStore.getState().selectPlace('3')
    useMapStore.getState().clearSelection()
    expect(useMapStore.getState().selectedPlaceId).toBeNull()
  })
})
