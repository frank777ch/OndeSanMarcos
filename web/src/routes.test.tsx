import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { routes } from '@/routes'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

describe('rutas', () => {
  it('redirige / a /mapa', () => {
    const router = renderAt('/')
    expect(router.state.location.pathname).toBe('/mapa')
    expect(screen.getByRole('heading', { name: 'Mapa' })).toBeInTheDocument()
  })

  it('navega al asistente desde la barra lateral', async () => {
    renderAt('/mapa')
    await userEvent.click(screen.getByRole('link', { name: 'Asistente' }))
    expect(screen.getByRole('heading', { name: 'Asistente' })).toBeInTheDocument()
  })

  it('marca como activo el enlace actual', () => {
    renderAt('/asistente')
    expect(screen.getByRole('link', { name: 'Asistente' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('muestra 404 en rutas desconocidas', () => {
    renderAt('/no-existe')
    expect(
      screen.getByRole('heading', { name: 'Página no encontrada' }),
    ).toBeInTheDocument()
  })
})
