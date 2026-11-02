import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocationStore } from '../store/useLocationStore'
import { LocationNotice } from './LocationNotice'

const allow = vi.fn(async () => {})
const dismiss = vi.fn()

describe('LocationNotice', () => {
  beforeEach(() => {
    allow.mockClear()
    dismiss.mockClear()
    useLocationStore.setState({ noticeOpen: true, allow, dismissNotice: dismiss })
  })

  it('RF-15.1: explica el uso y ofrece Permitir y Ahora no', () => {
    render(<LocationNotice />)
    expect(screen.getByRole('dialog', { name: /dónde estás/i })).toHaveTextContent('solo para mostrarte')
    expect(screen.getByRole('button', { name: 'Permitir' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ahora no' })).toBeInTheDocument()
  })

  it('RF-15.2: «Permitir» llama a allow', async () => {
    render(<LocationNotice />)
    await userEvent.click(screen.getByRole('button', { name: 'Permitir' }))
    expect(allow).toHaveBeenCalled()
  })

  it('RF-15.3: «Ahora no» llama a dismissNotice', async () => {
    render(<LocationNotice />)
    await userEvent.click(screen.getByRole('button', { name: 'Ahora no' }))
    expect(dismiss).toHaveBeenCalled()
  })

  it('RF-15.6: no es modal', () => {
    render(<LocationNotice />)
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-modal')
  })

  it('RF-15.13: Esc equivale a «Ahora no»', async () => {
    render(<LocationNotice />)
    await userEvent.keyboard('{Escape}')
    expect(dismiss).toHaveBeenCalled()
  })

  it('RF-15.1: cerrado no muestra nada', () => {
    useLocationStore.setState({ noticeOpen: false })
    render(<LocationNotice />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
