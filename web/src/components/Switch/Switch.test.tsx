import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Switch } from './Switch'

describe('Switch', () => {
  it('es un interruptor accesible con su texto como nombre y refleja su estado', () => {
    const { rerender } = render(<Switch checked={false} onChange={() => {}}>Publicado</Switch>)
    expect(screen.getByRole('switch', { name: 'Publicado' })).not.toBeChecked()
    rerender(<Switch checked onChange={() => {}}>Publicado</Switch>)
    expect(screen.getByRole('switch', { name: 'Publicado' })).toBeChecked()
  })

  it('se cambia con clic (también sobre el texto) y con el teclado', async () => {
    const onChange = vi.fn()
    render(<Switch checked={false} onChange={onChange}>Publicado</Switch>)
    await userEvent.click(screen.getByText('Publicado'))
    expect(onChange).toHaveBeenLastCalledWith(true)
    screen.getByRole('switch').focus()
    await userEvent.keyboard(' ')
    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it('deshabilitado no cambia', async () => {
    const onChange = vi.fn()
    render(<Switch checked={false} onChange={onChange} disabled>Publicado</Switch>)
    await userEvent.click(screen.getByText('Publicado'))
    expect(onChange).not.toHaveBeenCalled()
  })
})
