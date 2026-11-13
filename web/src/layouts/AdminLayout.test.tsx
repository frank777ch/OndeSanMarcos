import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { useAuthStore } from '@/features/admin/store/useAuthStore'
import { AdminProfilePage } from '@/pages/AdminProfilePage'
import { AdminLayout } from './AdminLayout'

function renderLayout() {
  render(
    <RouterProvider
      router={createMemoryRouter(
        [{ path: '/admin', element: <AdminLayout />, children: [{ index: true, element: <AdminProfilePage /> }] }],
        { initialEntries: ['/admin'] },
      )}
    />,
  )
}

describe('AdminLayout', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ session: { token: 't', expiresAt: Date.now() + 60_000 }, expired: false })
  })

  it('RF-26.15 y RF-31.1: pestañas Perfil (activa), Lugares y Categorías, sin Mapa ni Asistente', () => {
    renderLayout()
    const nav = screen.getByRole('navigation', { name: 'Administración' })
    expect(screen.getAllByRole('link').map((l) => l.textContent)).toEqual(['Lugares', 'Categorías', 'Perfil'])
    expect(screen.getByRole('link', { name: 'Perfil' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Lugares' })).toHaveAttribute('href', '/admin/lugares')
    expect(screen.getByRole('link', { name: 'Categorías' })).toHaveAttribute('href', '/admin/categorias')
    expect(nav).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Mapa' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Asistente' })).not.toBeInTheDocument()
    // «Perfil» muestra los datos de la cuenta y el botón de cambiar contraseña (HU-37).
    expect(screen.getByRole('region', { name: 'Perfil' })).toHaveTextContent('Usuario')
    expect(screen.getByRole('button', { name: 'Cambiar contraseña' })).toBeInTheDocument()
  })

  it('RF-26.21: la barra se contrae y se expande como la del mapa', async () => {
    renderLayout()
    await userEvent.click(screen.getByRole('button', { name: 'Contraer barra lateral' }))
    expect(screen.getByRole('button', { name: 'Expandir barra lateral' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('link', { name: 'Perfil' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument()
  })

  it('RF-26.16: Cerrar sesión descarta la sesión', async () => {
    renderLayout()
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(useAuthStore.getState().session).toBeNull()
    expect(useAuthStore.getState().expired).toBe(false)
  })
})
