import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from './ConfirmDialog'

describe('ConfirmDialog', () => {
  const setup = (onConfirm = vi.fn(), onCancel = vi.fn()) => {
    render(
      <ConfirmDialog open title="¿Despublicar?" message="Dejará de verse." confirmLabel="Despublicar" onConfirm={onConfirm} onCancel={onCancel} />,
    )
    return { onConfirm, onCancel }
  }

  it('muestra título y mensaje y confirma o cancela', async () => {
    const { onConfirm, onCancel } = setup()
    expect(screen.getByRole('dialog', { name: '¿Despublicar?' })).toBeInTheDocument()
    expect(screen.getByText('Dejará de verse.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Despublicar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('Esc cancela', async () => {
    const { onCancel } = setup()
    await userEvent.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalled()
  })
})
