import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { useAuthStore } from '@/features/admin/store/useAuthStore'
import { ApiError } from '@/services/api/client'
import { AdminLoginPage } from './AdminLoginPage'

const loginRequest = vi.fn()
vi.mock('@/services/api/authApi', () => ({
  loginRequest: (u: string, p: string) => loginRequest(u, p),
}))

function renderLogin() {
  const router = createMemoryRouter(
    [
      { path: '/admin/login', element: <AdminLoginPage /> },
      { path: '/admin', element: <p>área admin</p> },
    ],
    { initialEntries: ['/admin/login'] },
  )
  render(<RouterProvider router={router} />)
  return router
}

const user = () => screen.getByLabelText('Usuario')
const pass = () => screen.getByLabelText('Contraseña')
const submit = () => screen.getByRole('button', { name: /Ingresar|Ingresando/ })

async function fill(u = 'admin', p = 'clave') {
  await userEvent.type(user(), u)
  await userEvent.type(pass(), p)
}

describe('AdminLoginPage', () => {
  beforeEach(() => {
    loginRequest.mockReset()
    sessionStorage.clear()
    useAuthStore.setState({ session: null, expired: false })
  })

  it('RF-26.1: muestra usuario, contraseña oculta y Ingresar, con el foco en Usuario', () => {
    renderLogin()
    expect(user()).toHaveFocus()
    expect(pass()).toHaveAttribute('type', 'password')
    expect(submit()).toBeInTheDocument()
  })

  it('RF-26.8: el ícono muestra y oculta la contraseña sin perder lo escrito', async () => {
    renderLogin()
    await userEvent.type(pass(), 'clave')
    expect(pass()).toHaveAttribute('type', 'password')
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    expect(pass()).toHaveAttribute('type', 'text')
    expect(pass()).toHaveValue('clave')
    await userEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
    expect(pass()).toHaveAttribute('type', 'password')
  })

  it('RF-26.2: Ingresar está deshabilitado con algún campo vacío y Enter envía', async () => {
    renderLogin()
    expect(submit()).toBeDisabled()
    await userEvent.type(user(), 'admin')
    expect(submit()).toBeDisabled()
    loginRequest.mockResolvedValue({ token: 't', expiresAt: Date.now() + 60_000 })
    await userEvent.type(pass(), 'clave{Enter}')
    expect(loginRequest).toHaveBeenCalledWith('admin', 'clave')
  })

  it('RF-26.3: mientras envía deshabilita el botón y no duplica el envío', async () => {
    let resolve!: (v: unknown) => void
    loginRequest.mockReturnValue(new Promise((r) => (resolve = r)))
    renderLogin()
    await fill()
    await userEvent.click(submit())
    expect(screen.getByRole('button', { name: 'Ingresando…' })).toBeDisabled()
    await userEvent.type(pass(), '{Enter}')
    expect(loginRequest).toHaveBeenCalledTimes(1)
    await act(async () => resolve({ token: 't', expiresAt: Date.now() + 60_000 }))
  })

  it('RF-26.4: un login correcto guarda la sesión y lleva a /admin', async () => {
    loginRequest.mockResolvedValue({ token: 't', expiresAt: Date.now() + 60_000 })
    const router = renderLogin()
    await fill()
    await userEvent.click(submit())
    expect(await screen.findByText('área admin')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/admin')
    expect(useAuthStore.getState().session?.token).toBe('t')
  })

  it('RF-26.5: con credenciales incorrectas muestra el error, conserva el usuario y enfoca la contraseña vacía', async () => {
    loginRequest.mockRejectedValue(new ApiError('http', 'x', 401))
    renderLogin()
    await fill('admin', 'mala')
    await userEvent.click(submit())
    expect(await screen.findByRole('alert')).toHaveTextContent('Usuario o contraseña incorrectos')
    expect(user()).toHaveValue('admin')
    expect(pass()).toHaveValue('')
    expect(pass()).toHaveFocus()
  })

  it('RF-26.6: con demasiados intentos muestra los minutos redondeados hacia arriba', async () => {
    loginRequest.mockRejectedValue(new ApiError('http', 'x', 429, 61))
    renderLogin()
    await fill()
    await userEvent.click(submit())
    expect(await screen.findByRole('alert')).toHaveTextContent('Espera 2 min')
  })

  it('RF-26.6: no deja enviar mientras dura el bloqueo y lo habilita al terminar', async () => {
    loginRequest.mockRejectedValue(new ApiError('http', 'x', 429, 1))
    renderLogin()
    await fill()
    await userEvent.click(submit())
    await screen.findByRole('alert')
    await userEvent.type(pass(), 'otra')
    expect(submit()).toBeDisabled()
    await waitFor(() => expect(submit()).toBeEnabled(), { timeout: 2500 })
    expect(loginRequest).toHaveBeenCalledTimes(1)
  })

  it('RF-26.7: sin conexión o con error del servidor muestra el aviso y permite reintentar', async () => {
    loginRequest.mockRejectedValueOnce(new ApiError('network', 'x'))
    renderLogin()
    await fill()
    await userEvent.click(submit())
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar con el servidor. Intenta de nuevo.')
    loginRequest.mockRejectedValueOnce(new ApiError('http', 'x', 500))
    await userEvent.type(pass(), 'clave')
    await userEvent.click(submit())
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar')
    expect(loginRequest).toHaveBeenCalledTimes(2)
  })

  it('RF-26.12: con sesión, /admin/login lleva a /admin', async () => {
    useAuthStore.setState({ session: { token: 't', expiresAt: Date.now() + 60_000 } })
    renderLogin()
    expect(await screen.findByText('área admin')).toBeInTheDocument()
  })

  it('RF-26.14: si llegó por una sesión vencida lo avisa una sola vez', () => {
    useAuthStore.setState({ expired: true })
    const { unmount } = render(
      <RouterProvider router={createMemoryRouter([{ path: '/', element: <AdminLoginPage /> }])} />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Tu sesión expiró. Ingresa de nuevo.')
    expect(useAuthStore.getState().expired).toBe(false)
    unmount()
  })
})
