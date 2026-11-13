import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Place } from '../types'
import { PlaceCombobox } from './PlaceCombobox'
import { seedPlaces } from '@/test/fixtures/places'

const onChoose = vi.fn<(p: Place) => void>()
const onChooseExtra = vi.fn<(id: string) => void>()
const onClear = vi.fn()

function Harness({ extra = true }: { extra?: boolean }) {
  const [value, setValue] = useState('')
  return (
    <PlaceCombobox
      label="Punto de partida"
      value={value}
      onValueChange={setValue}
      onChoose={(p) => {
        onChoose(p)
        setValue(p.name)
      }}
      onClear={() => {
        onClear()
        setValue('')
      }}
      clearLabel="Limpiar punto de partida"
      extraOptions={extra ? [{ id: 'my-location', label: 'Mi ubicación' }] : []}
      onChooseExtra={onChooseExtra}
    />
  )
}
const box = () => screen.getByRole('combobox', { name: 'Punto de partida' })

describe('PlaceCombobox', () => {
  beforeEach(() => {
    seedPlaces()
    vi.clearAllMocks()
  })

  it('RF-13.7: busca sin tildes ni mayúsculas y muestra la categoría', async () => {
    render(<Harness />)
    await userEvent.type(box(), 'PSICOLOG')
    expect(screen.getByRole('option', { name: /Facultad de Psicología/ })).toBeInTheDocument()
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('RF-13.7: con una letra no hay lista; sin coincidencias avisa', async () => {
    render(<Harness extra={false} />)
    await userEvent.type(box(), 'f')
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
    await userEvent.type(box(), 'xyzw')
    // El aviso espera la respuesta del servidor (aquí falla, como sin conexión): HU-36, RF-36.16.
    expect(await screen.findByRole('status')).toHaveTextContent('No encontramos ese lugar')
  })

  it('RF-13.7: se elige con flechas y Enter', async () => {
    render(<Harness />)
    await userEvent.type(box(), 'puerta 3')
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(onChoose).toHaveBeenCalledWith(expect.objectContaining({ id: 'puerta-3' }))
    expect(box()).toHaveValue('Puerta 3')
  })

  it('RF-13.14: con el campo vacío ofrece la opción extra y no la ofrece al escribir', async () => {
    render(<Harness />)
    await userEvent.click(box())
    await userEvent.click(screen.getByRole('option', { name: 'Mi ubicación' }))
    expect(onChooseExtra).toHaveBeenCalledWith('my-location')
    await userEvent.type(box(), 'puerta')
    expect(screen.queryByRole('option', { name: 'Mi ubicación' })).not.toBeInTheDocument()
  })

  it('RF-13.14: sin opciones extra el campo vacío no muestra lista', async () => {
    render(<Harness extra={false} />)
    await userEvent.click(box())
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('RF-13.10: el botón limpiar vacía el campo', async () => {
    render(<Harness />)
    await userEvent.type(box(), 'puerta 3')
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar punto de partida' }))
    expect(onClear).toHaveBeenCalled()
    expect(box()).toHaveValue('')
  })

  it('RF-13.3: Esc con la lista abierta no sube; sin lista sí', async () => {
    const outer = vi.fn()
    render(
      <div onKeyDown={outer}>
        <Harness />
      </div>,
    )
    await userEvent.type(box(), 'puerta')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
    expect(outer).not.toHaveBeenCalledWith(expect.objectContaining({ key: 'Escape' }))
    await userEvent.keyboard('{Escape}')
    expect(outer).toHaveBeenCalledWith(expect.objectContaining({ key: 'Escape' }))
  })
})
