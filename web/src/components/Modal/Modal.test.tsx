import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal'

describe('Modal', () => {
  it('no renderiza nada si está cerrado', () => {
    render(
      <Modal open={false} title="Hola" onClose={() => {}}>
        contenido
      </Modal>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('muestra título y contenido cuando está abierto', () => {
    render(
      <Modal open title="Hola" onClose={() => {}}>
        contenido
      </Modal>,
    )
    expect(screen.getByRole('dialog', { name: 'Hola' })).toBeInTheDocument()
    expect(screen.getByText('contenido')).toBeInTheDocument()
  })

  it('se cierra con Esc y con el botón', async () => {
    const onClose = vi.fn()
    render(
      <Modal open title="Hola" onClose={onClose}>
        contenido
      </Modal>,
    )
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
