import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('llama onClick', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Enviar</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('no dispara onClick si está deshabilitado', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Enviar
      </Button>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('usa type="button" por defecto', () => {
    render(<Button>Ok</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('el tamaño «icon» es cuadrado y sin relleno horizontal', () => {
    render(<Button size="icon" aria-label="Enviar">x</Button>)
    const { className } = screen.getByRole('button', { name: 'Enviar' })
    expect(className).toContain('size-11')
    expect(className).not.toContain('px-6')
  })

  it('el tamaño «sm» no arrastra el relleno del tamaño normal', () => {
    render(<Button size="sm">Ver</Button>)
    const { className } = screen.getByRole('button', { name: 'Ver' })
    expect(className).toContain('px-4')
    expect(className).not.toContain('px-6')
  })
})
