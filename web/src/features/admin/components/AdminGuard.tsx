import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { fetchMe } from '@/services/api/adminClient'
import { useAuthStore } from '../store/useAuthStore'

/**
 * Protege `/admin`: sin sesión va al login; con sesión confirma con el servidor
 * que sigue siendo válida antes de mostrar el área (RF-26.13, RF-26.14).
 */
export function AdminGuard() {
  const token = useAuthStore((s) => s.session?.token)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    // Un 401 ya cierra la sesión dentro de `adminClient`. Otros fallos (red, 5xx) no
    // expulsan al administrador: el siguiente 401 real lo hará.
    fetchMe()
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setVerified(true)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  if (!token) return <Navigate to="/admin/login" replace />
  if (!verified) {
    return (
      <p role="status" className="p-8 text-muted">
        Verificando sesión…
      </p>
    )
  }
  return <Outlet />
}
