import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PLACES } from '../data/places'
import { useMapStore } from '../store/useMapStore'
import { PlaceCard } from './PlaceCard'

const reset = () =>
  useMapStore.setState({ activeCategory: null, selectedPlaceId: null, selectionOrigin: null })
const open = (id: string) => act(() => useMapStore.getState().selectPlace(id, 'map'))

describe('PlaceCard', () => {
  beforeEach(reset)

  it('no se muestra sin lugar elegido', () => {
    render(<PlaceCard />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('RF-12.9: siempre muestra nombre y categoría', () => {
    render(<PlaceCard />)
    open('3')
    const dialog = screen.getByRole('dialog', { name: 'Puerta 3' })
    expect(within(dialog).getByText('Puertas')).toBeInTheDocument()
  })

  it('RF-12.2 y RF-12.10: un lugar sin datos no muestra secciones', () => {
    render(<PlaceCard />)
    open('3') // Puerta 3
    for (const title of ['Horario', 'Acerca de este lugar', 'Contacto', 'Carreras', 'Servicios', 'Uso']) {
      expect(screen.queryByRole('heading', { name: title })).not.toBeInTheDocument()
    }
  })

  it('RF-12.10 y RF-12.12: la FISI muestra horario, descripción, contacto y carreras en lista', () => {
    render(<PlaceCard />)
    open('8')
    const fisi = PLACES.find((p) => p.id === '8')!
    expect(screen.getByRole('heading', { name: 'Horario' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Acerca de este lugar' })).toBeInTheDocument()
    expect(screen.getByText(`Teléfono: ${fisi.phone}`)).toBeInTheDocument()
    const section = screen.getByRole('heading', { name: 'Carreras' }).parentElement!
    expect(within(section).getAllByRole('listitem')).toHaveLength(fisi.careers!.length)
  })

  it('RF-12.10: sin teléfono no aparece la línea «Teléfono»', () => {
    render(<PlaceCard />)
    open('12') // Ingeniería Civil: sin teléfono
    expect(screen.queryByText(/Teléfono:/)).not.toBeInTheDocument()
  })

  it('RF-12.10: los auditorios muestran su uso', () => {
    render(<PlaceCard />)
    open('37')
    expect(screen.getByRole('heading', { name: 'Uso' })).toBeInTheDocument()
  })

  it('RF-12.12: las cafeterías muestran sus servicios en lista', () => {
    render(<PlaceCard />)
    open('34')
    const section = screen.getByRole('heading', { name: 'Servicios' }).parentElement!
    expect(within(section).getAllByRole('listitem').length).toBeGreaterThan(0)
  })

  it('RF-12.11: la Biblioteca Central muestra el horario detallado como lista', () => {
    render(<PlaceCard />)
    act(() => useMapStore.getState().selectPlace('biblioteca-central'))
    const section = screen.getByRole('heading', { name: 'Horario detallado' }).parentElement!
    expect(within(section).getAllByRole('listitem').length).toBeGreaterThan(0)
  })

  it('RF-12.13: no hay botón «Cómo llegar» todavía', () => {
    render(<PlaceCard />)
    open('8')
    expect(screen.queryByRole('button', { name: /cómo llegar/i })).not.toBeInTheDocument()
  })

  it('RF-12.5: al elegir otro lugar la ficha cambia', () => {
    render(<PlaceCard />)
    open('8')
    open('3')
    expect(screen.getByRole('dialog', { name: 'Puerta 3' })).toBeInTheDocument()
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
  })

  it('RF-12.6: el botón «Cerrar» cierra la ficha y limpia la selección', async () => {
    render(<PlaceCard />)
    open('3')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(useMapStore.getState().selectedPlaceId).toBeNull()
  })

  it('RF-12.6: Esc cierra la ficha', async () => {
    render(<PlaceCard />)
    open('3')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('RF-12.16: es un diálogo no modal con el nombre del lugar', () => {
    render(<PlaceCard />)
    open('3')
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
    open('3')
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    expect(before).toHaveFocus()
  })
})
