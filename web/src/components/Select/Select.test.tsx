import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Select } from './Select'

const OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'yes', label: 'Publicados' },
]

describe('Select', () => {
  it('tiene etiqueta, opciones y el valor elegido', () => {
    render(<Select label="Estado" value="yes" options={OPTIONS} onChange={() => {}} />)
    expect(screen.getByLabelText('Estado')).toHaveValue('yes')
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Todos', 'Publicados'])
  })

  it('avisa del valor elegido', async () => {
    const onChange = vi.fn()
    render(<Select label="Estado" value="all" options={OPTIONS} onChange={onChange} />)
    await userEvent.selectOptions(screen.getByLabelText('Estado'), 'yes')
    expect(onChange).toHaveBeenCalledWith('yes')
  })

  it('la flecha es un icono propio, con margen respecto al borde, y el select no dibuja la del navegador', () => {
    const { container } = render(<Select label="Estado" value="all" options={OPTIONS} onChange={() => {}} />)
    expect(screen.getByLabelText('Estado')).toHaveClass('appearance-none', 'pr-11')
    const icon = container.querySelector('svg')!
    expect(icon).toHaveClass('right-4', 'pointer-events-none')
  })
})
