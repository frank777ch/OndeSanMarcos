import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MapActions, type MapAction } from './MapActions'

const choose = vi.fn()
const actions = (): MapAction[] => [
  { label: 'Una', icon: <i />, onClick: vi.fn() },
  {
    label: 'Avatar',
    icon: <i />,
    children: [
      { label: 'Sin avatar', icon: <i />, selected: false, onClick: choose },
      { label: 'Modelo A', icon: <i />, selected: true, onClick: choose },
    ],
  },
]
const names = () => screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))

describe('MapActions: submenú', () => {
  it('al pulsar una acción con opciones se sustituyen las acciones y se puede volver', async () => {
    render(<MapActions actions={actions()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Más acciones' }))
    await userEvent.click(screen.getByRole('button', { name: 'Avatar' }))
    expect(names()).toEqual(['Volver', 'Sin avatar', 'Modelo A', 'Cerrar acciones'])
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }))
    expect(names()).toEqual(['Una', 'Avatar', 'Cerrar acciones'])
  })

  it('marca la opción elegida y la pulsa', async () => {
    render(<MapActions actions={actions()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Más acciones' }))
    await userEvent.click(screen.getByRole('button', { name: 'Avatar' }))
    expect(screen.getByRole('button', { name: 'Modelo A' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Sin avatar' }))
    expect(choose).toHaveBeenCalled()
  })

  it('cerrar el menú reinicia el submenú', async () => {
    render(<MapActions actions={actions()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Más acciones' }))
    await userEvent.click(screen.getByRole('button', { name: 'Avatar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar acciones' }))
    await userEvent.click(screen.getByRole('button', { name: 'Más acciones' }))
    expect(names()).toEqual(['Una', 'Avatar', 'Cerrar acciones'])
  })
})
