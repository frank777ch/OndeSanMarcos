import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useMapStore } from '../store/useMapStore'
import { PlaceSearch } from './PlaceSearch'

const box = () => screen.getByRole('combobox', { name: 'Buscar un lugar' })

describe('PlaceSearch', () => {
  beforeEach(() => useMapStore.setState({ activeCategory: null, selectedPlaceId: null }))

  it('RF-11.6: muestra el campo «Buscar un lugar»', () => {
    render(<PlaceSearch />)
    expect(box()).toBeInTheDocument()
  })

  it('RF-11.7 y RF-11.11: escribir lista lugares con su categoría', async () => {
    render(<PlaceSearch />)
    await userEvent.type(box(), 'psicolog')
    const option = screen.getByRole('option', { name: /Facultad de Psicología/ })
    expect(within(option).getByText('Facultades')).toBeInTheDocument()
  })

  it('RF-11.8: con una sola letra no muestra lista ni mensaje', async () => {
    render(<PlaceSearch />)
    await userEvent.type(box(), 'f')
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('RF-11.9: sin coincidencias muestra «No encontramos ese lugar»', async () => {
    render(<PlaceSearch />)
    await userEvent.type(box(), 'xyz')
    expect(screen.getByRole('status')).toHaveTextContent('No encontramos ese lugar')
  })

  it('RF-11.10: muestra como máximo 8 resultados', async () => {
    render(<PlaceSearch />)
    await userEvent.type(box(), 'facultad')
    expect(screen.getAllByRole('option')).toHaveLength(8)
  })

  it('RF-11.13: elegir con clic selecciona el lugar, cierra la lista y rellena el campo', async () => {
    render(<PlaceSearch />)
    await userEvent.type(box(), 'puerta 3')
    await userEvent.click(screen.getByRole('option', { name: /Puerta 3/ }))
    expect(useMapStore.getState().selectedPlaceId).toBe('3')
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
    expect(box()).toHaveValue('Puerta 3')
  })

  it('RF-11.15: elegir un lugar oculto por el filtro lo quita', async () => {
    useMapStore.setState({ activeCategory: 'cafeterias' })
    render(<PlaceSearch />)
    await userEvent.type(box(), 'puerta 3')
    await userEvent.click(screen.getByRole('option', { name: /Puerta 3/ }))
    expect(useMapStore.getState().activeCategory).toBeNull()
  })

  it('RF-11.16: «Limpiar búsqueda» vacía el campo, cierra la lista y quita la selección', async () => {
    render(<PlaceSearch />)
    await userEvent.type(box(), 'puerta 3')
    await userEvent.click(screen.getByRole('option', { name: /Puerta 3/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }))
    expect(box()).toHaveValue('')
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
    expect(useMapStore.getState().selectedPlaceId).toBeNull()
    expect(screen.queryByRole('button', { name: 'Limpiar búsqueda' })).not.toBeInTheDocument()
  })

  it('RF-11.17: ↓↓ y Enter eligen el segundo resultado; aria-activedescendant sigue al resaltado', async () => {
    render(<PlaceSearch />)
    await userEvent.type(box(), 'facultad')
    const options = screen.getAllByRole('option')
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    expect(box()).toHaveAttribute('aria-activedescendant', options[1].id)
    expect(options[1]).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{Enter}')
    expect(box()).toHaveValue(options[1].querySelector('span')?.textContent ?? '')
    expect(useMapStore.getState().selectedPlaceId).not.toBeNull()
  })

  it('RF-11.17: Esc cierra la lista', async () => {
    render(<PlaceSearch />)
    await userEvent.type(box(), 'facultad')
    expect(box()).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard('{Escape}')
    expect(box()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('RF-11.17: ↑ no sale de la lista por arriba', async () => {
    render(<PlaceSearch />)
    await userEvent.type(box(), 'facultad')
    await userEvent.keyboard('{ArrowDown}{ArrowUp}{ArrowUp}')
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true')
  })
})
