import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { useMapStore } from '@/features/map/store/useMapStore'
import { PlaceLinkCard } from './PlaceLinkCard'

const library = {
  id: 'biblioteca-central',
  name: 'Biblioteca Central Pedro Zulen',
  schedule: 'Lun–Sáb 8:00–20:00',
}

function renderCard() {
  const router = createMemoryRouter(
    [
      { path: '/asistente', element: <PlaceLinkCard place={library} /> },
      { path: '/mapa', element: <p>pantalla del mapa</p> },
    ],
    { initialEntries: ['/asistente'] },
  )
  render(<RouterProvider router={router} />)
  return router
}

describe('PlaceLinkCard', () => {
  beforeEach(() =>
    useMapStore.setState({ activeCategory: null, selectedPlaceId: null, selectionOrigin: null }),
  )

  it('RF-05.16: muestra el nombre y el horario', () => {
    renderCard()
    expect(screen.getByText('Biblioteca Central Pedro Zulen')).toBeInTheDocument()
    expect(screen.getByText('Lun–Sáb 8:00–20:00')).toBeInTheDocument()
  })

  it('RF-05.16: sin horario no muestra esa línea', () => {
    const router = createMemoryRouter([
      { path: '/', element: <PlaceLinkCard place={{ id: '8', name: 'FISI' }} /> },
    ])
    render(<RouterProvider router={router} />)
    expect(screen.getByText('FISI')).toBeInTheDocument()
    expect(screen.queryByText(/Lun/)).not.toBeInTheDocument()
  })

  it('RF-05.27: el botón dice a qué lugar lleva', () => {
    renderCard()
    expect(
      screen.getByRole('button', { name: 'Ver en el mapa: Biblioteca Central Pedro Zulen' }),
    ).toBeInTheDocument()
  })

  it('RF-05.19: elige el lugar con origen «other» y navega a /mapa', async () => {
    const router = renderCard()
    await userEvent.click(screen.getByRole('button', { name: /Ver en el mapa/ }))
    expect(useMapStore.getState().selectedPlaceId).toBe('biblioteca-central')
    expect(useMapStore.getState().selectionOrigin).toBe('other')
    expect(router.state.location.pathname).toBe('/mapa')
    expect(screen.getByText('pantalla del mapa')).toBeInTheDocument()
  })

  it('RF-05.22: quita el filtro de categoría que ocultaría el lugar', async () => {
    useMapStore.setState({ activeCategory: 'puertas' })
    renderCard()
    await userEvent.click(screen.getByRole('button', { name: /Ver en el mapa/ }))
    expect(useMapStore.getState().activeCategory).toBeNull()
  })

  it('RF-05.19: si el lugar ya estaba elegido desde el mapa, pasa a origen «other»', async () => {
    useMapStore.getState().selectPlace('biblioteca-central', 'map')
    renderCard()
    await userEvent.click(screen.getByRole('button', { name: /Ver en el mapa/ }))
    expect(useMapStore.getState().selectionOrigin).toBe('other')
  })
})
