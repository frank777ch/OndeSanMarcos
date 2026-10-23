import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { useChatStore, type ChatMessage } from '../store/useChatStore'
import { MessageList } from './MessageList'

const retry = vi.fn()
const setChat = (over: Partial<ReturnType<typeof useChatStore.getState>>) =>
  useChatStore.setState({ messages: [], status: 'idle', error: null, lastQuery: null, retry, ...over })

const renderList = () =>
  render(
    <MemoryRouter>
      <MessageList />
    </MemoryRouter>,
  )

const log = () => screen.getByRole('log', { name: 'Conversación' })

/** jsdom no calcula el layout: se fijan las medidas de la lista. */
function layout(el: HTMLElement, { scrollHeight, clientHeight }: { scrollHeight: number; clientHeight: number }) {
  Object.defineProperty(el, 'scrollHeight', { configurable: true, value: scrollHeight })
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: clientHeight })
}

const user = (id: string, text: string): ChatMessage => ({ id, role: 'user', text })
const bot = (id: string, text: string): ChatMessage => ({ id, role: 'assistant', text, places: [] })

describe('MessageList', () => {
  beforeEach(() => {
    retry.mockReset()
    setChat({})
  })

  it('RF-05.12: con el chat vacío muestra la bienvenida', () => {
    renderList()
    expect(screen.getByText(/cualquier cosa sobre el campus/)).toBeInTheDocument()
  })

  it('RF-05.12: con mensajes ya no muestra la bienvenida', () => {
    setChat({ messages: [user('1', 'hola'), bot('2', 'Hola')] })
    renderList()
    expect(screen.queryByText(/cualquier cosa sobre el campus/)).not.toBeInTheDocument()
  })

  it('RF-05.8: mientras espera muestra «escribiendo…» después de la pregunta', () => {
    setChat({ messages: [user('1', 'hola')], status: 'sending' })
    renderList()
    expect(screen.getByRole('status')).toHaveTextContent('escribiendo…')
    expect(screen.queryByText(/cualquier cosa sobre el campus/)).not.toBeInTheDocument()
  })

  it('RF-05.10 y RF-05.11: el error trae «Reintentar», que repite la consulta', async () => {
    setChat({ messages: [user('1', 'hola')], status: 'error', error: 'El asistente tardó demasiado en responder. Inténtalo de nuevo.' })
    renderList()
    expect(screen.getByRole('alert')).toHaveTextContent('El asistente tardó demasiado')
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(retry).toHaveBeenCalledTimes(1)
  })

  it('RF-05.26: mensajes del usuario a la derecha y del asistente sin burbuja', () => {
    setChat({ messages: [user('1', 'pregunta'), bot('2', 'respuesta')] })
    renderList()
    expect(screen.getByText('pregunta').className).toContain('bg-primary')
    expect(screen.getByText('respuesta').className).not.toContain('bg-primary')
  })

  it('RF-05.27: la lista es una región aria-live «polite»', () => {
    renderList()
    expect(log()).toHaveAttribute('aria-live', 'polite')
  })

  it('RF-05.13: al añadir un mensaje baja hasta el final', () => {
    setChat({ messages: [user('1', 'hola')] })
    renderList()
    layout(log(), { scrollHeight: 900, clientHeight: 400 })
    act(() => setChat({ messages: [user('1', 'hola'), bot('2', 'respuesta')] }))
    expect(log().scrollTop).toBe(900)
  })

  it('RF-05.14: si el usuario subió a releer, la respuesta no mueve la lista y aparece el botón', () => {
    setChat({ messages: [user('1', 'hola'), bot('2', 'uno')] })
    renderList()
    layout(log(), { scrollHeight: 2000, clientHeight: 400 })
    log().scrollTop = 300
    fireEvent.scroll(log())
    expect(screen.getByRole('button', { name: 'Ir al último mensaje' })).toBeInTheDocument()

    layout(log(), { scrollHeight: 2400, clientHeight: 400 })
    act(() => setChat({ messages: [user('1', 'hola'), bot('2', 'uno'), user('3', 'otra'), bot('4', 'dos')] }))
    // el último mensaje es del asistente: no fuerza el final
    expect(log().scrollTop).toBe(300)
  })

  it('RF-05.14: el botón «Ir al último mensaje» baja al final y desaparece', async () => {
    setChat({ messages: [bot('1', 'uno')] })
    renderList()
    layout(log(), { scrollHeight: 2000, clientHeight: 400 })
    log().scrollTop = 100
    fireEvent.scroll(log())
    await userEvent.click(screen.getByRole('button', { name: 'Ir al último mensaje' }))
    expect(log().scrollTop).toBe(2000)
    fireEvent.scroll(log())
    expect(screen.queryByRole('button', { name: 'Ir al último mensaje' })).not.toBeInTheDocument()
  })

  it('RF-05.13: una pregunta propia baja al final aunque el usuario hubiera subido', () => {
    setChat({ messages: [bot('1', 'uno')] })
    renderList()
    layout(log(), { scrollHeight: 2000, clientHeight: 400 })
    log().scrollTop = 100
    fireEvent.scroll(log())
    act(() => setChat({ messages: [bot('1', 'uno'), user('2', 'nueva')], status: 'sending' }))
    expect(log().scrollTop).toBe(2000)
  })
})
