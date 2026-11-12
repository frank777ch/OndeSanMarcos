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

  it('RF-26.15: solo tiene la pestaña Perfil (activa), sin Mapa ni Asistente, y el contenido vacío', () => {
    renderLayout()
    const nav = screen.getByRole('navigation', { name: 'Administración' })
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Perfil' })).toHaveAttribute('aria-current', 'page')
    expect(nav).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Mapa' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Asistente' })).not.toBeInTheDocument()
    // Solo el encabezado oculto para lectores de pantalla: sin contenido visible.
    expect(screen.getByRole('region', { name: 'Perfil' }).textContent).toBe('Perfil')
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
