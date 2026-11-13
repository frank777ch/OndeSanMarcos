import { resetPlaces, seedPlaces, idOf, catId } from '@/test/fixtures/places'
import { useMapStore } from './useMapStore'

describe('useMapStore', () => {
  beforeEach(() => {
    seedPlaces()
    useMapStore.setState({ activeCategory: null, selectedPlaceId: null, selectionOrigin: null })
  })

  it('RF-10.3: al inicio no hay categoría activa', () => {
    expect(useMapStore.getState().activeCategory).toBeNull()
  })

  it('RF-10.6: toggleCategory activa una categoría', () => {
    useMapStore.getState().toggleCategory(catId('cafeterias'))
    expect(useMapStore.getState().activeCategory).toBe(catId('cafeterias'))
  })

  it('RF-10.7: pulsar la categoría activa la desactiva', () => {
    useMapStore.getState().toggleCategory(catId('cafeterias'))
    useMapStore.getState().toggleCategory(catId('cafeterias'))
    expect(useMapStore.getState().activeCategory).toBeNull()
  })

  it('RF-10.8: activar otra categoría reemplaza a la anterior', () => {
    useMapStore.getState().toggleCategory(catId('cafeterias'))
    useMapStore.getState().toggleCategory(catId('puertas'))
    expect(useMapStore.getState().activeCategory).toBe(catId('puertas'))
  })

  it('RF-10.9: el estado vive en el store, no en un componente', () => {
    useMapStore.getState().toggleCategory(catId('auditorios'))
    // Un componente nuevo (p. ej. al volver de /asistente) lee el mismo valor.
    expect(useMapStore.getState().activeCategory).toBe(catId('auditorios'))
    expect(localStorage.length).toBe(0)
  })

  describe('selectPlace', () => {
    it('RF-11.13: guarda el lugar elegido', () => {
      useMapStore.getState().selectPlace(idOf('puerta-3'))
      expect(useMapStore.getState().selectedPlaceId).toBe(idOf('puerta-3'))
    })

    it('RF-11.15: quita el filtro si oculta el lugar (Puerta 3 con filtro Cafeterías)', () => {
      useMapStore.getState().toggleCategory(catId('cafeterias'))
      useMapStore.getState().selectPlace(idOf('puerta-3'))
      expect(useMapStore.getState().activeCategory).toBeNull()
      expect(useMapStore.getState().selectedPlaceId).toBe(idOf('puerta-3'))
    })

    it('RF-11.15: conserva el filtro si ya incluye el lugar (Puerta 3 con filtro Puertas)', () => {
      useMapStore.getState().toggleCategory(catId('puertas'))
      useMapStore.getState().selectPlace(idOf('puerta-3'))
      expect(useMapStore.getState().activeCategory).toBe(catId('puertas'))
    })

    it('RF-11.13: ignora un id que no existe', () => {
      useMapStore.getState().toggleCategory(catId('puertas'))
      useMapStore.getState().selectPlace(999999)
      expect(useMapStore.getState().selectedPlaceId).toBeNull()
      expect(useMapStore.getState().activeCategory).toBe(catId('puertas'))
    })

    it('RF-11.13: elegir otro lugar reemplaza al anterior', () => {
      useMapStore.getState().selectPlace(idOf('puerta-3'))
      useMapStore.getState().selectPlace(idOf('fisi'))
      expect(useMapStore.getState().selectedPlaceId).toBe(idOf('fisi'))
    })
  })

  it('RF-28.11: antes de cargar los lugares no se elige nada (todo id se ignora)', () => {
    resetPlaces()
    useMapStore.getState().selectPlace(idOf('fisi'))
    expect(useMapStore.getState().selectedPlaceId).toBeNull()
  })

  it('RF-28.11: se elige por el id numérico de la API; uno que no existe se ignora', () => {
    useMapStore.getState().selectPlace(999999)
    expect(useMapStore.getState().selectedPlaceId).toBeNull()
    useMapStore.getState().selectPlace(idOf('fisi'))
    expect(useMapStore.getState().selectedPlaceId).toBe(idOf('fisi'))
  })

  it('RF-11.16: clearSelection quita la selección', () => {
    useMapStore.getState().selectPlace(idOf('puerta-3'))
    useMapStore.getState().clearSelection()
    expect(useMapStore.getState().selectedPlaceId).toBeNull()
  })

  describe('ficha (HU-12)', () => {
    it('RF-12.3: un toque en el mapa guarda el origen «map»', () => {
      useMapStore.getState().selectPlace(idOf('puerta-3'), 'map')
      expect(useMapStore.getState().selectedPlaceId).toBe(idOf('puerta-3'))
      expect(useMapStore.getState().selectionOrigin).toBe('map')
    })

    it('RF-12.4: por defecto el origen es «other» (buscador, chat)', () => {
      useMapStore.getState().selectPlace(idOf('puerta-3'))
      expect(useMapStore.getState().selectionOrigin).toBe('other')
    })

    it('RF-12.5: tocar otro lugar con la ficha abierta cambia la selección', () => {
      useMapStore.getState().selectPlace(idOf('fisi'), 'map')
      useMapStore.getState().selectPlace(idOf('cafeteria-de-la-facultad-de-odontologia'), 'map')
      expect(useMapStore.getState().selectedPlaceId).toBe(idOf('cafeteria-de-la-facultad-de-odontologia'))
    })

    it('RF-12.6: clearSelection también borra el origen', () => {
      useMapStore.getState().selectPlace(idOf('puerta-3'), 'map')
      useMapStore.getState().clearSelection()
      expect(useMapStore.getState().selectedPlaceId).toBeNull()
      expect(useMapStore.getState().selectionOrigin).toBeNull()
    })

    it('RF-12.8: activar un filtro que oculta el lugar cierra la ficha', () => {
      useMapStore.getState().selectPlace(idOf('fisi'), 'map') // facultad
      useMapStore.getState().toggleCategory(catId('puertas'))
      expect(useMapStore.getState().activeCategory).toBe(catId('puertas'))
      expect(useMapStore.getState().selectedPlaceId).toBeNull()
    })

    it('RF-12.8: activar el filtro de la misma categoría conserva la ficha', () => {
      useMapStore.getState().selectPlace(idOf('fisi'), 'map')
      useMapStore.getState().toggleCategory(catId('facultades'))
      expect(useMapStore.getState().selectedPlaceId).toBe(idOf('fisi'))
    })

    it('RF-12.8: quitar el filtro conserva la ficha', () => {
      useMapStore.getState().toggleCategory(catId('facultades'))
      useMapStore.getState().selectPlace(idOf('fisi'), 'map')
      useMapStore.getState().toggleCategory(catId('facultades'))
      expect(useMapStore.getState().activeCategory).toBeNull()
      expect(useMapStore.getState().selectedPlaceId).toBe(idOf('fisi'))
    })
  })
})
