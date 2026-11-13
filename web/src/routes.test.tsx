import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { useAuthStore } from '@/features/admin/store/useAuthStore'
import { routes } from '@/routes'

// mapbox-gl necesita WebGL, que jsdom no tiene.
vi.mock('react-map-gl/mapbox', () => ({ default: () => null, AttributionControl: () => null, useMap: () => ({ current: undefined }), Source: () => null, Layer: () => null }))
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

  it('RF-26.19: la barra de visitantes no tiene enlaces al área de administración', async () => {
    await renderAt('/asistente')
    expect(screen.queryByRole('link', { name: /admin|perfil/i })).not.toBeInTheDocument()
    expect(document.querySelector('a[href^="/admin"]')).toBeNull()
  })

  it('RF-26.20: /admin/login existe y una ruta desconocida sigue siendo 404', async () => {
    await renderAt('/admin/login')
    expect(screen.getByRole('heading', { name: 'Administración' })).toBeInTheDocument()
    cleanup()
    await renderAt('/no-existe')
    expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument()
  })

  it('RF-26.13: /admin sin sesión lleva a /admin/login', async () => {
    useAuthStore.setState({ session: null })
    const router = await renderAt('/admin')
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/login'))
  })
})

describe('rutas de administración · RF-31.1', () => {
  beforeEach(() => {
    sessionStorage.clear()
    useAuthStore.setState({ session: null, expired: false })
    // El guard confirma la sesión con el servidor: se simula la respuesta.
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(JSON.stringify({ username: 'admin' }), { status: 200 })))
  })
  afterEach(() => vi.unstubAllGlobals())

  it('sin sesión, /admin/lugares y /admin/categorias llevan al login', async () => {
    for (const path of ['/admin/lugares', '/admin/categorias']) {
      const router = await renderAt(path)
      await waitFor(() => expect(router.state.location.pathname).toBe('/admin/login'))
      cleanup()
    }
  })

  it('con sesión, cada pestaña tiene su ruta dentro del layout de administración', async () => {
    useAuthStore.setState({ session: { token: 't', expiresAt: Date.now() + 60_000 }, expired: false })
    await renderAt('/admin/lugares')
    expect(await screen.findByRole('region', { name: 'Lugares' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Lugares' })).toHaveAttribute('aria-current', 'page')
    cleanup()
    await renderAt('/admin/categorias')
    expect(await screen.findByRole('region', { name: 'Categorías' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Categorías' })).toHaveAttribute('aria-current', 'page')
    cleanup()
    await renderAt('/admin/perfil')
    expect(await screen.findByRole('region', { name: 'Perfil' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Perfil' })).toHaveAttribute('aria-current', 'page')
  })

  it('con sesión, /admin abre la primera pestaña del menú (Lugares)', async () => {
    useAuthStore.setState({ session: { token: 't', expiresAt: Date.now() + 60_000 }, expired: false })
    const router = await renderAt('/admin')
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/lugares'))
    expect(await screen.findByRole('region', { name: 'Lugares' })).toBeInTheDocument()
  })
})
