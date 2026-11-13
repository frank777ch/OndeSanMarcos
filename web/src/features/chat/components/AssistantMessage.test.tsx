import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AssistantMessage } from './AssistantMessage'
import { act } from '@testing-library/react'
import { resetPlaces, seedPlaces } from '@/test/fixtures/places'

const renderMessage = (props: Parameters<typeof AssistantMessage>[0]) =>
  render(
    <MemoryRouter>
      <AssistantMessage {...props} />
    </MemoryRouter>,
  )

describe('AssistantMessage', () => {
  beforeEach(() => seedPlaces())
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
        { id: 'fisi', name: 'FISI', schedule: 'Lun–Vie 8:00–16:00' },
        { id: 'biblioteca-central', name: 'Biblioteca Central Pedro Zulen' },
      ],
    })
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('FISI')
    expect(items[0]).toHaveTextContent('Lun–Vie 8:00–16:00')
    expect(items[1]).toHaveTextContent('Biblioteca Central Pedro Zulen')
  })

  it('RF-05.18: se omite la tarjeta de un lugar que el mapa no conoce y se conserva el orden', () => {
    renderMessage({
      text: 'Hay tres',
      places: [
        { id: 'biblioteca-central', name: 'Biblioteca Central Pedro Zulen' },
        { id: 'no-existe', name: 'Fantasma' },
        { id: 'fisi', name: 'FISI' },
      ],
    })
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('Biblioteca Central')
    expect(items[1]).toHaveTextContent('FISI')
    expect(screen.queryByText('Fantasma')).not.toBeInTheDocument()
  })

  it('RF-28.14: si los lugares terminan de cargar después de la respuesta, la tarjeta aparece', () => {
    resetPlaces()
    renderMessage({ text: 'Mira', places: [{ id: 'fisi', name: 'FISI' }] })
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    act(() => seedPlaces())
    expect(screen.getByRole('listitem')).toHaveTextContent('FISI')
  })

  it('RF-28.13: los ids numéricos antiguos ya no coinciden con ningún lugar', () => {
    renderMessage({ text: 'Mira', places: [{ id: '8', name: 'FISI' }] })
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('RF-05.17: sin lugares no hay tarjetas', () => {
    renderMessage({ text: 'Hola', places: [] })
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
