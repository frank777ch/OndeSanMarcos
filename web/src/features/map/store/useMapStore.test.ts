import { useMapStore } from './useMapStore'

describe('useMapStore', () => {
  beforeEach(() => useMapStore.setState({ activeCategory: null, selectedPlaceId: null, selectionOrigin: null }))

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

    it('RF-11.13: elegir otro lugar reemplaza al anterior', () => {
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

  describe('ficha (HU-12)', () => {
    it('RF-12.3: un toque en el mapa guarda el origen «map»', () => {
      useMapStore.getState().selectPlace('3', 'map')
      expect(useMapStore.getState().selectedPlaceId).toBe('3')
      expect(useMapStore.getState().selectionOrigin).toBe('map')
    })

    it('RF-12.4: por defecto el origen es «other» (buscador, chat)', () => {
      useMapStore.getState().selectPlace('3')
      expect(useMapStore.getState().selectionOrigin).toBe('other')
    })

    it('RF-12.5: tocar otro lugar con la ficha abierta cambia la selección', () => {
      useMapStore.getState().selectPlace('8', 'map')
      useMapStore.getState().selectPlace('34', 'map')
      expect(useMapStore.getState().selectedPlaceId).toBe('34')
    })

    it('RF-12.6: clearSelection también borra el origen', () => {
      useMapStore.getState().selectPlace('3', 'map')
      useMapStore.getState().clearSelection()
      expect(useMapStore.getState().selectedPlaceId).toBeNull()
      expect(useMapStore.getState().selectionOrigin).toBeNull()
    })

    it('RF-12.8: activar un filtro que oculta el lugar cierra la ficha', () => {
      useMapStore.getState().selectPlace('8', 'map') // facultad
      useMapStore.getState().toggleCategory('puertas')
      expect(useMapStore.getState().activeCategory).toBe('puertas')
      expect(useMapStore.getState().selectedPlaceId).toBeNull()
    })

    it('RF-12.8: activar el filtro de la misma categoría conserva la ficha', () => {
      useMapStore.getState().selectPlace('8', 'map')
      useMapStore.getState().toggleCategory('facultades')
      expect(useMapStore.getState().selectedPlaceId).toBe('8')
    })

    it('RF-12.8: quitar el filtro conserva la ficha', () => {
      useMapStore.getState().toggleCategory('facultades')
      useMapStore.getState().selectPlace('8', 'map')
      useMapStore.getState().toggleCategory('facultades')
      expect(useMapStore.getState().activeCategory).toBeNull()
      expect(useMapStore.getState().selectedPlaceId).toBe('8')
    })
  })
})
