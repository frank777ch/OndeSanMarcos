import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useMapStore } from '../store/useMapStore'
import { CategoryChips } from './CategoryChips'

describe('CategoryChips', () => {
  beforeEach(() => useMapStore.setState({ activeCategory: null }))

  it('RF-11.5: muestra un botón por categoría en el orden definido, sin ninguno activo', () => {
    render(<CategoryChips />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.map((b) => b.textContent)).toEqual([
      'Facultades',
      'Cafeterías',
      'Auditorios',
      'Campos deportivos',
      'Puertas',
      'Administración',
      'Salud',
      'Servicios',
      'Otros',
    ])
    for (const b of buttons) expect(b).toHaveAttribute('aria-pressed', 'false')
  })

  it('RF-10.6: pulsar un chip lo marca como activo', async () => {
    render(<CategoryChips />)
    await userEvent.click(screen.getByRole('button', { name: 'Cafeterías' }))
    expect(screen.getByRole('button', { name: 'Cafeterías' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(useMapStore.getState().activeCategory).toBe('cafeterias')
  })

  it('RF-10.7: pulsar el chip activo lo desactiva', async () => {
    render(<CategoryChips />)
    const chip = screen.getByRole('button', { name: 'Cafeterías' })
    await userEvent.click(chip)
    await userEvent.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'false')
  })

  it('RF-10.8: solo un chip activo a la vez', async () => {
    render(<CategoryChips />)
    await userEvent.click(screen.getByRole('button', { name: 'Cafeterías' }))
    await userEvent.click(screen.getByRole('button', { name: 'Puertas' }))
    const pressed = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-pressed') === 'true')
    expect(pressed.map((b) => b.textContent)).toEqual(['Puertas'])
  })

  it('RF-10.10: se puede activar con el teclado', async () => {
    render(<CategoryChips />)
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Facultades' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(useMapStore.getState().activeCategory).toBe('facultades')
  })
})
