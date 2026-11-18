import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { eventToInput, toAdminEvent } from '@/services/api/adminEventsApi'
import { useAdminPlacesStore } from '../places/store/useAdminPlacesStore'
import { EventsTable } from './components/EventsTable'
import { useAdminEventsStore } from './store/useAdminEventsStore'
import { canSubmitEvent, emptyEventForm, endError, eventToForm, formToEventInput, toLimaInput } from './utils/form'

const api = vi.hoisted(() => ({ save: vi.fn(), del: vi.fn() }))
vi.mock('@/services/api/adminEventsApi', async (orig) => ({
  ...(await orig<typeof import('@/services/api/adminEventsApi')>()),
  saveAdminEvent: api.save,
  deleteAdminEvent: api.del,
}))
vi.mock('@/features/events/store/useEventsStore', async (orig) => {
  const mod = await orig<typeof import('@/features/events/store/useEventsStore')>()
  return { ...mod, useEventsStore: Object.assign(mod.useEventsStore, { getState: () => ({ ...mod.useEventsStore.getState(), refresh: vi.fn() }) }) }
})

const raw = {
  id: 1, slug: 'feria-2026-11-22', title: 'Feria', starts_at: '2026-11-22T15:00:00Z', ends_at: '2026-11-22T18:00:00Z',
  is_published: true, status: 'scheduled', category: 'feria', modality: 'in_person', updated_at: '2026-11-01T00:00:00Z',
}

describe('formulario de eventos', () => {
  it('convierte las fechas a hora de Lima y de vuelta', () => {
    expect(toLimaInput('2026-11-22T15:00:00Z')).toBe('2026-11-22T10:00')
    const input = formToEventInput(eventToForm(toAdminEvent(raw)))
    expect(input.startsAt).toBe('2026-11-22T10:00:00')
    expect(input.endsAt).toBe('2026-11-22T13:00:00')
  })

  it('exige título y fecha, y que el fin no sea anterior', () => {
    const form = emptyEventForm()
    expect(canSubmitEvent(form)).toBe(false)
    expect(canSubmitEvent({ ...form, title: 'X', startsAt: '2026-11-22T10:00' })).toBe(true)
    const bad = { ...form, title: 'X', startsAt: '2026-11-22T10:00', endsAt: '2026-11-22T09:00' }
    expect(endError(bad)).toBeTruthy()
    expect(canSubmitEvent(bad)).toBe(false)
  })

  it('los textos vacíos se envían como nulo y las listas sin repetidos', () => {
    const input = formToEventInput({ ...emptyEventForm(), title: ' T ', startsAt: '2026-11-22T10:00', organizer: '  ', agenda: 'a\nA\n\nb', isFree: 'yes' })
    expect(input).toMatchObject({ title: 'T', organizer: null, agenda: ['a', 'b'], isFree: true })
  })

  it('una acción de fila reenvía el resto intacto', () => {
    expect(eventToInput(toAdminEvent(raw), { isPublished: false })).toMatchObject({ title: 'Feria', isPublished: false, category: 'feria' })
  })
})

describe('tabla de eventos', () => {
  beforeEach(() => {
    api.save.mockReset()
    api.del.mockReset()
    useAdminPlacesStore.setState({ places: [] })
    useAdminEventsStore.setState({ status: 'ready', events: [toAdminEvent(raw)], busy: {}, ragWarning: null })
  })

  it('lista los eventos y despublica tras confirmar', async () => {
    api.save.mockResolvedValue({ event: toAdminEvent({ ...raw, is_published: false }), ragSync: 'ok' })
    render(<EventsTable />)
    expect(screen.getByText('Feria')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Despublicar Feria' }))
    await userEvent.click(screen.getByRole('button', { name: 'Despublicar' }))
    await waitFor(() => expect(api.save).toHaveBeenCalled())
    expect(api.save.mock.calls[0][1]).toMatchObject({ isPublished: false, startsAt: '2026-11-22T10:00:00' })
  })

  it('borra tras confirmar y avisa si el asistente falló', async () => {
    api.del.mockResolvedValue('ok')
    render(<EventsTable />)
    await userEvent.click(screen.getByRole('button', { name: 'Borrar Feria' }))
    await userEvent.click(screen.getByRole('button', { name: 'Borrar' }))
    await waitFor(() => expect(useAdminEventsStore.getState().events).toHaveLength(0))
    expect(api.del).toHaveBeenCalledWith(1)
  })
})
