import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { useChatStore } from '@/features/chat/store/useChatStore'
import { ChatPage } from './ChatPage'

const sendChatQuery = vi.fn()
vi.mock('@/services/api/chatApi', () => ({ sendChatQuery: (q: string) => sendChatQuery(q) }))

const page = () => (
  <MemoryRouter>
    <ChatPage />
  </MemoryRouter>
)

describe('ChatPage', () => {
  beforeEach(() => {
    sendChatQuery.mockReset()
    useChatStore.setState({ messages: [], status: 'idle', error: null, lastQuery: null })
  })

  it('RF-05.12: con el chat vacío muestra la bienvenida y la caja', () => {
    render(page())
    expect(screen.getByRole('heading', { name: 'Asistente' })).toBeInTheDocument()
    expect(screen.getByText(/cualquier cosa sobre el campus/)).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Escribe tu pregunta' })).toBeInTheDocument()
  })

  it('RF-05.1 y RF-05.5: preguntar y ver la respuesta con su tarjeta de lugar', async () => {
    sendChatQuery.mockResolvedValue({
      answer: 'Puedes leer libros en la Biblioteca Central.',
      locations: [{ id: 'biblioteca-central', name: 'Biblioteca Central Pedro Zulen', schedule: 'Lun–Sáb 8:00–20:00' }],
      drawRoute: false,
      destination: null,
    })
    render(page())
    await userEvent.type(screen.getByRole('textbox'), 'En donde puedo leer libros{Enter}')
    expect(await screen.findByText('Puedes leer libros en la Biblioteca Central.')).toBeInTheDocument()
    expect(screen.getByText('En donde puedo leer libros')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ver en el mapa: Biblioteca Central/ })).toBeInTheDocument()
  })

  it('RF-05.23: la conversación sigue al salir y volver a la pantalla', async () => {
    sendChatQuery.mockResolvedValue({ answer: 'Hola', locations: [], drawRoute: false, destination: null })
    const first = render(page())
    await userEvent.type(screen.getByRole('textbox'), 'hola{Enter}')
    await screen.findByText('Hola')
    first.unmount()
    render(page())
    expect(screen.getByText('hola')).toBeInTheDocument()
    expect(screen.getByText('Hola')).toBeInTheDocument()
  })

  it('RF-05.24: el contenido mide 48 rem como máximo y la barra de scroll queda en el borde', () => {
    render(page())
    const page_ = screen.getByRole('region', { name: 'Asistente' })
    expect(page_.className).toContain('absolute')
    expect(page_.className).not.toContain('max-w-')
    const list = screen.getByRole('log', { name: 'Conversación' })
    expect(list.className).toContain('overflow-y-auto')
    expect(list.className).not.toContain('max-w-')
    expect(list.firstElementChild?.className).toContain('max-w-3xl')
    expect(screen.getByRole('textbox').closest('.max-w-3xl')).not.toBeNull()
  })

  it('RF-05.10: un error muestra el mensaje legible con «Reintentar»', async () => {
    const { ApiError } = await import('@/services/api/client')
    sendChatQuery.mockRejectedValue(new ApiError('network', 'detalle técnico'))
    render(page())
    await userEvent.type(screen.getByRole('textbox'), 'hola{Enter}')
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos conectarnos con el asistente')
    expect(screen.queryByText(/detalle técnico/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    await act(async () => {})
  })
})
