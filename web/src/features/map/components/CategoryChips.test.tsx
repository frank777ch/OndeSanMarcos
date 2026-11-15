import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useMapStore } from '../store/useMapStore'
import { CategoryChips } from './CategoryChips'
import { resetPlaces, seedPlaces, catId } from '@/test/fixtures/places'
import { usePlacesStore } from '../store/usePlacesStore'

describe('CategoryChips', () => {
  beforeEach(() => seedPlaces())
  beforeEach(() => useMapStore.setState({ activeCategory: null }))

  it('RF-11.5 y RF-28.8: «Todos» primero y luego un botón por categoría con lugares, en orden alfabético', () => {
    render(<CategoryChips />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.map((b) => b.textContent)).toEqual([
      'Todos',
      'Administración',
      'Auditorios',
      'Cafeterías',
      'Campos deportivos',
      'Facultades',
      'Puertas',
      'Servicios',
    ])
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true')
    for (const b of buttons.slice(1)) expect(b).toHaveAttribute('aria-pressed', 'false')
  })

  it('RF-28.8: una categoría sin lugares publicados no tiene botón («Otros» no tiene lugares)', () => {
    render(<CategoryChips />)
    expect(screen.queryByRole('button', { name: 'Otros' })).not.toBeInTheDocument()
  })

  it('RF-28.8: las etiquetas salen de las categorías cargadas (también las nuevas), ordenadas alfabéticamente', () => {
    seedPlaces(
      [
        { id: 1, slug: 'a', name: 'A', category: catId('nueva'), coordinates: [-77, -12], keywords: [] },
        { id: 2, slug: 'b', name: 'B', category: catId('puertas'), coordinates: [-77, -12], keywords: [] },
      ],
      [
        { id: catId('nueva'), slug: 'nueva', label: 'Mi categoría', color: '#123456' },
        { id: catId('puertas'), slug: 'puertas', label: 'Puertas', color: '#e74c3c' },
      ],
    )
    render(<CategoryChips />)
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['Todos', 'Mi categoría', 'Puertas'])
  })

  it('RF-28.3: sin lugares cargados (cargando o con error) no hay botones', () => {
    resetPlaces()
    const { container, rerender } = render(<CategoryChips />)
    expect(container).toBeEmptyDOMElement()
    usePlacesStore.setState({ status: 'error' })
    rerender(<CategoryChips />)
    expect(container).toBeEmptyDOMElement()
  })

  it('«Todos» quita el filtro de categoría', async () => {
    render(<CategoryChips />)
    await userEvent.click(screen.getByRole('button', { name: 'Cafeterías' }))
    await userEvent.click(screen.getByRole('button', { name: 'Todos' }))
    expect(useMapStore.getState().activeCategory).toBeNull()
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('RF-10.6: pulsar un chip lo marca como activo', async () => {
    render(<CategoryChips />)
    await userEvent.click(screen.getByRole('button', { name: 'Cafeterías' }))
    expect(screen.getByRole('button', { name: 'Cafeterías' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(useMapStore.getState().activeCategory).toBe(catId('cafeterias'))
  })

  it('RF-10.7: pulsar el chip activo lo desactiva', async () => {
    render(<CategoryChips />)
    const chip = screen.getByRole('button', { name: 'Cafeterías' })
    await userEvent.click(chip)
    await userEvent.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'false')
  })

  it('RF-10.8: solo un chip activo a la vez', async () => {
    render(<CategoryChips />)
    await userEvent.click(screen.getByRole('button', { name: 'Cafeterías' }))
    await userEvent.click(screen.getByRole('button', { name: 'Puertas' }))
    const pressed = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-pressed') === 'true')
    expect(pressed.map((b) => b.textContent)).toEqual(['Puertas'])
  })

  it('RF-10.10: se puede activar con el teclado', async () => {
    render(<CategoryChips />)
    screen.getByRole('button', { name: 'Facultades' }).focus()
    await userEvent.tab({ shift: true })
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Facultades' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(useMapStore.getState().activeCategory).toBe(catId('facultades'))
  })
})
