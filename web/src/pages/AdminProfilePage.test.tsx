import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuthStore } from '@/features/admin/store/useAuthStore'
import { AdminProfilePage } from './AdminProfilePage'

const fetchMe = vi.hoisted(() => vi.fn())
vi.mock('@/services/api/adminClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/api/adminClient')>()),
  fetchMe: () => fetchMe(),
}))

beforeEach(() => {
  fetchMe.mockReset()
  useAuthStore.setState({ session: { token: 't', expiresAt: new Date(2026, 10, 12, 21, 30).getTime() }, expired: false })
})

describe('AdminProfilePage', () => {
  it('RF-37.10: muestra usuario, fecha de alta y vencimiento de la sesión', async () => {
    fetchMe.mockResolvedValue({ username: 'admin', createdAt: new Date(2026, 0, 15, 10, 30) })
    render(<AdminProfilePage />)
    expect(await screen.findByText('admin')).toBeInTheDocument()
    expect(screen.getByText(/15 de enero de 2026/)).toBeInTheDocument()
    expect(screen.getByText(/12 de noviembre de 2026/)).toBeInTheDocument()
  })

  it('RF-37.11: «Cambiar contraseña» abre el diálogo', async () => {
    fetchMe.mockResolvedValue({ username: 'admin', createdAt: new Date() })
    render(<AdminProfilePage />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
    expect(screen.getByRole('dialog', { name: 'Cambiar contraseña' })).toBeInTheDocument()
  })

  it('si no se pueden cargar los datos avisa, pero el botón sigue disponible', async () => {
    fetchMe.mockRejectedValue(new Error('sin red'))
    render(<AdminProfilePage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar tus datos')
    expect(screen.getByRole('button', { name: 'Cambiar contraseña' })).toBeInTheDocument()
  })
})
