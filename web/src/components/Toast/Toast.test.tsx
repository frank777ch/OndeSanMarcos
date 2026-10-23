import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastHost } from './ToastHost'
import { useToastStore } from './toastStore'

describe('Toast', () => {
  beforeEach(() => useToastStore.setState({ toasts: [] }))
  afterEach(() => vi.useRealTimers())

  it('muestra un aviso y se puede cerrar', async () => {
    render(<ToastHost />)
    act(() => useToastStore.getState().show('Guardado', 'success', 0))
    expect(screen.getByText('Guardado')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }))
    expect(screen.queryByText('Guardado')).not.toBeInTheDocument()
  })

  it('desaparece solo tras la duración indicada', () => {
    vi.useFakeTimers()
    render(<ToastHost />)
    act(() => useToastStore.getState().show('Hola', 'info', 1000))
    expect(screen.getByText('Hola')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.queryByText('Hola')).not.toBeInTheDocument()
  })
})
