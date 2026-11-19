import { renderHook } from '@testing-library/react'
import { act } from 'react'
import { useLocationStore } from '@/features/map/store/useLocationStore'
import { useRouteStore } from '@/features/routing/store/useRouteStore'
import { AVATARS } from './avatars'
import { useAvatarStore } from './useAvatarStore'
import { useAvatarTracking } from './useAvatarTracking'

const stop = vi.fn()
const start = vi.fn(() => stop)
const ROUTE = { path: [[0, 0]] } as never

describe('useAvatarTracking', () => {
  beforeEach(() => {
    stop.mockClear()
    start.mockClear()
    useLocationStore.setState({ permission: 'granted', startWatching: start })
    useRouteStore.setState({ activeRoute: null })
    useAvatarStore.setState({ avatarId: null })
  })

  it('no sigue la ubicación sin ruta o sin avatar', () => {
    renderHook(() => useAvatarTracking())
    act(() => useAvatarStore.setState({ avatarId: AVATARS[0].id }))
    expect(start).not.toHaveBeenCalled()
  })

  it('sigue la ubicación con ruta y avatar, y deja de seguirla al quitar la ruta', () => {
    renderHook(() => useAvatarTracking())
    act(() => useAvatarStore.setState({ avatarId: AVATARS[0].id }))
    act(() => useRouteStore.setState({ activeRoute: ROUTE }))
    expect(start).toHaveBeenCalledTimes(1)
    act(() => useRouteStore.setState({ activeRoute: null }))
    expect(stop).toHaveBeenCalledTimes(1)
  })

  it('con el permiso denegado no la sigue', () => {
    useLocationStore.setState({ permission: 'denied' })
    renderHook(() => useAvatarTracking())
    act(() => {
      useAvatarStore.setState({ avatarId: AVATARS[0].id })
      useRouteStore.setState({ activeRoute: ROUTE })
    })
    expect(start).not.toHaveBeenCalled()
  })
})
