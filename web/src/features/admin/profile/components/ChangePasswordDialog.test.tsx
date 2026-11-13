import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useToastStore } from '@/components/Toast/toastStore'
import { ApiError } from '@/services/api/client'
import { ChangePasswordDialog } from './ChangePasswordDialog'

const changePassword = vi.hoisted(() => vi.fn())
vi.mock('@/services/api/adminClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/api/adminClient')>()),
  changePassword: (...a: unknown[]) => changePassword(...a),
}))

const onClose = vi.fn()
const field = (name: string) => screen.getByLabelText(new RegExp(`^${name}`), { selector: 'input' })
const apiError = (status: number, detail?: unknown, retry?: number) =>
  new ApiError('http', 'x', status, retry, { detail })

async function fill(current = 'clave-actual', next = 'nueva-clave-1', confirm = next) {
  await userEvent.type(field('Contraseña actual'), current)
  await userEvent.type(field('Contraseña nueva'), next)
  await userEvent.type(field('Confirmar'), confirm)
}
const submit = () => userEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))

beforeEach(() => {
  changePassword.mockReset()
  onClose.mockReset()
  useToastStore.setState({ toasts: [] })
  render(<ChangePasswordDialog open onClose={onClose} />)
})

describe('ChangePasswordDialog', () => {
  it('RF-37.11: es un diálogo con título, tres campos ocultos y se cierra con Cancelar, X o Esc', async () => {
    expect(screen.getByRole('dialog', { name: 'Cambiar contraseña' })).toBeInTheDocument()
    expect(field('Contraseña actual')).toHaveAttribute('type', 'password')
    await userEvent.click(screen.getAllByRole('button', { name: /^Mostrar/ })[0])
    expect(field('Contraseña actual')).toHaveAttribute('type', 'text')
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onClose).toHaveBeenCalledTimes(3)
  })

  it('RF-37.12: valida antes de enviar y muestra el error junto al campo', async () => {
    await fill('clave-actual', 'corta', 'otra')
    await submit()
    expect(changePassword).not.toHaveBeenCalled()
    expect(screen.getByText(/al menos 8 caracteres\./i, { selector: '[role=alert]' })).toBeInTheDocument()
    expect(screen.getByText('No coincide con la contraseña nueva.')).toBeInTheDocument()
  })

  it('RF-37.14: con éxito envía las contraseñas, cierra y avisa', async () => {
    changePassword.mockResolvedValue(undefined)
    await fill()
    await submit()
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(changePassword).toHaveBeenCalledWith('clave-actual', 'nueva-clave-1')
    expect(useToastStore.getState().toasts.map((t) => t.message)).toContain('Contraseña actualizada')
  })

  it('RF-37.13: una actual incorrecta (403) se marca en su campo y el diálogo sigue abierto', async () => {
    changePassword.mockRejectedValue(apiError(403, 'La contraseña actual no es correcta.'))
    await fill()
    await submit()
    expect(await screen.findByText('La contraseña actual no es correcta.')).toBeInTheDocument()
    expect(field('Contraseña actual')).toHaveAttribute('aria-invalid', 'true')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('RF-37.13: un 429 indica cuánto esperar', async () => {
    changePassword.mockRejectedValue(apiError(429, 'x', 900))
    await fill()
    await submit()
    expect(await screen.findByText(/en 15 minutos/)).toBeInTheDocument()
  })

  it('RF-37.13: un 422 del servidor se muestra junto a la contraseña nueva', async () => {
    changePassword.mockRejectedValue(
      apiError(422, [{ loc: ['body', 'new_password'], msg: 'Value error, Debe ser distinta de la actual.' }]),
    )
    await fill()
    await submit()
    expect(await screen.findByText('Debe ser distinta de la actual.')).toBeInTheDocument()
  })

  it('un error de red muestra un mensaje general', async () => {
    changePassword.mockRejectedValue(new ApiError('network', 'x'))
    await fill()
    await submit()
    expect(await screen.findByText(/No pudimos cambiar la contraseña/)).toBeInTheDocument()
  })

  it('RF-37.15: mientras se envía el botón queda deshabilitado (sin envíos dobles)', async () => {
    changePassword.mockReturnValue(new Promise(() => {}))
    await fill()
    await submit()
    const button = await screen.findByRole('button', { name: 'Guardando…' })
    expect(button).toBeDisabled()
    await userEvent.click(button)
    expect(changePassword).toHaveBeenCalledTimes(1)
  })
})
