import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { resetPlaces, seedPlaces } from '@/test/fixtures/places'
import { PLACES_ERROR_MESSAGE, usePlacesStore } from '../store/usePlacesStore'
import { PlacesStatus } from './PlacesStatus'

const fetchPlacesAndCategories = vi.fn()
vi.mock('@/services/api/placesApi', () => ({ fetchPlacesAndCategories: () => fetchPlacesAndCategories() }))

describe('PlacesStatus', () => {
  beforeEach(() => {
    fetchPlacesAndCategories.mockReset()
    resetPlaces()
  })

  it('RF-28.3: mientras cargan los lugares muestra el aviso de carga', () => {
    usePlacesStore.setState({ status: 'loading' })
    render(<PlacesStatus />)
    expect(screen.getByRole('status')).toHaveTextContent('Cargando lugares del campus')
  })

  it('con los lugares listos no muestra nada', () => {
    seedPlaces()
    const { container } = render(<PlacesStatus />)
    expect(container).toBeEmptyDOMElement()
  })

  it('RF-28.4: en error muestra un mensaje claro sobre los lugares, sin detalles técnicos, y el botón Reintentar', () => {
    usePlacesStore.setState({ status: 'error' })
    render(<PlacesStatus />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(PLACES_ERROR_MESSAGE)
    expect(alert).not.toHaveTextContent(/asistente|503|http|api/i)
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('RF-28.5: un 503 del servidor muestra el mismo mensaje, no el del asistente', async () => {
    const { ApiError } = await import('@/services/api/client')
    fetchPlacesAndCategories.mockRejectedValue(new ApiError('http', 'x', 503))
    await act(() => usePlacesStore.getState().load())
    render(<PlacesStatus />)
    expect(screen.getByRole('alert')).toHaveTextContent(PLACES_ERROR_MESSAGE)
  })

  it('RF-28.4: Reintentar vuelve a pedir los lugares y, si salen bien, el aviso desaparece', async () => {
    usePlacesStore.setState({ status: 'error' })
    fetchPlacesAndCategories.mockResolvedValue({ places: [], categories: [] })
    const { container } = render(<PlacesStatus />)
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(fetchPlacesAndCategories).toHaveBeenCalledTimes(1)
    expect(usePlacesStore.getState().status).toBe('ready')
    expect(container).toBeEmptyDOMElement()
  })
})
