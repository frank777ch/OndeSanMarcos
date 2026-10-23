import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from './Input'

describe('Input', () => {
  it('asocia la etiqueta con el campo', async () => {
    render(<Input label="Buscar" />)
    const input = screen.getByLabelText('Buscar')
    await userEvent.type(input, 'biblioteca')
    expect(input).toHaveValue('biblioteca')
  })

  it('muestra el error y lo marca como inválido', () => {
    render(<Input label="Buscar" error="Campo requerido" />)
    expect(screen.getByLabelText('Buscar')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert')).toHaveTextContent('Campo requerido')
  })
})
