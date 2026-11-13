import { useEffect, useState } from 'react'
import { KeyRound } from 'lucide-react'
import { Button } from '@/components/Button/Button'
import { ChangePasswordDialog } from '@/features/admin/profile/components/ChangePasswordDialog'
import { useAuthStore } from '@/features/admin/store/useAuthStore'
import { fetchMe, type AdminProfile } from '@/services/api/adminClient'

const dateFormat = new Intl.DateTimeFormat('es-PE', { dateStyle: 'long' })
const dateTimeFormat = new Intl.DateTimeFormat('es-PE', { dateStyle: 'long', timeStyle: 'short' })

/** Pestaña «Perfil»: datos de la cuenta y cambio de contraseña (HU-37). */
export function AdminProfilePage() {
  const expiresAt = useAuthStore((s) => s.session?.expiresAt)
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [failed, setFailed] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchMe()
      .then((p) => !cancelled && setProfile(p))
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [])

  const created = profile && !Number.isNaN(profile.createdAt.getTime()) ? dateFormat.format(profile.createdAt) : '—'

  return (
    <section aria-label="Perfil" className="flex h-full flex-col gap-6 p-6">
      <h1 className="text-2xl">Perfil</h1>
      {failed ? (
        <p role="alert" className="text-danger">
          No pudimos cargar tus datos. Recarga la página e inténtalo de nuevo.
        </p>
      ) : (
        <dl className="grid max-w-md grid-cols-[auto_1fr] gap-x-8 gap-y-3 rounded-lg border border-border p-6">
          <dt className="text-muted">Usuario</dt>
          <dd className="m-0 font-medium">{profile?.username ?? '…'}</dd>
          <dt className="text-muted">Alta</dt>
          <dd className="m-0 font-medium">{profile ? created : '…'}</dd>
          <dt className="text-muted">Sesión vence</dt>
          <dd className="m-0 font-medium">{expiresAt ? dateTimeFormat.format(expiresAt) : '—'}</dd>
        </dl>
      )}
      <div>
        <Button variant="secondary" icon={<KeyRound size={18} aria-hidden="true" />} onClick={() => setDialogOpen(true)}>
          Cambiar contraseña
        </Button>
      </div>
      <ChangePasswordDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </section>
  )
}
