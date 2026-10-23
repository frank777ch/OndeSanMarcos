import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useChatStore } from '../store/useChatStore'
import { ChatInput } from './ChatInput'

const send = vi.fn()
const reset = (status: 'idle' | 'sending' | 'error' = 'idle') =>
  useChatStore.setState({ messages: [], status, error: null, lastQuery: null, send })

const box = () => screen.getByRole('textbox', { name: 'Escribe tu pregunta' })
const button = () => screen.getByRole('button', { name: 'Enviar' })

describe('ChatInput', () => {
  beforeEach(() => {
    send.mockReset()
    reset()
  })

  it('RF-05.15: el foco está en la caja al entrar', () => {
    render(<ChatInput />)
    expect(box()).toHaveFocus()
  })

  it('RF-05.1: Enter envía el texto y vacía la caja', async () => {
    render(<ChatInput />)
    await userEvent.type(box(), 'Quiero ir a la cepre{Enter}')
    expect(send).toHaveBeenCalledWith('Quiero ir a la cepre')
    expect(box()).toHaveValue('')
  })

  it('RF-05.1: el botón Enviar también envía', async () => {
    render(<ChatInput />)
    await userEvent.type(box(), 'hola')
    await userEvent.click(button())
    expect(send).toHaveBeenCalledWith('hola')
  })

  it('RF-05.2: Shift+Enter inserta un salto de línea sin enviar', async () => {
    render(<ChatInput />)
    await userEvent.type(box(), 'hola{Shift>}{Enter}{/Shift}mundo')
    expect(send).not.toHaveBeenCalled()
    expect(box()).toHaveValue('hola\nmundo')
  })

  it('RF-05.3: vacío o solo espacios deshabilita el botón y Enter no envía', async () => {
    render(<ChatInput />)
    expect(button()).toBeDisabled()
    await userEvent.type(box(), '   {Enter}')
    expect(button()).toBeDisabled()
    expect(send).not.toHaveBeenCalled()
  })

  it('RF-05.4: con una consulta en curso no se envía, pero se puede seguir escribiendo', async () => {
    reset('sending')
    render(<ChatInput />)
    await userEvent.type(box(), 'otra pregunta')
    expect(box()).toHaveValue('otra pregunta')
    expect(button()).toBeDisabled()
    await userEvent.type(box(), '{Enter}')
    expect(send).not.toHaveBeenCalled()
  })

  it('RF-05.15: al terminar la consulta el foco vuelve a la caja', () => {
    reset('sending')
    render(<ChatInput />)
    act(() => (document.activeElement as HTMLElement | null)?.blur())
    expect(box()).not.toHaveFocus()
    act(() => useChatStore.setState({ status: 'idle' }))
    expect(box()).toHaveFocus()
  })

  it('RF-05.6: la caja no acepta más de 1000 caracteres', () => {
    render(<ChatInput />)
    expect(box()).toHaveAttribute('maxlength', '1000')
  })

  it('RF-05.25: muestra el texto de ayuda', () => {
    render(<ChatInput />)
    expect(
      screen.getByPlaceholderText('Puedes preguntarle cualquier información sobre el campus.'),
    ).toBeInTheDocument()
  })
})
