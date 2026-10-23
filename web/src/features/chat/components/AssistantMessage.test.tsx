import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AssistantMessage } from './AssistantMessage'

const renderMessage = (props: Parameters<typeof AssistantMessage>[0]) =>
  render(
    <MemoryRouter>
      <AssistantMessage {...props} />
    </MemoryRouter>,
  )

describe('AssistantMessage', () => {
  it('RF-05.5 y RF-05.7: muestra el texto respetando los saltos de línea', () => {
    renderMessage({ text: 'Línea uno\nLínea dos', places: [] })
    const text = screen.getByText(/Línea uno/)
    expect(text).toHaveTextContent('Línea uno Línea dos')
    expect(text.className).toContain('whitespace-pre-wrap')
  })

  it('RF-05.16: una tarjeta por lugar, en el orden recibido', () => {
    renderMessage({
      text: 'Hay dos',
      places: [
        { id: '8', name: 'FISI', schedule: 'Lun–Vie 8:00–16:00' },
        { id: 'biblioteca-central', name: 'Biblioteca Central Pedro Zulen' },
      ],
    })
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('FISI')
    expect(items[0]).toHaveTextContent('Lun–Vie 8:00–16:00')
    expect(items[1]).toHaveTextContent('Biblioteca Central Pedro Zulen')
  })

  it('RF-05.17: sin lugares no hay tarjetas', () => {
    renderMessage({ text: 'Hola', places: [] })
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
