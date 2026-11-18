import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoryChips } from '@/features/map/components/CategoryChips'
import { useMapStore } from '@/features/map/store/useMapStore'
import { useVisiblePlaces } from '@/features/map/scene/useVisiblePlaces'
import { PLACES, seedPlaces } from '@/test/fixtures/places'
import { useEventsStore } from './store/useEventsStore'
import type { CampusEvent } from './types'
import { eventEnd, formatEventWhen, isUpcoming } from './utils/eventTime'

const HOUR = 3_600_000
const event = (id: number, placeId: number | undefined, startsInHours = 24): CampusEvent => ({
  id,
  slug: `e-${id}`,
  title: `Evento ${id}`,
  startsAt: new Date(Date.now() + startsInHours * HOUR),
  endsAt: new Date(Date.now() + (startsInHours + 2) * HOUR),
  placeId,
  category: 'otro',
  status: 'scheduled',
  modality: 'in_person',
})

function seedEvents(events: CampusEvent[]) {
  useEventsStore.setState({ status: 'ready', events })
}

describe('eventos en el mapa', () => {
  beforeEach(() => {
    seedPlaces()
    useMapStore.setState({ activeCategory: null, eventsMode: false, selectedPlaceId: null, selectionOrigin: null })
    seedEvents([])
  })

  it('sin eventos próximos el botón no aparece', () => {
    render(<CategoryChips />)
    expect(screen.queryByRole('button', { name: /Eventos/ })).toBeNull()
  })

  it('con eventos aparece primero, con su contador, y es excluyente con Todos y las categorías', async () => {
    seedEvents([event(1, PLACES[0].id), event(2, PLACES[0].id), event(3, undefined)])
    render(<CategoryChips />)
    const buttons = screen.getAllByRole('button')
    expect(buttons[0]).toHaveTextContent('Eventos3')
    await userEvent.click(buttons[0])
    expect(useMapStore.getState().eventsMode).toBe(true)
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(screen.getByRole('button', { name: 'Todos' }))
    expect(useMapStore.getState().eventsMode).toBe(false)
  })

  it('un evento ya terminado no cuenta', () => {
    seedEvents([event(1, PLACES[0].id, -48)])
    render(<CategoryChips />)
    expect(screen.queryByRole('button', { name: /Eventos/ })).toBeNull()
  })

  it('en modo eventos solo se dibujan los lugares con eventos, con su cuenta', () => {
    seedEvents([event(1, PLACES[0].id), event(2, PLACES[0].id)])
    act(() => useMapStore.getState().toggleEventsMode())
    const { result } = renderHook(() => useVisiblePlaces())
    expect(result.current).toHaveLength(1)
    expect(result.current[0]).toMatchObject({ id: PLACES[0].id, eventCount: 2 })
  })

  it('elegir una categoría sale del modo eventos', () => {
    seedEvents([event(1, PLACES[0].id)])
    act(() => useMapStore.getState().toggleEventsMode())
    act(() => useMapStore.getState().toggleCategory(PLACES[0].category))
    expect(useMapStore.getState().eventsMode).toBe(false)
  })
})

describe('fechas de eventos (hora de Lima)', () => {
  it('sin fin termina a la medianoche de Lima', () => {
    const startsAt = new Date('2026-11-23T04:30:00Z') // 23:30 del 22 en Lima
    expect(eventEnd({ startsAt }).toISOString()).toBe('2026-11-23T05:00:00.000Z')
    expect(isUpcoming({ startsAt }, Date.parse('2026-11-23T04:59:00Z'))).toBe(true)
    expect(isUpcoming({ startsAt }, Date.parse('2026-11-23T05:00:00Z'))).toBe(false)
  })

  it('se escribe en español', () => {
    const startsAt = new Date('2026-11-22T15:00:00Z')
    expect(formatEventWhen({ startsAt, endsAt: new Date('2026-11-22T18:00:00Z') })).toBe('domingo 22 de noviembre, de 10:00 a 13:00')
    expect(formatEventWhen({ startsAt })).toBe('domingo 22 de noviembre, 10:00')
  })
})
