import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { routes } from '@/routes'

// mapbox-gl necesita WebGL, que jsdom no tiene.
vi.mock('react-map-gl/mapbox', () => ({ default: () => null, NavigationControl: () => null, useMap: () => ({ current: undefined }), Source: () => null, Layer: () => null }))
vi.mock('mapbox-gl/dist/mapbox-gl.css', () => ({}))

async function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  // La ruta /mapa es de carga diferida: esperar a que el router termine de iniciar.
  await waitFor(() => expect(router.state.initialized).toBe(true))
  return router
}

describe('rutas', () => {
  it('redirige / a /mapa', async () => {
    const router = await renderAt('/')
    await waitFor(() => expect(router.state.location.pathname).toBe('/mapa'))
    expect(
      await screen.findByRole('region', { name: 'Mapa del campus' }),
    ).toBeInTheDocument()
  })

  it('navega al asistente desde la barra lateral', async () => {
    await renderAt('/mapa')
    await userEvent.click(screen.getByRole('link', { name: 'Asistente' }))
    expect(screen.getByRole('heading', { name: 'Asistente' })).toBeInTheDocument()
  })

  it('marca como activo el enlace actual', async () => {
    await renderAt('/asistente')
    expect(screen.getByRole('link', { name: 'Asistente' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('muestra 404 en rutas desconocidas', async () => {
    await renderAt('/no-existe')
    expect(
      screen.getByRole('heading', { name: 'Página no encontrada' }),
    ).toBeInTheDocument()
  })
})
