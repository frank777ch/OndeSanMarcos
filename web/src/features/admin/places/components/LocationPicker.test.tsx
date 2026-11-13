import { act, render, screen } from '@testing-library/react'
import { forwardRef, useImperativeHandle } from 'react'
import { CAMPUS_MAX_BOUNDS } from '@/features/map/constants/campus'

const easeTo = vi.fn()
// Los dobles guardan lo que reciben mediante funciones (no se modifican variables externas al renderizar).
const spy = vi.hoisted(() => {
  const state = { map: {} as Record<string, any>, marker: null as Record<string, any> | null, mounts: 0, source: null as any }
  return {
    state,
    setMap: (p: Record<string, any>) => void (state.map = p),
    setMarker: (p: Record<string, any>) => void (state.marker = p),
    setSource: (d: unknown) => void (state.source = d),
    mounted: () => void (state.mounts += 1),
  }
})

vi.mock('react-map-gl/mapbox', async () => {
  const React = await import('react')
  return {
    default: forwardRef(function FakeMap(props: Record<string, any>, ref) {
      spy.setMap(props)
      useImperativeHandle(ref, () => ({ easeTo }))
      return <div data-testid="map">{props.children}</div>
    }),
    AttributionControl: () => null,
    Layer: () => null,
    Source: (props: Record<string, any>) => {
      spy.setSource(props.data)
      return null
    },
    Marker: (props: Record<string, any>) => {
      spy.setMarker(props)
      React.useEffect(() => spy.mounted(), [])
      return <div data-testid="marker" />
    },
  }
})
vi.mock('mapbox-gl/dist/mapbox-gl.css', () => ({}))
const config = vi.hoisted(() => ({ mapbox: { token: 'pk.test', hasToken: true } }))
vi.mock('@/config', () => ({ Config: config }))

import { LocationPicker } from './LocationPicker'

const CONTEXT = [
  { id: 1, lat: -12.05, lng: -77.08 },
  { id: 2, lat: -12.06, lng: -77.081 },
]
const click = (lat: number, lng: number) => act(() => spy.state.map.onClick({ lngLat: { lat, lng } }))

beforeEach(() => {
  easeTo.mockReset()
  config.mapbox.hasToken = true
  spy.state.marker = null
  spy.state.mounts = 0
})

describe('LocationPicker', () => {
  it('RF-31.21: el mapa es 2D (sin inclinación ni rotación) y limitado al área permitida', () => {
    render(<LocationPicker lat={null} lng={null} onPick={() => {}} contextPlaces={[]} />)
    const p = spy.state.map
    expect(p.initialViewState).toMatchObject({ pitch: 0, bearing: 0 })
    expect(p).toMatchObject({ maxPitch: 0, minPitch: 0, dragRotate: false, pitchWithRotate: false, touchPitch: false })
    expect(p.maxBounds).toEqual(CAMPUS_MAX_BOUNDS)
    expect(p.mapStyle).toMatch(/^mapbox:\/\//)
  })

  it('RF-31.25: al crear muestra el campus completo y no hay marcador hasta el primer clic', () => {
    render(<LocationPicker lat={null} lng={null} onPick={() => {}} contextPlaces={[]} />)
    expect(spy.state.map.initialViewState.bounds).toBeDefined()
    expect(screen.queryByTestId('marker')).not.toBeInTheDocument()
  })

  it('RF-31.25: al editar parte de la posición actual con el marcador puesto', () => {
    render(<LocationPicker lat={-12.0535} lng={-77.0857} onPick={() => {}} contextPlaces={[]} />)
    expect(spy.state.map.initialViewState).toMatchObject({ latitude: -12.0535, longitude: -77.0857 })
    expect(screen.getByTestId('marker')).toBeInTheDocument()
    expect(spy.state.marker).toMatchObject({ latitude: -12.0535, longitude: -77.0857, draggable: true })
  })

  it('RF-31.22: un clic dentro del área llama a onPick con esas coordenadas', () => {
    const onPick = vi.fn()
    render(<LocationPicker lat={null} lng={null} onPick={onPick} contextPlaces={[]} />)
    click(-12.0565, -77.0827)
    expect(onPick).toHaveBeenCalledWith(-12.0565, -77.0827)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('RF-31.24: un clic fuera del área no se acepta y avisa; el siguiente clic válido borra el aviso', () => {
    const onPick = vi.fn()
    render(<LocationPicker lat={null} lng={null} onPick={onPick} contextPlaces={[]} />)
    click(-12.0, -77.0827)
    expect(onPick).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Ese punto está fuera del área del campus')
    click(-12.0565, -77.0827)
    expect(onPick).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('RF-31.22: arrastrar el marcador dentro del área lo acepta', () => {
    const onPick = vi.fn()
    render(<LocationPicker lat={-12.0535} lng={-77.0857} onPick={onPick} contextPlaces={[]} />)
    act(() => spy.state.marker!.onDragEnd({ lngLat: { lat: -12.056, lng: -77.083 } }))
    expect(onPick).toHaveBeenCalledWith(-12.056, -77.083)
  })

  it('RF-31.24: soltar el marcador fuera del área lo devuelve a su sitio (se remonta) y avisa', () => {
    const onPick = vi.fn()
    render(<LocationPicker lat={-12.0535} lng={-77.0857} onPick={onPick} contextPlaces={[]} />)
    const mountsBefore = spy.state.mounts
    act(() => spy.state.marker!.onDragEnd({ lngLat: { lat: -11, lng: -77 } }))
    expect(onPick).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(spy.state.mounts).toBe(mountsBefore + 1)
  })

  it('RF-31.23: al cambiar las coordenadas desde el formulario el mapa se centra en el marcador', () => {
    const { rerender } = render(<LocationPicker lat={-12.0535} lng={-77.0857} onPick={() => {}} contextPlaces={[]} />)
    easeTo.mockReset()
    rerender(<LocationPicker lat={-12.057} lng={-77.08} onPick={() => {}} contextPlaces={[]} />)
    expect(easeTo).toHaveBeenCalledWith(expect.objectContaining({ center: [-77.08, -12.057] }))
  })

  it('RF-31.22: un punto elegido con el clic no vuelve a centrar el mapa', () => {
    const onPick = vi.fn()
    const { rerender } = render(<LocationPicker lat={null} lng={null} onPick={onPick} contextPlaces={[]} />)
    click(-12.0565, -77.0827)
    easeTo.mockReset()
    rerender(<LocationPicker lat={-12.0565} lng={-77.0827} onPick={onPick} contextPlaces={[]} />)
    expect(easeTo).not.toHaveBeenCalled()
  })

  it('RF-31.26: los demás lugares son puntos de contexto y el lugar editado no se repite', () => {
    render(<LocationPicker lat={-12.05} lng={-77.08} onPick={() => {}} contextPlaces={CONTEXT} editingId={1} />)
    expect(spy.state.source.features.map((f: any) => f.properties.id)).toEqual([2])
  })

  it('RF-31.27: sin token muestra un aviso en lugar del mapa', () => {
    config.mapbox.hasToken = false
    render(<LocationPicker lat={null} lng={null} onPick={() => {}} contextPlaces={[]} />)
    expect(screen.queryByTestId('map')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/falta el token de Mapbox/)
  })

  it('RF-31.27: si el mapa falla al cargar, lo reemplaza un aviso', () => {
    render(<LocationPicker lat={null} lng={null} onPick={() => {}} contextPlaces={[]} />)
    act(() => spy.state.map.onError({}))
    expect(screen.queryByTestId('map')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/No se pudo cargar el mapa/)
  })
})
