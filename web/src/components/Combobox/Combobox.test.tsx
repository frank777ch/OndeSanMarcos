import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Combobox, type ComboboxOption } from './Combobox'

const OPTIONS: ComboboxOption[] = [
  { value: 'facultades', label: 'Facultades' },
  { value: 'puertas', label: 'Puertas' },
  { value: 'cafeterias', label: 'Cafeterías' },
]

function Harness({ initial = null, clearable = false }: { initial?: string | null; clearable?: boolean }) {
  const [value, setValue] = useState<string | null>(initial)
  return (
    <>
      <Combobox label="Categoría" options={OPTIONS} value={value} onChange={setValue} required clearable={clearable} />
      <output data-testid="value">{String(value)}</output>
    </>
  )
}

const value = () => screen.getByTestId('value').textContent

describe('Combobox', () => {
  it('RF-31.14: al abrirlo muestra la lista completa', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('combobox', { name: /Categoría/ }))
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Facultades', 'Puertas', 'Cafeterías'])
  })

  it('RF-31.14: escribir filtra sin distinguir mayúsculas ni tildes', async () => {
    render(<Harness />)
    await userEvent.type(screen.getByRole('combobox'), 'CAFETERIAS')
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Cafeterías'])
    await userEvent.clear(screen.getByRole('combobox'))
    await userEvent.type(screen.getByRole('combobox'), 'zzz')
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
    expect(screen.getByText('Sin resultados')).toBeInTheDocument()
  })

  it('RF-31.14: se elige con clic', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByRole('option', { name: 'Puertas' }))
    expect(value()).toBe('puertas')
    expect(screen.getByRole('combobox')).toHaveValue('Puertas')
  })

  it('RF-31.14: se elige con el teclado (flechas y Enter) y Enter sin flechas toma la primera coincidencia', async () => {
    render(<Harness />)
    await userEvent.type(screen.getByRole('combobox'), 'fac{Enter}')
    expect(value()).toBe('facultades')
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    expect(value()).toBe('puertas')
  })

  it('RF-31.14: lo escrito sin elegir se descarta, el campo queda vacío y se avisa', async () => {
    render(<Harness />)
    await userEvent.type(screen.getByRole('combobox'), 'Inventada')
    await userEvent.tab()
    expect(value()).toBe('null')
    expect(screen.getByRole('combobox')).toHaveValue('')
    expect(screen.getByRole('alert')).toHaveTextContent('Elige una opción de la lista.')
  })

  it('RF-31.14: no ofrece crear opciones nuevas', async () => {
    render(<Harness />)
    await userEvent.type(screen.getByRole('combobox'), 'Nueva')
    expect(screen.queryByText(/crear/i)).not.toBeInTheDocument()
  })

  it('con una opción elegida, escribir y salir sin elegir conserva la elección', async () => {
    render(<Harness initial="puertas" />)
    expect(screen.getByRole('combobox')).toHaveValue('Puertas')
    await userEvent.type(screen.getByRole('combobox'), 'xyz')
    await userEvent.tab()
    expect(value()).toBe('puertas')
    expect(screen.getByRole('combobox')).toHaveValue('Puertas')
  })

  it('un campo opcional puede quitarse con el botón', async () => {
    render(<Harness initial="puertas" clearable />)
    await userEvent.click(screen.getByRole('button', { name: 'Quitar Categoría' }))
    expect(value()).toBe('null')
  })

  it('Esc con la lista abierta solo la cierra (no llega al diálogo)', async () => {
    const onKey = vi.fn()
    document.addEventListener('keydown', onKey)
    render(<Harness />)
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(onKey).not.toHaveBeenCalled()
    document.removeEventListener('keydown', onKey)
  })

  it('RF-31.35: marca el campo obligatorio y muestra el error recibido', () => {
    render(<Combobox label="Categoría" options={OPTIONS} value={null} onChange={() => {}} required error="La categoría no existe." />)
    expect(screen.getByRole('combobox')).toBeRequired()
    expect(screen.getByRole('combobox')).toHaveAccessibleDescription('La categoría no existe.')
  })
})
