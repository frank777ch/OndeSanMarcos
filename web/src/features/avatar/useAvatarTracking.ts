import { useEffect } from 'react'
import { useRouteStore } from '@/features/routing/store/useRouteStore'
import { useLocationStore } from '@/features/map/store/useLocationStore'
import { useAvatarStore } from './useAvatarStore'

/** Sigue la ubicación del usuario mientras haya una ruta activa y un avatar elegido. */
export function useAvatarTracking() {
  const active = useRouteStore((s) => s.activeRoute !== null)
  const hasAvatar = useAvatarStore((s) => s.avatarId !== null)
  const permission = useLocationStore((s) => s.permission)
  const allowed = permission !== 'denied' && permission !== 'unsupported'

  useEffect(() => {
    if (!active || !hasAvatar || !allowed) return
    return useLocationStore.getState().startWatching()
  }, [active, hasAvatar, allowed])
}
