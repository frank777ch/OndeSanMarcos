import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PLACES, idOf, catId } from '@/test/fixtures/places'
import { useMapStore } from '../store/useMapStore'
import { RouteDialog } from '@/features/routing/components/RouteDialog'
import { useRouteStore } from '@/features/routing/store/useRouteStore'
import { PlaceCard } from './PlaceCard'
import { seedPlaces } from '@/test/fixtures/places'

const reset = () =>
  useMapStore.setState({ activeCategory: null, selectedPlaceId: null, selectionOrigin: null })
const open = (slug: string | number) =>
  act(() => useMapStore.getState().selectPlace(typeof slug === 'number' ? slug : idOf(slug), 'map'))

describe('PlaceCard', () => {
  beforeEach(() => {
    seedPlaces()
    reset()
  })

  it('no se muestra sin lugar elegido', () => {
    render(<PlaceCard />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('RF-12.9: siempre muestra nombre y categoría', () => {
    render(<PlaceCard />)
    open('puerta-3')
    const dialog = screen.getByRole('dialog', { name: 'Puerta 3' })
    expect(within(dialog).getByText('Puertas')).toBeInTheDocument()
  })

  it('RF-12.2 y RF-12.10: un lugar sin datos no muestra secciones', () => {
    render(<PlaceCard />)
    open('puerta-3') // Puerta 3
    for (const title of ['Horario', 'Acerca de este lugar', 'Contacto', 'Carreras', 'Servicios', 'Uso']) {
      expect(screen.queryByRole('heading', { name: title })).not.toBeInTheDocument()
    }
  })

  it('RF-12.10 y RF-12.12: la FISI muestra horario, descripción, contacto y carreras en lista', () => {
    render(<PlaceCard />)
    open('fisi')
    const fisi = PLACES.find((p) => p.slug === 'fisi')!
    expect(screen.getByRole('heading', { name: 'Horario' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Acerca de este lugar' })).toBeInTheDocument()
    expect(screen.getByText(`Teléfono: ${fisi.phone}`)).toBeInTheDocument()
    const section = screen.getByRole('heading', { name: 'Carreras' }).parentElement!
    expect(within(section).getAllByRole('listitem')).toHaveLength(fisi.careers!.length)
  })

  it('RF-12.10: sin teléfono no aparece la línea «Teléfono»', () => {
    render(<PlaceCard />)
    open('facultad-de-ingenieria-civil') // Ingeniería Civil: sin teléfono
    expect(screen.queryByText(/Teléfono:/)).not.toBeInTheDocument()
  })

  describe('campos nuevos de la base (HU-28)', () => {
    const rich = {
      id: 9001,
      slug: 'centro',
      name: 'Centro de cómputo',
      category: catId('servicios'),
      coordinates: [-77.08, -12.05] as [number, number],
      keywords: [],
      email: 'cec@unmsm.edu.pe',
      website: 'https://cec.unmsm.edu.pe/inicio',
      accessHint: 'Entrando por la Puerta 3, a la derecha.',
    }

    it('RF-28.10: muestra correo, página web y «Cómo encontrarlo» cuando existen', () => {
      seedPlaces([rich])
      render(<PlaceCard />)
      open(rich.id)
      expect(screen.getByRole('heading', { name: 'Cómo encontrarlo' })).toBeInTheDocument()
      expect(screen.getByText('Entrando por la Puerta 3, a la derecha.')).toBeInTheDocument()
      expect(screen.getByText('Correo: cec@unmsm.edu.pe')).toBeInTheDocument()
      const link = screen.getByRole('link', { name: 'https://cec.unmsm.edu.pe/inicio' })
      expect(link).toHaveAttribute('href', 'https://cec.unmsm.edu.pe/inicio')
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    })

    it('RF-28.10: sin esos datos no hay secciones vacías', () => {
      render(<PlaceCard />)
      open('puerta-3')
      expect(screen.queryByRole('heading', { name: 'Cómo encontrarlo' })).not.toBeInTheDocument()
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
      expect(screen.queryByText(/Correo:|Web:/)).not.toBeInTheDocument()
    })

    it('RF-28.10: una web que no es http(s) no se vuelve enlace', () => {
      seedPlaces([{ ...rich, website: 'javascript:alert(1)' }])
      render(<PlaceCard />)
      open(rich.id)
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
      expect(screen.getByText('javascript:alert(1)')).toBeInTheDocument()
    })

    it('RF-28.10: solo el correo también muestra la sección de contacto', () => {
      seedPlaces([{ ...rich, website: undefined, accessHint: undefined }])
      render(<PlaceCard />)
      open(rich.id)
      expect(screen.getByRole('heading', { name: 'Contacto' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Cómo encontrarlo' })).not.toBeInTheDocument()
    })
  })

  it('RF-12.10: los auditorios muestran su uso', () => {
    render(<PlaceCard />)
    open('auditorio-rosa-alarco-larraburre')
    expect(screen.getByRole('heading', { name: 'Uso' })).toBeInTheDocument()
  })

  it('RF-12.12: las cafeterías muestran sus servicios en lista', () => {
    render(<PlaceCard />)
    open('cafeteria-de-la-facultad-de-odontologia')
    const section = screen.getByRole('heading', { name: 'Servicios' }).parentElement!
    expect(within(section).getAllByRole('listitem').length).toBeGreaterThan(0)
  })

  it('RF-12.11: la Biblioteca Central muestra el horario detallado como lista', () => {
    render(<PlaceCard />)
    act(() => useMapStore.getState().selectPlace(idOf('biblioteca-central')))
    const section = screen.getByRole('heading', { name: 'Horario detallado' }).parentElement!
    expect(within(section).getAllByRole('listitem').length).toBeGreaterThan(0)
  })

  it('RF-13.31 y RF-13.32: «Cómo llegar» abre el diálogo de ruta con ese lugar como destino', async () => {
    useRouteStore.setState({ open: false, origin: null, destination: null, status: 'idle', result: null, activeRoute: null, notice: null })
    render(
      <>
        <PlaceCard />
        <RouteDialog />
      </>,
    )
    open('fisi')
    await userEvent.click(screen.getByRole('button', { name: 'Cómo llegar' }))
    const dialog = screen.getByRole('dialog', { name: 'Planificar ruta' })
    expect(within(dialog).getByRole('combobox', { name: 'Destino' })).toHaveValue(PLACES.find((p) => p.slug === 'fisi')!.name)
    expect(within(dialog).getByRole('combobox', { name: 'Punto de partida' })).toHaveFocus()
  })

  it('RF-13.33: con el diálogo abierto la ficha sigue abierta y Esc solo cierra el diálogo', async () => {
    useRouteStore.setState({ open: false, origin: null, destination: null, status: 'idle', result: null, activeRoute: null, notice: null })
    render(
      <>
        <PlaceCard />
        <RouteDialog />
      </>,
    )
    open('fisi')
    await userEvent.click(screen.getByRole('button', { name: 'Cómo llegar' }))
    await userEvent.keyboard('{Escape}') // cierra la lista de «Mi ubicación»
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Planificar ruta' })).not.toBeInTheDocument()
    expect(useMapStore.getState().selectedPlaceId).toBe(idOf('fisi'))
    expect(screen.getByRole('dialog', { name: PLACES.find((p) => p.slug === 'fisi')!.name })).toBeInTheDocument()
  })

  it('RF-12.5: al elegir otro lugar la ficha cambia', () => {
    render(<PlaceCard />)
    open('fisi')
    open('puerta-3')
    expect(screen.getByRole('dialog', { name: 'Puerta 3' })).toBeInTheDocument()
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
  })

  it('RF-12.6: el botón «Cerrar» cierra la ficha y limpia la selección', async () => {
    render(<PlaceCard />)
    open('puerta-3')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(useMapStore.getState().selectedPlaceId).toBeNull()
  })

  it('RF-12.6: Esc cierra la ficha', async () => {
    render(<PlaceCard />)
    open('puerta-3')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('RF-12.16: es un diálogo no modal con el nombre del lugar', () => {
    render(<PlaceCard />)
    open('puerta-3')
    const dialog = screen.getByRole('dialog', { name: 'Puerta 3' })
    expect(dialog).not.toHaveAttribute('aria-modal', 'true')
  })

  it('RF-12.16: al abrir, el foco va a «Cerrar»; al cerrar, vuelve al elemento anterior', async () => {
    render(
      <>
        <button>Antes</button>
        <PlaceCard />
      </>,
    )
    const before = screen.getByRole('button', { name: 'Antes' })
    before.focus()
    open('puerta-3')
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    expect(before).toHaveFocus()
  })
})
