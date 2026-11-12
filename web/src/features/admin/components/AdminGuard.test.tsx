import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { AdminGuard } from './AdminGuard'

const fetchMock = vi.fn()

function renderAdmin() {
  const router = createMemoryRouter(
    [
      { path: '/admin/login', element: <p>pantalla de login</p> },
      { path: '/admin', element: <AdminGuard />, children: [{ index: true, element: <p>área protegida</p> }] },
    ],
    { initialEntries: ['/admin'] },
  )
  render(<RouterProvider router={router} />)
  return router
}

describe('AdminGuard', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    sessionStorage.clear()
    useAuthStore.setState({ session: null, expired: false })
  })
  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  const withSession = () =>
    useAuthStore.setState({ session: { token: 'tok', expiresAt: Date.now() + 60_000 } })

  it('RF-26.13: sin sesión lleva a /admin/login sin llamar al servidor', async () => {
    const router = renderAdmin()
    expect(await screen.findByText('pantalla de login')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/admin/login')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('RF-26.14: con sesión confirma con /me antes de mostrar el área', async () => {
    withSession()
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ username: 'admin' }), { status: 200 }))
    renderAdmin()
    expect(screen.getByRole('status')).toHaveTextContent('Verificando sesión')
    expect(screen.queryByText('área protegida')).not.toBeInTheDocument()
    expect(await screen.findByText('área protegida')).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/auth\/me$/)
  })

  it('RF-26.14: si el servidor rechaza la sesión, la cierra y vuelve al login marcándola como vencida', async () => {
    withSession()
    fetchMock.mockResolvedValue(new Response('{}', { status: 401 }))
    renderAdmin()
    expect(await screen.findByText('pantalla de login')).toBeInTheDocument()
    expect(useAuthStore.getState()).toMatchObject({ session: null, expired: true })
  })

  it('un fallo de red al verificar no expulsa al administrador', async () => {
    withSession()
    fetchMock.mockRejectedValue(new TypeError('red'))
    renderAdmin()
    expect(await screen.findByText('área protegida')).toBeInTheDocument()
    expect(useAuthStore.getState().session).not.toBeNull()
  })

  it('RF-26.16: al cerrar la sesión vuelve al login', async () => {
    withSession()
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }))
    const router = renderAdmin()
    await screen.findByText('área protegida')
    useAuthStore.getState().logout()
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/login'))
  })
})
